import {
  FileSectionReference,
  OpenAIChatCompletionsModelId,
} from '@markprompt/core';
import { stripIndent } from 'common-tags';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';
import type { NextRequest } from 'next/server';

import {
  getHeaders,
  getMatchingSections,
  getOutputFormatInstructions,
  insertQueryStat,
  insertQueryStatUsage,
  updateQueryStat,
} from '@/lib/completions';
import { modelConfigFields } from '@/lib/config';
import {
  CONTEXT_TOKENS_CUTOFF,
  DEFAULT_TEMPLATE_CONTEXT_TAG,
  DEFAULT_TEMPLATE_IDK_TAG,
  DEFAULT_TEMPLATE_PROMPT_TAG,
  I_DONT_KNOW,
  MAX_PROMPT_LENGTH,
  STREAM_SEPARATOR,
} from '@/lib/constants';
import { checkCompletionsRateLimits } from '@/lib/rate-limits';
import {
  canUseCustomModelConfig,
  getAccessibleInsightsType,
  InsightsType,
} from '@/lib/stripe/tiers';
import {
  createServiceRoleSupabaseClient,
  getProjectConfigData,
  getTeamTierInfo,
} from '@/lib/supabase';
import { getMessageTokenCount, getTokenizer } from '@/lib/tokenizer.edge';
import {
  buildSectionReferenceFromMatchResult,
  getCompletionsResponseText,
  stringToLLMInfo,
} from '@/lib/utils';
import {
  getCompletionsUrl,
  isFalsyQueryParam,
  isTruthyQueryParam,
  isRequestFromMarkprompt,
  safeParseInt,
} from '@/lib/utils.nodeps';
import {
  ApiError,
  FileSectionMatchResult,
  FileSectionMeta,
  OpenAIModelIdWithType,
  Project,
  UsageInfo,
} from '@/types/types';

export const config = {
  runtime: 'edge',
  maxDuration: 300,
};

const isIDontKnowResponse = (
  responseText: string,
  iDontKnowMessage: string,
) => {
  return !responseText || responseText.endsWith(iDontKnowMessage);
};

const getPayload = (
  prompt: string,
  model: OpenAIModelIdWithType,
  temperature: number,
  topP: number,
  frequencyPenalty: number,
  presencePenalty: number,
  maxTokens: number,
  stream: boolean,
) => {
  const payload = {
    model: model.value,
    temperature,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    max_tokens: maxTokens,
    stream,
    n: 1,
  };
  switch (model.type) {
    case 'chat_completions': {
      return {
        ...payload,
        messages: [{ role: 'user', content: prompt }],
      };
    }
    default: {
      return { ...payload, prompt };
    }
  }
};

const getChunkText = (response: any, model: OpenAIModelIdWithType) => {
  switch (model.type) {
    case 'chat_completions': {
      return response.choices[0].delta.content;
    }
    default: {
      return response.choices[0].text;
    }
  }
};

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createServiceRoleSupabaseClient();

const allowedMethods = ['POST'];

export const buildFullPrompt = (
  template: string,
  context: string,
  prompt: string,
  iDontKnowMessage: string,
  contextTemplateKeyword: string,
  promptTemplateKeyword: string,
  iDontKnowTemplateKeyword: string,
  // If the template does not contain the {{CONTEXT}} keyword, we inject
  // the context by default. This can be prevented by setting the
  // `doNotInjectContext` variable to true.
  doNotInjectContext = false,
  // Same with query
  doNotInjectPrompt = false,
) => {
  let _template = template.replace(
    iDontKnowTemplateKeyword,
    iDontKnowMessage || I_DONT_KNOW,
  );

  if (template.includes(contextTemplateKeyword)) {
    _template = _template.replace(contextTemplateKeyword, context);
  } else if (!doNotInjectContext) {
    _template = `Here is some context which might contain valuable information to answer the question. It is in the form of sections preceded by a section id:\n\n---\n\n${context}\n\n---\n\n${_template}`;
  }

  if (template.includes(promptTemplateKeyword)) {
    _template = _template.replace(promptTemplateKeyword, prompt);
  } else if (!doNotInjectPrompt) {
    _template = `${_template}\n\nPrompt: ${prompt}\n`;
  }

  return stripIndent(_template);
};

export default async function handler(req: NextRequest) {
  // Preflight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  if (!req.method || !allowedMethods.includes(req.method)) {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    let params = await req.json();

    // The markprompt-js component is now sending a messages list (and
    // hits the /chat endpoint by default), so in case the client uses
    // the /completions apiUrl, we need to make sure we understand the
    // messages param in addition to the legacy prompt param.
    const prompt = (
      params.prompt || (params.messages?.[0]?.content as string)
    )?.substring(0, MAX_PROMPT_LENGTH);
    const iDontKnowMessage =
      (params.i_dont_know_message as string) || // v1
      (params.iDontKnowMessage as string) || // v0
      I_DONT_KNOW;

    const stream = !isFalsyQueryParam(params.stream); // Defaults to true
    const excludeFromInsights = isTruthyQueryParam(params.excludeFromInsights);
    const redact = isTruthyQueryParam(params.redact);

    const { pathname, searchParams } = new URL(req.url);

    const lastPathComponent = pathname.split('/').slice(-1)[0];
    let projectIdParam = undefined;
    // TODO: need to investigate the difference between a request
    // from the dashboard (2nd case here) and a request from
    // an external origin (1st case here).
    if (lastPathComponent === 'completions') {
      projectIdParam = searchParams.get('project');
    } else {
      projectIdParam = pathname.split('/').slice(-1)[0];
    }

    if (!projectIdParam) {
      console.error(`[COMPLETIONS] [${pathname}] Project not found`);
      return new Response('Project not found', { status: 400 });
    }

    if (!prompt) {
      console.error(`[COMPLETIONS] [${projectIdParam}] No prompt provided`);
      return new Response('No prompt provided', { status: 400 });
    }

    const projectId = projectIdParam as Project['id'];

    // Apply rate limits, in additional to middleware rate limits.
    const rateLimitResult = await checkCompletionsRateLimits({
      value: projectId,
      type: 'projectId',
    });

    if (!rateLimitResult.result.success) {
      console.error(`[COMPLETIONS] [RATE-LIMIT] [${projectId}] IP: ${req.ip}`);
      return new Response('Too many requests', { status: 429 });
    }

    let insightsType: InsightsType | undefined = 'advanced';
    if (!isRequestFromMarkprompt(req.headers.get('origin'))) {
      // Custom model configurations are part of the Pro and Enterprise plans
      // when used outside of the Markprompt dashboard.
      const teamTierInfo = await getTeamTierInfo(supabaseAdmin, projectId);
      if (!teamTierInfo || !canUseCustomModelConfig(teamTierInfo)) {
        // Custom model configurations are part of the Pro and Enterprise plans.
        for (const field of modelConfigFields) {
          params = {
            ...params,
            [field]: undefined,
          };
        }
      }
      insightsType = teamTierInfo && getAccessibleInsightsType(teamTierInfo);
    }

    const modelInfo = stringToLLMInfo(params?.model);

    const { teamId, byoOpenAIKey } = await getProjectConfigData(
      supabaseAdmin,
      projectId,
    );

    if (!teamId) {
      console.error('[COMPLETIONS] Unable to retrieve team id');
      return new Response('Unable to retrieve team id', { status: 400 });
    }

    const sanitizedQuery = prompt.trim().replaceAll('\n', ' ');

    const sectionsTs = Date.now();

    let fileSections: FileSectionMatchResult[] = [];
    let promptEmbedding: number[] | undefined = undefined;

    const usageInfo: UsageInfo = {};

    try {
      const sectionsResponse = await getMatchingSections(
        sanitizedQuery,
        params.sectionsMatchThreshold,
        params.sectionsMatchCount,
        projectId,
        byoOpenAIKey,
        'completions',
        true,
        supabaseAdmin,
      );
      fileSections = sectionsResponse.fileSections;
      promptEmbedding = sectionsResponse.promptEmbedding;
    } catch (e) {
      const { conversationId, promptId } = await insertQueryStat(
        supabaseAdmin,
        projectId,
        undefined,
        undefined,
        prompt,
        undefined,
        promptEmbedding,
        'no_sections',
        [],
        insightsType,
        excludeFromInsights,
        redact,
      );

      const headers = getHeaders([], conversationId, promptId);

      if (e instanceof ApiError) {
        return new Response(e.message, { status: e.code, headers });
      } else {
        return new Response(`${e}`, { status: 400, headers });
      }
    }

    const sectionsDelta = Date.now() - sectionsTs;

    // const { completionsTokensCount } = await getTokenCountsForProject(projectId);

    // const maxTokenLimit = 500000;
    // if (completionsTokensCount > maxTokenLimit) {
    //   return new Response('Completions token limit exceeded.', {
    //     status: 429,
    //   });
    // }

    const _prepareSectionText = (text: string) => {
      return text.replace(/\n/g, ' ').trim();
    };

    let numTokens = 0;
    let contextText = '';
    const references: FileSectionReference[] = [];

    for (const section of fileSections) {
      numTokens += section.file_sections_token_count;

      if (numTokens >= CONTEXT_TOKENS_CUTOFF) {
        break;
      }

      contextText += `Section id: ${
        section.files_path
      }\n\n${_prepareSectionText(section.file_sections_content)}\n---\n`;

      const reference = await buildSectionReferenceFromMatchResult(
        section.files_path,
        section.files_meta,
        section.source_type,
        section.source_data,
        section.file_sections_meta as FileSectionMeta,
      );
      references.push(reference);
    }

    const referencePaths = references.map((r) => r.file.path);

    // Backwards compatibility
    const promptTemplate =
      ((params.promptTemplate || params.systemPrompt) as string) ||
      `You are a very enthusiastic company representative who loves to help people! Given the following sections from the documentation (preceded by a section id), answer the question using only that information. ${getOutputFormatInstructions(
        params.outputFormat,
      )} If you are unsure and the answer is not explicitly written in the documentation, say "{{I_DONT_KNOW}}".\n\nContext sections:\n---\n{{CONTEXT}}\n\nQuestion: "{{PROMPT}}"\n\nAnswer (including related code snippets if available):\n`;

    const fullPrompt = buildFullPrompt(
      promptTemplate,
      contextText,
      sanitizedQuery,
      iDontKnowMessage,
      params.contextTag || DEFAULT_TEMPLATE_CONTEXT_TAG,
      params.promptTag || DEFAULT_TEMPLATE_PROMPT_TAG,
      params.idkTag || DEFAULT_TEMPLATE_IDK_TAG,
      !!params.doNotInjectContext,
      !!params.doNotInjectPrompt,
    );

    const payload = getPayload(
      fullPrompt,
      modelInfo.model,
      params.temperature || 0.1,
      params.topP || 1,
      params.frequencyPenalty || 0,
      params.presencePenalty || 0,
      params.maxTokens || 500,
      stream,
    );
    const url = getCompletionsUrl(modelInfo.model);

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${
          (byoOpenAIKey || process.env.OPENAI_API_KEY) ?? ''
        }`,
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const debugInfo = {
      fullPrompt,
      ts: {
        sections: sectionsDelta,
      },
    };

    if (!stream) {
      if (res.ok) {
        const json = await res.json();

        const text = getCompletionsResponseText(json, modelInfo.model);
        const idk = isIDontKnowResponse(text, iDontKnowMessage);
        const { conversationId, promptId } = await insertQueryStat(
          supabaseAdmin,
          projectId,
          undefined,
          undefined,
          prompt,
          text,
          promptEmbedding,
          idk ? 'idk' : undefined,
          references,
          insightsType,
          excludeFromInsights,
          redact,
        );

        usageInfo.completion = {
          model: modelInfo.model.value as OpenAIChatCompletionsModelId,
          tokens: json.usage,
        };

        await insertQueryStatUsage(supabaseAdmin, teamId, promptId, usageInfo);

        const headers = getHeaders(references, conversationId, promptId);

        return new Response(
          JSON.stringify({
            text,
            references,
            responseId: promptId,
            ...(params.debug ? debugInfo : {}),
          }),
          {
            status: 200,
            headers,
          },
        );
      } else {
        const message = await res.text();
        const { conversationId, promptId } = await insertQueryStat(
          supabaseAdmin,
          projectId,
          undefined,
          undefined,
          prompt,
          undefined,
          promptEmbedding,
          'api_error',
          references,
          insightsType,
          excludeFromInsights,
          redact,
        );

        const headers = getHeaders(references, conversationId, promptId);

        return new Response(
          JSON.stringify({
            message: `Unable to retrieve completions response: ${message}`,
            ...(params.debug ? debugInfo : {}),
          }),
          { status: 400, headers },
        );
      }
    }

    let counter = 0;

    // All the text associated with this query, to estimate token
    // count.
    let responseText = '';
    let didSendHeader = false;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // We need to store the prompt here before the streaming starts as
    // the prompt id needs to be sent in the header, which is done immediately.
    // We keep the prompt id and update the prompt with the generated response
    // once it is done.
    const { conversationId, promptId } = await insertQueryStat(
      supabaseAdmin,
      projectId,
      undefined,
      undefined,
      prompt,
      '',
      promptEmbedding,
      undefined,
      references,
      insightsType,
      excludeFromInsights,
      redact,
    );

    const readableStream = new ReadableStream({
      async start(controller) {
        function onParse(event: ParsedEvent | ReconnectInterval) {
          if (event.type === 'event') {
            const data = event.data;
            if (data === '[DONE]') {
              return;
            }

            try {
              if (!didSendHeader) {
                // Done sending chunks, send references. This will be
                // deprecated, in favor of passing the full reference
                // info in the response header.
                const queue = encoder.encode(
                  `${JSON.stringify(referencePaths || [])}${STREAM_SEPARATOR}`,
                );
                controller.enqueue(queue);
                didSendHeader = true;
              }
              const json = JSON.parse(data);
              const text = getChunkText(json, modelInfo.model);
              if (text?.length > 0) {
                responseText += text;
              }
              if (counter < 2 && (text?.match(/\n/) || []).length) {
                // Prefix character (e.g. "\n\n"), do nothing
                return;
              }
              const queue = encoder.encode(text);
              controller.enqueue(queue);
              counter++;
            } catch (e) {
              controller.error(e);
            }
          }
        }

        const parser = createParser(onParse);

        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }

        if (promptId) {
          const idk = isIDontKnowResponse(responseText, iDontKnowMessage);
          await updateQueryStat(
            supabaseAdmin,
            promptId,
            responseText,
            idk ? 'idk' : undefined,
          );
        }

        const tokenizer = await getTokenizer();

        const promptTokenCount = getMessageTokenCount(
          { role: 'user', content: fullPrompt },
          modelInfo.model.value as OpenAIChatCompletionsModelId,
          tokenizer,
        );

        const completionTokenCount = getMessageTokenCount(
          { role: 'assistant', content: responseText },
          modelInfo.model.value as OpenAIChatCompletionsModelId,
          tokenizer,
        );

        usageInfo.completion = {
          model: modelInfo.model.value as OpenAIChatCompletionsModelId,
          tokens: {
            prompt_tokens: promptTokenCount,
            completion_tokens: completionTokenCount,
          },
        };

        await insertQueryStatUsage(supabaseAdmin, teamId, promptId, usageInfo);

        // We're done, wind down
        parser.reset();
        controller.close();
      },
    });

    const headers = getHeaders(references, conversationId, promptId);

    // const encodedDebugInfo = headerEncoder
    //   .encode(JSON.stringify(debugInfo))
    //   .toString();
    // We need to make sure debug info is truncated to stay within
    // limits of header size.
    // headers.append('x-markprompt-debug-info', encodedDebugInfo);

    return new Response(readableStream, { headers });
  } catch (e) {
    return new Response(
      `Error processing ${req.method} request: ${JSON.stringify(e)}`,
      { status: 500 },
    );
  }
}

import {
  FileSectionReference,
  OpenAIEmbeddingsModelId,
} from '@markprompt/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { backOff } from 'exponential-backoff';
import { CreateEmbeddingResponse } from 'openai';
import { isPresent } from 'ts-is-present';

import { Database } from '@/types/supabase';
import {
  ApiError,
  ChatOutputFormat,
  CompletionsMessage,
  DbConversation,
  DbQueryStat,
  DbTeam,
  FileSectionMatchResult,
  OpenAIErrorResponse,
  Project,
  UsageInfo,
} from '@/types/types';

import { createEmbeddings, createModeration } from './openai.edge';
import {
  InsightsType,
  getNormalizedTokenCountForModelUsageInfos,
} from './stripe/tiers';
import {
  byteSize,
  getChatCompletionsResponseText,
  getChatCompletionsUrl,
} from './utils.nodeps';

export type PromptNoResponseReason = 'no_sections' | 'idk' | 'api_error';

const _insertQueryStat = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  conversationId: DbConversation['id'],
  prompt: string | undefined,
  response: string | undefined,
  embedding: number[] | undefined,
  noResponseReason: PromptNoResponseReason | undefined,
  references: FileSectionReference[] | undefined,
  redact: boolean,
): Promise<DbQueryStat['id'] | undefined> => {
  const meta: any = {
    ...(references && references?.length > 0 ? { references } : {}),
    ...(typeof noResponseReason !== 'undefined' ? { noResponseReason } : {}),
  };

  const { data } = await supabase
    .from('query_stats')
    .insert([
      {
        project_id: projectId,
        conversation_id: conversationId,
        ...(prompt ? { prompt } : {}),
        ...(response ? { response } : {}),
        ...(embedding ? { embedding: embedding as any } : {}),
        ...(typeof noResponseReason !== 'undefined'
          ? { no_response: !!noResponseReason }
          : {}),
        ...(Object.keys(meta).length > 0 ? { meta } : {}),
        ...(redact ? { processed_state: 'unprocessed' } : {}),
      },
    ])
    .select('id')
    .limit(1)
    .maybeSingle();

  return data?.id;
};

export const updateQueryStat = async (
  supabase: SupabaseClient<Database>,
  promptId: DbQueryStat['id'],
  response: string | undefined,
  noResponseReason: PromptNoResponseReason | undefined,
) => {
  const { error } = await supabase
    .from('query_stats')
    .update({
      ...(response ? { response } : {}),
      ...(typeof noResponseReason !== 'undefined'
        ? { no_response: !!noResponseReason }
        : {}),
    })
    .eq('id', promptId);
  if (error) {
    console.error('[CHAT] updateQueryStat error:', error);
  }
};

export const getMatchingSections = async (
  content: string,
  sectionsMatchThreshold: number | undefined,
  sectionsMatchCount: number | undefined,
  projectId: Project['id'],
  byoOpenAIKey: string | undefined,
  source: 'completions' | 'sections',
  moderate: boolean,
  supabaseAdmin: SupabaseClient<Database>,
): Promise<{
  fileSections: FileSectionMatchResult[];
  promptEmbedding: number[];
}> => {
  if (moderate) {
    // Moderate the content
    const moderationResponse = await createModeration(content, byoOpenAIKey);

    if ('error' in moderationResponse) {
      console.error(
        `[${source.toUpperCase()}] [CREATE-EMBEDDING] [${projectId}] - Error moderating content for prompt '${content}': ${
          moderationResponse.error
        }`,
      );
      throw new ApiError(
        400,
        `Content moderation failed: ${moderationResponse.error.message}`,
      );
    }

    if (moderationResponse?.results?.[0]?.flagged) {
      throw new ApiError(400, 'Flagged content');
    }
  }

  let embeddingResult:
    | CreateEmbeddingResponse
    | OpenAIErrorResponse
    | undefined = undefined;

  try {
    // Retry with exponential backoff in case of error. Typical cause is
    // too_many_requests.
    const modelId: OpenAIEmbeddingsModelId = 'text-embedding-ada-002';
    embeddingResult = await backOff(
      () => createEmbeddings(content, byoOpenAIKey, modelId),
      {
        startingDelay: 10000,
        numOfAttempts: 10,
      },
    );

    if ('error' in embeddingResult) {
      throw new ApiError(400, embeddingResult.error.message);
    }
  } catch (error) {
    console.error(
      `[${source.toUpperCase()}] [CREATE-EMBEDDING] [${projectId}] - Error creating embedding for prompt '${content}': ${error}`,
    );
    throw new ApiError(
      400,
      `Error creating embedding for prompt '${content}': ${error}`,
    );
  }

  const promptEmbedding = embeddingResult?.data?.[0]?.embedding;

  if (!promptEmbedding) {
    throw new ApiError(400, `Error creating embedding for prompt '${content}'`);
  }

  // We need to use the service_role admin supabase as these
  // requests come without auth, but the tables being queried
  // are subject to RLS.
  const {
    error,
    data: fileSections,
  }: {
    error: { message: string } | null;
    data: FileSectionMatchResult[] | null;
  } = await supabaseAdmin.rpc('match_file_sections', {
    project_id: projectId,
    // Somehow Supabase expects a string for the embeddings
    // entry (which is a vector type in the function definition),
    // so we just convert to any.
    embedding: promptEmbedding as any,
    match_threshold: sectionsMatchThreshold || 0.5,
    match_count: sectionsMatchCount || 10,
    min_content_length: 30,
  });

  if (error) {
    console.error(
      `[${source.toUpperCase()}] [LOAD-EMBEDDINGS] [${projectId}] - Error loading embeddings: ${
        error.message
      }`,
    );
    throw new ApiError(400, `Error loading embeddings: ${error.message}`);
  }

  if (!fileSections || fileSections?.length === 0) {
    console.error(
      `[${source.toUpperCase()}] [LOAD-EMBEDDINGS] [${projectId}] - No relevant sections found`,
    );
    throw new ApiError(400, 'No relevant sections found');
  }

  return { fileSections, promptEmbedding };
};

const createrResponseHeader = (
  references: FileSectionReference[],
  conversationId: DbConversation['id'] | undefined,
  promptId: DbQueryStat['id'] | undefined,
) => {
  const headerEncoder = new TextEncoder();
  return headerEncoder
    .encode(JSON.stringify({ references, conversationId, promptId }))
    .toString();
};

// Header max size.
const MAX_HEADER_BYTE_SIZE = 32_000;

export const getHeaders = (
  references: FileSectionReference[],
  conversationId: DbConversation['id'] | undefined,
  promptId: DbQueryStat['id'] | undefined,
) => {
  // Headers cannot include non-UTF-8 characters, so make sure any strings
  // we pass in the headers are properly encoded before sending.
  const headers = new Headers();
  let encodedHeaderData = createrResponseHeader(
    references,
    conversationId,
    promptId,
  );

  let trimmedReferences = references;
  while (
    trimmedReferences.length > 0 &&
    byteSize(encodedHeaderData) > MAX_HEADER_BYTE_SIZE
  ) {
    trimmedReferences = references.slice(0, -1);
    encodedHeaderData = createrResponseHeader(
      trimmedReferences,
      conversationId,
      promptId,
    );
  }

  headers.append('Content-Type', 'application/json');
  headers.append('x-markprompt-data', encodedHeaderData);
  return headers;
};

const conversationExists = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  conversationId: DbConversation['id'] | undefined,
): Promise<boolean> => {
  const { count } = await supabase
    .from('conversations')
    .select('id', { count: 'exact' })
    .match({ id: conversationId, project_id: projectId });
  return !!(count && count > 0);
};

const createConversation = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationMetadata: any | undefined,
): Promise<DbConversation['id'] | undefined> => {
  const { data } = await supabase
    .from('conversations')
    .insert([
      {
        project_id: projectId,
        ...(conversationMetadata
          ? { metadata: conversationMetadata }
          : undefined),
      },
    ])
    .select('*')
    .limit(1)
    .maybeSingle();

  return data?.id;
};

const getOrCreateConversationId = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  existingConversationId: DbConversation['id'] | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationMetadata: any | undefined,
): Promise<DbConversation['id'] | undefined> => {
  if (existingConversationId) {
    // Make sure the conversation still exists
    const exists = await conversationExists(
      supabase,
      projectId,
      existingConversationId,
    );
    if (exists) {
      return existingConversationId;
    }
  }
  return createConversation(supabase, projectId, conversationMetadata);
};

export const insertQueryStat = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  existingConversationId: DbConversation['id'] | undefined,
  conversationMetadata: any | undefined,
  prompt: string,
  responseText: string | undefined,
  promptEmbedding: number[] | undefined,
  errorReason: PromptNoResponseReason | undefined,
  references: FileSectionReference[],
  insightsType: InsightsType | undefined,
  // If true, only the event will be stored for global counts.
  excludeData: boolean,
  // If true, the stat will be marked as `unprocessed` and will
  // be processed to redact sensitive info.
  redact: boolean,
): Promise<{
  conversationId: DbConversation['id'] | undefined;
  promptId: DbQueryStat['id'] | undefined;
}> => {
  const conversationId = await getOrCreateConversationId(
    supabase,
    projectId,
    existingConversationId,
    conversationMetadata,
  );

  if (!conversationId) {
    throw new Error('Unable to create conversation.');
  }

  if (excludeData) {
    const promptId = await _insertQueryStat(
      supabase,
      projectId,
      conversationId,
      undefined,
      undefined,
      undefined,
      errorReason,
      undefined,
      redact,
    );
    return { conversationId, promptId };
  } else {
    // Store prompt always.
    // Store response in >= basic insights.
    // Store embeddings in >= advanced insights.
    // Store references in >= basic insights.
    const promptId = await _insertQueryStat(
      supabase,
      projectId,
      conversationId,
      prompt,
      insightsType ? responseText : undefined,
      insightsType === 'advanced' ? promptEmbedding : undefined,
      errorReason,
      insightsType ? references : undefined,
      redact,
    );
    return { conversationId, promptId };
  }
};

export const insertQueryStatUsage = async (
  supabase: SupabaseClient<Database>,
  teamId: DbTeam['id'],
  queryStatId: DbQueryStat['id'] | undefined,
  usageInfo: UsageInfo,
) => {
  await supabase
    .from('query_stats_usage')
    .insert([
      {
        team_id: teamId,
        query_stat_id: queryStatId,
        data: usageInfo,
        normalized_token_count: getNormalizedTokenCountForModelUsageInfos(
          [usageInfo.retrieval, usageInfo.completion].filter(isPresent),
        ),
      },
    ])
    .select('id')
    .limit(1)
    .maybeSingle();
};

// Given a list of user messages, generate a standalone message that
// captures the information of the previous messages, if they are
// related to the last message. This allows for more precise context
// retrieval, especially when the last message is a follow-up question
// with little to no context included (e.g. "Show me an example of this").
export const generateStandaloneMessage = async (
  lastMessage: string,
  previousMessages: string[],
  byoOpenAIKey: string | undefined,
  includeLastMessageVerbatim: boolean,
): Promise<CompletionsMessage> => {
  if (previousMessages.length === 0 && includeLastMessageVerbatim) {
    return { message: lastMessage };
  }

  const previousMessagesFormatted = previousMessages
    .slice(-5)
    .map((m, i) => {
      return `Question ${i + 1}:\n${m.replace(/\\n/gi, ' ').trim()}`;
    })
    .join('\n---\n');

  const model = 'gpt-3.5-turbo';

  const res = await fetch(getChatCompletionsUrl(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${
        (byoOpenAIKey || process.env.OPENAI_API_KEY) ?? ''
      }`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: model,
      // Temperature 1 produces better results that 0.1.
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 200,
      stream: false,
      n: 1,
      messages: [
        {
          role: 'user',
          content: `The following is a list of questions, with the last question being the most important one. Please create a new standalone question from the last one, combining the previous ones if relevant. If the previous questions have nothing to do with the latest ones, don't include them. The standalone question must capture the meaning of all the questions, if they are related to the last one.

---
${previousMessagesFormatted}
---
Last question (most important one):
${lastMessage}
---

Standalone question:`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return { message: lastMessage };
  }

  const json = await res.json();
  const standaloneMessage = getChatCompletionsResponseText(json);

  let message = standaloneMessage;
  if (includeLastMessageVerbatim) {
    message = `${lastMessage}\n${standaloneMessage}`;
  }

  return { message, usage: { tokens: json.usage, model } };
};

export const getOutputFormatInstructions = (
  outputFormat: ChatOutputFormat | undefined,
) => {
  switch (outputFormat) {
    case 'slack':
      return 'Output as Slack-flavored Markdown. For instance, bold text should be surrounded by single asterisks, and URLs should be of the form <http://example.com/>.';
    default:
      return 'Output as Markdown.';
  }
};

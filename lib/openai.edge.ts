// IMPORTANT: this code needs to be able to run on the Vercel edge runtime.
// Make sure no Node.js APIs are called/imported transitively.

import { OpenAIEmbeddingsModelId } from '@markprompt/core';
import { CreateEmbeddingResponse, CreateModerationResponse } from 'openai';

import { OpenAIErrorResponse } from '@/types/types';

import { getResponseOrThrow } from './utils';

export interface OpenAIStreamPayload {
  model: string;
  prompt: string;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
}

export const createModeration = async (
  input: string,
  byoOpenAIKey: string | undefined,
): Promise<CreateModerationResponse | OpenAIErrorResponse> => {
  return fetch('https://api.openai.com/v1/moderations', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${byoOpenAIKey || process.env.OPENAI_API_KEY!}`,
    },
    method: 'POST',
    body: JSON.stringify({ input }),
  }).then((r) => r.json());
};

export const createEmbeddings = async (
  input: string | string[],
  byoOpenAIKey: string | undefined,
  modelId: OpenAIEmbeddingsModelId,
): Promise<CreateEmbeddingResponse> => {
  if (input?.length === 0) {
    return {
      object: 'list',
      model: modelId,
      data: [],
      usage: {
        prompt_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  let preparedInput;
  if (typeof input === 'string') {
    preparedInput = input.trim().replaceAll('\n', ' ');
  } else {
    preparedInput = input.map((i) => i.trim().replaceAll('\n', ' '));
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${byoOpenAIKey || process.env.OPENAI_API_KEY!}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: modelId,
      input: preparedInput,
    }),
  });

  const jsonRes = await getResponseOrThrow<CreateEmbeddingResponse>(res);

  if ('error' in jsonRes) {
    throw new Error(JSON.stringify(jsonRes.error));
  }

  return jsonRes;
};

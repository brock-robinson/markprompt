import { backOff } from 'exponential-backoff';

import { EMBEDDING_MODEL } from './constants';
import { createEmbeddings } from './openai.edge';

export const createSectionEmbedding = async (
  chunk: string,
): Promise<{ embedding: number[]; tokenCount: number } | undefined> => {
  const embeddingResponse = await backOff(
    () => createEmbeddings(chunk, undefined, EMBEDDING_MODEL),
    {
      startingDelay: 10000,
      numOfAttempts: 10,
    },
  );

  return {
    embedding: embeddingResponse.data[0].embedding,
    tokenCount: embeddingResponse.usage.total_tokens ?? 0,
  };
};

export const bulkCreateSectionEmbeddings = async (
  sections: string[],
): Promise<{ embeddings: number[][]; tokenCount: number }> => {
  const embeddingResponse = await backOff(
    () => createEmbeddings(sections, undefined, EMBEDDING_MODEL),
    { startingDelay: 10000, numOfAttempts: 10 },
  );

  return {
    embeddings: embeddingResponse.data.map((e) => e.embedding),
    tokenCount: embeddingResponse.usage.total_tokens ?? 0,
  };
};

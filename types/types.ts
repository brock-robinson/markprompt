import {
  type OpenAIChatCompletionsModelId,
  OpenAICompletionsModelId,
  OpenAIEmbeddingsModelId,
} from '@markprompt/core';
import { MarkpromptOptions } from '@markprompt/react';

import { NangoFile } from '@/external/nango-integrations/models';

import { Database } from './supabase';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type TimeInterval = '1h' | '24h' | '7d' | '30d' | '3m' | '1y';
export type DateGranularity = 'hour' | 'day' | 'week' | 'month' | 'year';
export type HistogramStat = { start: number; end: number; value: number };
export type DateCountHistogramEntry = { date: Date; count: number };
export type ProjectUsageHistogram = {
  projectId: Project['id'];
  histogram: DateCountHistogramEntry[];
};
export type FileStats = {
  tokenCount: number;
};

export type OAuthProvider = 'github';

export type GitHubRepository = {
  name: string;
  owner: string;
  url: string;
};

export type LLMVendors = 'openai';

export type LLMInfo = {
  vendor: LLMVendors;
  model: OpenAIModelIdWithType;
};

export type OpenAIModelIdWithType =
  | { type: 'chat_completions'; value: OpenAIChatCompletionsModelId }
  | { type: 'completions'; value: OpenAICompletionsModelId }
  | { type: 'embeddings'; value: OpenAIEmbeddingsModelId };

export const DEFAULT_CHAT_COMPLETION_MODEL: OpenAIChatCompletionsModelId =
  'gpt-3.5-turbo';

export const SUPPORTED_MODELS: {
  chat_completions: OpenAIChatCompletionsModelId[];
  completions: OpenAICompletionsModelId[];
  embeddings: OpenAIEmbeddingsModelId[];
} = {
  chat_completions: [
    'gpt-4-1106-preview',
    'gpt-4-32k',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
  completions: [
    'text-davinci-003',
    'text-davinci-002',
    'text-curie-001',
    'text-babbage-001',
    'text-ada-001',
    'davinci',
    'curie',
    'babbage',
    'ada',
  ],
  embeddings: ['text-embedding-ada-002'],
};

export const getModelIdWithVendorPrefix = (model: LLMInfo) => {
  return `${model.vendor}:${model.model.value}`;
};

export const geLLMInfoFromModel = (model: OpenAIModelIdWithType): LLMInfo => {
  // Only OpenAI models are supported currently
  return { vendor: 'openai', model };
};

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbTeam = Database['public']['Tables']['teams']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Token = Database['public']['Tables']['tokens']['Row'];
export type Domain = Database['public']['Tables']['domains']['Row'];
export type Membership = Database['public']['Tables']['memberships']['Row'];
export type MembershipType =
  Database['public']['Tables']['memberships']['Row']['type'];
export type DbSource = Database['public']['Tables']['sources']['Row'];
export type DbFile = Database['public']['Tables']['files']['Row'];
export type FileSections = Database['public']['Tables']['file_sections']['Row'];
export type FileSectionMatchResult =
  Database['public']['Functions']['match_file_sections']['Returns'][number];
export type OAuthToken =
  Database['public']['Tables']['user_access_tokens']['Row'];
export type PromptConfig =
  Database['public']['Tables']['prompt_configs']['Row'];
export type DbQueryStat = Database['public']['Tables']['query_stats']['Row'];
export type DbConversation =
  Database['public']['Tables']['conversations']['Row'];
export type DbSyncQueue = Database['public']['Tables']['sync_queues']['Row'];

export type NangoSource = Omit<DbSource, 'data'> & {
  data: NangoSourceDataType;
};

export type Source = PartialBy<Pick<DbSource, 'type' | 'data'>, 'data'>;
export type FileData = {
  path: string;
  name: string;
  content: string;
  metadata?: any;
  // For some sources, such as Salesforce articles, the content is not
  // in plain Markdown (e.g. it's in HTML), but we don't want to force
  // and .html extension to the file name. Instead, we just want to
  // explicitly specify the file type that the content should be
  // processed as.
  contentType?: FileType;
};
export type PathContentData = Pick<FileData, 'path' | 'content'>;
export type Checksum = Pick<DbFile, 'path' | 'checksum'>;
export type DbFileWithoutContent = Omit<DbFile, 'raw_content'>;
export type SourceType = Pick<Source, 'type'>['type'];
export type PromptQueryStat = Pick<
  DbQueryStat,
  | 'id'
  | 'conversation_id'
  | 'created_at'
  | 'prompt'
  | 'no_response'
  | 'feedback'
>;
export type PromptQueryStatFull = Pick<
  DbQueryStat,
  | 'id'
  | 'created_at'
  | 'prompt'
  | 'response'
  | 'no_response'
  | 'feedback'
  | 'meta'
> & { conversationMetadata: any | undefined };

export type ReferenceWithOccurrenceCount = {
  path: string;
  occurrences: number;
  source_type: SourceType;
  source_data: SourceDataType | null;
};

export type PromptQueryHistogram = {
  date: string | null;
  occurrences: number | null;
};

export type TeamStats =
  Database['public']['Functions']['get_team_stats']['Returns'][number];

export type QueryStatsProcessingResponseData = {
  processed?: number;
  errored?: number;
  allProcessed?: boolean;
};

export type FileType = 'mdx' | 'mdoc' | 'md' | 'rst' | 'html' | 'txt';

export type ProjectUsage = number;
export type Usage = Record<Project['id'], ProjectUsage>;

export type SourceDataType =
  | GitHubSourceDataType
  | MotifSourceDataType
  | WebsiteSourceDataType;

export type GitHubSourceDataType = { url: string; branch?: string };

export type MotifSourceDataType = { projectDomain: string };

export type WebsiteSourceDataType = { url: string };

export type NangoIntegrationId =
  | 'salesforce-knowledge'
  | 'salesforce-knowledge-sandbox'
  | 'salesforce-case'
  | 'salesforce-case-sandbox'
  | 'notion-pages'
  | 'website-pages';

// Must match nango.yaml definition. Currently, sync id and integration id
// are identical.
export type NangoSyncId = NangoIntegrationId;

export type NangoAction = 'ADDED' | 'UPDATED' | 'DELETED';

type NangoFileMetadata = {
  deleted_at: string | null;
  last_action: NangoAction;
  first_seen_at: string;
  last_modified_at: string;
};

// nango.yaml does not allow to specify union types, so we have to
// use strings there. We fix this with the NangoRichFile type
export type NangoRichFile = Omit<NangoFile, 'contentType'> & {
  contentType: FileType;
};

export type NangoFileWithMetadata = NangoRichFile & {
  _nango_metadata: NangoFileMetadata;
};

export type NangoSourceDataType = {
  integrationId: NangoIntegrationId;
  connectionId: string;
  name: string;
  connectionConfig?: {
    instance_url?: string;
    baseUrl?: string;
  };
  syncMetadata?: any;
};

export type RobotsTxtInfo = { sitemap?: string; disallowedPaths: string[] };

export type ReferenceInfo = { name: string; href?: string };

export const API_ERROR_CODE_CONTENT_TOKEN_QUOTA_EXCEEDED = 1000;
export const API_ERROR_ID_CONTENT_TOKEN_QUOTA_EXCEEDED =
  'content_quota_exceeded';

export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message?: string | null) {
    super(message || 'API Error');
    this.code = code;
  }
}

export type TagColor =
  | 'fuchsia'
  | 'orange'
  | 'sky'
  | 'green'
  | 'neutral'
  | 'red';

export type SerializedDateRange = {
  from: number | undefined;
  to: number | undefined;
};

export type SystemStatus = 'operational' | 'downtime' | 'degraded';

export type FileSectionHeading = { value: string | undefined; depth: number };

export type FileSectionMeta = { leadHeading?: FileSectionHeading };

export type FileSectionData = {
  content: string;
} & FileSectionMeta;

export type FileSectionsData = {
  sections: FileSectionData[];
  meta: { title: string } & any;
  leadFileHeading: string | undefined;
};

// This is the same as MarkpromptOptions, except that functions are replaced
// by strings. This is mainly a helper for the UI configuration, so that we
// can display text fields to enter the function declarations and generate
// the code snippets accordingly.
export type SerializableMarkpromptOptions = Omit<
  MarkpromptOptions,
  'prompt' | 'references' | 'search'
> & {
  prompt?: MarkpromptOptions['prompt'] & {
    // TODO: remove after `systemPrompt` is part of the released library
    systemPrompt?: string;
  };
} & {
  references?: MarkpromptOptions['references'] & {
    serializedGetHref?: string;
    serializedGetLabel?: string;
  };
  search?: MarkpromptOptions['search'] & {
    serializedGetHref?: string;
  };
};

export type OpenAIErrorResponse = any;

export enum QueryFilterComparisonOperation {
  'eq' = 'eq',
  'neq' = 'neq',
  'gt' = 'gt',
  'lt' = 'lt',
  'gte' = 'gte',
  'lte' = 'lte',
  'like' = 'like',
  'ilike' = 'ilike',
  'in' = 'in',
  'is' = 'is',
}

export enum QueryFilterLogicalOperation {
  'or' = 'or',
}

type DbQueryFilterColumnName = string;
type DbQueryFilterValue = string | number | boolean | null;
type DbQueryFilterOrCondition = string;

export type DbQueryFilter =
  | [
      QueryFilterComparisonOperation,
      DbQueryFilterColumnName,
      DbQueryFilterValue,
    ]
  | ['or', DbQueryFilterOrCondition];

export type CompletionsMessage = {
  message: string;
  usage?: ModelUsageInfo;
};

export type ModelUsageInfo = {
  tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: OpenAIChatCompletionsModelId;
};

export type UsageInfo = {
  retrieval?: ModelUsageInfo;
  completion?: ModelUsageInfo;
};

export type UsagePeriod = 'monthly' | 'yearly';

export type CompletionsAllowances = { all?: number } & Partial<
  Record<OpenAIChatCompletionsModelId, number>
>;

export type CompletionAllowanceAndUsage = { allowance: number; used: number };

export type CompletionsUsageInfo = {
  usagePeriod: UsagePeriod;
  billingCycleStart: string;
  completions?: { all?: CompletionAllowanceAndUsage } & Partial<
    Record<OpenAIChatCompletionsModelId, CompletionAllowanceAndUsage>
  >;
};

export type ChatOutputFormat = 'markdown' | 'slack';

export type DbSyncQueueOverview = Pick<
  DbSyncQueue,
  'source_id' | 'created_at' | 'ended_at' | 'status'
>;

export type DbSyncQueueWithDate = Omit<
  DbSyncQueueOverview,
  'created_at' | 'ended_at'
> & {
  createdAt: Date;
  endedAt?: Date | undefined;
};

export type LogLevel = 'info' | 'debug' | 'error' | 'warn';

export type SourceConfigurationView = 'configuration' | 'logs';

export type SyncData = {
  integrationId: NangoIntegrationId;
  connectionId: string;
  syncId: NangoSyncId;
};

export type DbFileMetaChecksum = Pick<
  DbFile,
  'id' | 'meta' | 'path' | 'checksum'
>;

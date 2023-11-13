import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { PostgrestError, User, createClient } from '@supabase/supabase-js';
import { formatISO } from 'date-fns';
import { isPresent } from 'ts-is-present';

import { Database, Json } from '@/types/supabase';
import {
  DbUser,
  OAuthProvider,
  Project,
  DbSource,
  DbTeam,
  PromptQueryStat,
  DbQueryFilter,
  QueryFilterComparisonOperation,
  QueryFilterLogicalOperation,
  DbFile,
  FileSections,
  DbSyncQueue,
  LogLevel,
  DbFileMetaChecksum,
} from '@/types/types';

import { DEFAULT_MARKPROMPT_CONFIG } from './constants';
import { MarkpromptConfig } from './schema';
import {
  INFINITE_TOKEN_ALLOWANCE,
  PlanDetails,
  TeamTierInfo,
  getEmbeddingTokensAllowance,
} from './stripe/tiers';
import { generateKey } from './utils';

export const getBYOOpenAIKey = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<string | undefined> => {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('openai_key')
    .eq('id', projectId)
    .limit(1)
    .select()
    .maybeSingle();

  return data?.openai_key || undefined;
};

export const getProjectConfigData = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<{
  teamId: DbTeam['id'] | undefined;
  byoOpenAIKey: string | undefined;
  markpromptConfig: MarkpromptConfig;
}> => {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('team_id,openai_key,markprompt_config')
    .eq('id', projectId)
    .limit(1)
    .select()
    .maybeSingle();

  // We cannot use Ajv in edge runtimes, so use non-typesafe
  // parsing and assume the format is correct. Cf.
  // https://github.com/vercel/next.js/discussions/47063
  const markpromptConfig = (data?.markprompt_config ||
    JSON.parse(DEFAULT_MARKPROMPT_CONFIG)) as MarkpromptConfig;

  return {
    teamId: data?.team_id,
    byoOpenAIKey: data?.openai_key || undefined,
    markpromptConfig: markpromptConfig,
  };
};

export const getTeamTierInfo = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<TeamTierInfo | undefined> => {
  const { data } = await supabaseAdmin
    .from('teams')
    .select('stripe_price_id,plan_details,projects!inner (id)')
    .match({ 'projects.id': projectId })
    .limit(1)
    .maybeSingle();

  return data
    ? {
        stripe_price_id: data.stripe_price_id,
        plan_details: data.plan_details as PlanDetails,
      }
    : undefined;
};

export const getTeamSlugAndStripeCustomerId = async (
  supabaseAdmin: SupabaseClient<Database>,
  teamId: DbTeam['id'],
): Promise<{ slug: string; stripeCustomerId: string | null } | undefined> => {
  const { data } = await supabaseAdmin
    .from('teams')
    .select('slug,stripe_customer_id')
    .eq('id', teamId)
    .limit(1)
    .maybeSingle();

  return data
    ? {
        slug: data.slug,
        stripeCustomerId: data.stripe_customer_id,
      }
    : undefined;
};

export const setGitHubAuthState = async (
  supabase: SupabaseClient<Database>,
  userId: DbUser['id'],
): Promise<string> => {
  const state = generateKey();
  const { data } = await supabase
    .from('user_access_tokens')
    .select('id')
    .match({ user_id: userId, provider: 'github' })
    .limit(1)
    .maybeSingle();
  if (data) {
    await supabase
      .from('user_access_tokens')
      .update({ state })
      .eq('id', data.id);
  } else {
    await supabase
      .from('user_access_tokens')
      .insert([{ user_id: userId, state, provider: 'github' }]);
  }
  return state;
};

export const deleteUserAccessToken = async (
  supabase: SupabaseClient<Database>,
  userId: DbUser['id'],
  provider: OAuthProvider,
): Promise<PostgrestError | null> => {
  const { error } = await supabase
    .from('user_access_tokens')
    .delete()
    .match({ user_id: userId, provider });
  return error;
};

export const getProjectIdFromSource = async (
  supabaseAdmin: SupabaseClient<Database>,
  sourceId: DbSource['id'],
): Promise<Project['id'] | undefined> => {
  const { data } = await supabaseAdmin
    .from('sources')
    .select('project_id')
    .eq('id', sourceId)
    .limit(1)
    .maybeSingle();
  return data?.project_id || undefined;
};

export const getOrCreateUploadOrAPISource = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  type: 'file-upload' | 'api-upload',
): Promise<DbSource['id']> => {
  // const source = await getFileOrAPISource(supabase, projectId, type, data);
  const source = await getFileOrAPISource(supabase, projectId, type);

  if (source?.id) {
    return source.id;
  }

  const { data: newSourceData } = await supabase
    .from('sources')
    .insert([{ project_id: projectId, type }])
    .select('id')
    .limit(1)
    .maybeSingle();

  return newSourceData!.id;
};

export const getFileOrAPISource = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  sourceType: 'file-upload' | 'api-upload',
  // data: any,
): Promise<DbSource | undefined> => {
  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .match({ project_id: projectId, type: sourceType });

  if (error || !sources || sources.length === 0) {
    return undefined;
  }

  switch (sourceType) {
    case 'file-upload':
    case 'api-upload':
      return sources[0];
    // case 'github':
    //   return sources.find((s) => {
    //     const _data = s.data as GitHubSourceDataType;
    //     return _data.url === data.url && _data.branch === data.branch;
    //   });
    // case 'nango':
    //   return sources.find((s) => {
    //     const _data = s.data as NangoSourceDataType;
    //     return _data.identifier === data.identifier;
    //   });
    // case 'motif': {
    //   return sources.find((s) => {
    //     const _data = s.data as MotifSourceDataType;
    //     return (
    //       _data.projectDomain && _data.projectDomain === data.projectDomain
    //     );
    //   });
    // }
    // case 'website': {
    //   return sources.find((s) => {
    //     const _data = s.data as WebsiteSourceDataType;
    //     return _data.url && _data.url === data.url;
    //   });
    // }
  }
};

export const getChecksums = async (
  supabase: SupabaseClient<Database>,
  sourceId: DbSource['id'],
) => {
  const { data } = await supabase
    .from('files')
    .select('path,checksum')
    .eq('source_id', sourceId);
  return data || [];
};

export const getProjectTeam = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<DbTeam | undefined> => {
  const { data: projectData } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .limit(1)
    .maybeSingle();
  if (projectData?.team_id) {
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', projectData.team_id)
      .limit(1)
      .maybeSingle();
    return teamData || undefined;
  }

  return undefined;
};

export const getTeamUsageInfoByTeamOrProject = async (
  supabase: SupabaseClient<Database>,
  teamOrProjectId: { teamId?: DbTeam['id']; projectId?: Project['id'] },
): Promise<{
  stripe_price_id: string | null;
  team_token_count: number;
  plan_details: Json | null;
}> => {
  // eslint-disable-next-line prefer-const
  let { data, error } = await supabase
    .from('v_team_project_usage_info')
    .select('stripe_price_id,team_token_count,plan_details')
    .eq(
      teamOrProjectId.teamId ? 'team_id' : 'project_id',
      teamOrProjectId.teamId ?? teamOrProjectId.projectId,
    )
    .limit(1)
    .maybeSingle();

  // Important: data will be null in the above query if no content has been
  // indexed. In that case, just fetch the team plan details.
  if (!data || error) {
    const { data: teamProjectInfoData } = await supabase
      .from('v_team_project_info')
      .select('stripe_price_id,plan_details')
      .eq(
        teamOrProjectId.teamId ? 'team_id' : 'project_id',
        teamOrProjectId.teamId ?? teamOrProjectId.projectId,
      )
      .limit(1)
      .maybeSingle();

    if (teamProjectInfoData) {
      data = { ...teamProjectInfoData, team_token_count: 0 };
    }
  }

  return {
    stripe_price_id: data?.stripe_price_id || null,
    team_token_count: data?.team_token_count || 0,
    plan_details: data?.plan_details || null,
  };
};

export const getTokenAllowanceInfo = async (
  supabase: SupabaseClient<Database>,
  teamOrProjectId: { teamId?: DbTeam['id']; projectId?: Project['id'] },
): Promise<{
  numRemainingTokensOnPlan: number;
  usedTokens: number;
  tokenAllowance: number;
}> => {
  const teamUsageInfo = await getTeamUsageInfoByTeamOrProject(
    supabase,
    teamOrProjectId,
  );
  const usedTokens = teamUsageInfo?.team_token_count || 0;
  const tokenAllowance = getEmbeddingTokensAllowance({
    stripe_price_id: teamUsageInfo?.stripe_price_id,
    plan_details: teamUsageInfo?.plan_details as PlanDetails,
  });
  const numRemainingTokensOnPlan =
    tokenAllowance === INFINITE_TOKEN_ALLOWANCE
      ? 1_000_000_000
      : Math.max(0, tokenAllowance - usedTokens);
  return { numRemainingTokensOnPlan, usedTokens, tokenAllowance };
};

export const getJoinedTeams = async (
  supabase: SupabaseClient<Database>,
  userId: DbUser['id'],
): Promise<DbTeam[]> => {
  const { data, error } = await supabase
    .from('memberships')
    .select('user_id, teams (*)')
    .match({ user_id: userId });

  if (error) {
    throw new Error(error.message);
  }

  return (data?.map((d) => d.teams) || []) as DbTeam[];
};

export const getTeamProjectIds = async (
  supabase: SupabaseClient<Database>,
  teamId: DbTeam['id'],
): Promise<Project['id'][]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .match({ team_id: teamId });

  if (error) {
    throw new Error(error.message);
  }

  return (data?.map((d) => d.id) || []) as DbTeam['id'][];
};

export const hasUserAccessToProject = async (
  supabase: SupabaseClient<Database>,
  userId: User['id'],
  projectId: Project['id'],
): Promise<boolean> => {
  const response = await supabase
    .rpc('is_project_accessible_to_user', {
      user_id: userId,
      project_id: projectId,
    })
    .limit(1)
    .maybeSingle();
  return !!response.data?.has_access;
};

export const hasUserAdminAccessToTeam = async (
  supabase: SupabaseClient<Database>,
  userId: User['id'],
  teamId: DbTeam['id'],
): Promise<boolean> => {
  const { count: membershipCount } = await supabase
    .from('memberships')
    .select('id', { count: 'exact' })
    .match({ user_id: userId, team_id: teamId, type: 'admin' });
  return !!(membershipCount && membershipCount > 0);
};

export const SUPPORTED_QUERY_FILTER_COMPARISON_OPERATIONS: string[] =
  Object.values(QueryFilterComparisonOperation);

const SUPPORTED_QUERY_FILTER_LOGICAL_OPERATIONS: string[] = Object.values(
  QueryFilterLogicalOperation,
);

const isValidQueryFilters = (filters: DbQueryFilter[]) => {
  return (
    filters.length === 0 ||
    filters.every(
      (f) =>
        SUPPORTED_QUERY_FILTER_COMPARISON_OPERATIONS.includes(f[0]) ||
        SUPPORTED_QUERY_FILTER_LOGICAL_OPERATIONS.includes(f[0]),
    )
  );
};

export const getQueryStats = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  fromISO: string,
  toISO: string,
  limit: number,
  page: number,
  filters: DbQueryFilter[],
): Promise<{
  error: PostgrestError | null;
  queries: PromptQueryStat[] | null;
}> => {
  if (!isValidQueryFilters(filters || [])) {
    const message = `Invalid filters. Filters may only contains the following operators: ${JSON.stringify(
      [
        ...SUPPORTED_QUERY_FILTER_COMPARISON_OPERATIONS,
        ...SUPPORTED_QUERY_FILTER_LOGICAL_OPERATIONS,
      ],
    )}`;
    return {
      error: { message, details: message, hint: message, code: '' },
      queries: null,
    };
  }

  // Cf. https://github.com/orgs/supabase/discussions/3080#discussioncomment-1282318 to dynamically add filters
  const allFilters: any[] = [
    ['eq', 'project_id', projectId],
    ['or', 'processed_state.eq.processed,processed_state.eq.skipped'],
    ...filters,
    ['gte', 'created_at', fromISO],
    ['lte', 'created_at', toISO],
    ['not', 'decrypted_prompt', 'is', null],
    ['neq', 'decrypted_prompt', ''],
    ['order', 'created_at', { ascending: false }],
    ['range', page * limit, (page + 1) * limit - 1],
  ].filter(isPresent);

  const supabaseWithFilters = allFilters.reduce((acc, [fn, ...args]) => {
    return acc[fn](...args);
  }, supabase.from('v_insights_query_stats').select('id,conversation_id,created_at,decrypted_prompt,no_response,feedback'));

  const { data, error } = await supabaseWithFilters;

  if (error) {
    return { error, queries: null };
  }

  const queries = (data || []).map((q: any) => {
    const { decrypted_prompt, ...rest } = q;
    return { ...rest, prompt: decrypted_prompt } as PromptQueryStat;
  });

  return { queries, error: null };
};

export const createFile = async (
  supabase: SupabaseClient<Database>,
  // TODO: remove once migration is safely completed. We set an explicit
  // value to prevent NULL values, because if a row has a NULL value,
  // somehow it won't be returned in the inner joined filter query.
  _projectId: Project['id'],
  sourceId: DbSource['id'],
  path: string,
  meta: any,
  internalMetadata: any,
  checksum: string,
  rawContent: string,
  tokenCount?: number,
): Promise<DbFile['id'] | undefined> => {
  const { error, data } = await supabase
    .from('files')
    .insert([
      {
        source_id: sourceId,
        project_id: _projectId,
        path,
        meta,
        internal_metadata: internalMetadata,
        checksum,
        raw_content: rawContent,
        ...(tokenCount ? { token_count: tokenCount } : {}),
      },
    ])
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id as DbFile['id'];
};

export const batchStoreFileSections = async (
  supabase: SupabaseClient<Database>,
  sections: Omit<FileSections, 'id' | 'token_count'>[],
) => {
  const { error } = await supabase.from('file_sections').insert(sections);

  if (error) {
    // Too large? Attempt one embedding at a time.
    for (const section of sections) {
      await supabase.from('file_sections').insert([section]);
    }
  }
};

// Important: two files may have the same nangoId, in case where
// the same source (e.g. Salesforce Knowledge) was added twice (say with
// different filters). They are therefore distinguished by their sourceId.
export const getFilesIdAndCheksumBySourceAndNangoId = async (
  supabase: SupabaseClient<Database>,
  sourceId: DbSource['id'],
  nangoFileId: string,
): Promise<DbFileMetaChecksum[]> => {
  const { data, error } = await supabase
    .from('files')
    .select('id,meta,path,checksum')
    .eq('source_id', sourceId)
    .eq('internal_metadata->>nangoFileId', nangoFileId);

  if (error || !data) {
    return [];
  }

  return data;
};

export const batchDeleteFiles = async (
  supabase: SupabaseClient<Database>,
  ids: DbFile['id'][],
) => {
  await supabase.from('files').delete().in('id', ids);
};

// Important: two files may have the same nangoId, in case where
// the same source (e.g. Salesforce Knowledge) was added twice (say with
// different filters). They are therefore distinguished by their sourceId.
export const batchDeleteFilesBySourceAndNangoId = async (
  supabase: SupabaseClient<Database>,
  sourceId: DbSource['id'],
  ids: string[],
) => {
  await supabase
    .from('files')
    .delete()
    .eq('source_id', sourceId)
    .in('internal_metadata->>nangoFileId', ids);
};

export const getOrCreateRunningSyncQueueForSource = async (
  supabase: SupabaseClient<Database>,
  sourceId: DbSource['id'],
): Promise<DbSyncQueue['id']> => {
  const { data } = await supabase
    .from('sync_queues')
    .select('id')
    .eq('source_id', sourceId)
    .eq('status', 'running')
    .order('created_at', { ascending: false })
    .limit(1)
    .select()
    .maybeSingle();

  if (data?.id) {
    return data?.id;
  }
  return createSyncQueue(supabase, sourceId);
};

export const createSyncQueue = async (
  supabase: SupabaseClient<Database>,
  sourceId: DbSource['id'],
): Promise<DbSyncQueue['id']> => {
  const { error, data } = await supabase
    .from('sync_queues')
    .insert([{ source_id: sourceId, status: 'running' }])
    .select('id')
    .limit(1)
    .maybeSingle();
  if (error || !data?.id) {
    throw error;
  }
  return data.id;
};

export const updateSyncQueue = async (
  supabase: SupabaseClient<Database>,
  id: DbSyncQueue['id'],
  status: DbSyncQueue['status'],
  log:
    | {
        message: string;
        level: LogLevel;
      }
    | undefined,
) => {
  await updateSyncQueueStatus(supabase, id, status);
  if (log) {
    await appendLogToSyncQueue(supabase, id, log.message, log.level);
  }
};

export const updateSyncQueueStatus = async (
  supabase: SupabaseClient<Database>,
  id: DbSyncQueue['id'],
  status: DbSyncQueue['status'],
) => {
  let payload: Partial<DbSyncQueue> = { status };
  // If status if a completion status, also append the ended_at timestamp
  if (status === 'canceled' || status === 'errored' || status === 'complete') {
    payload = { ...payload, ended_at: formatISO(new Date()) };
  }
  await supabase.from('sync_queues').update(payload).eq('id', id);
};

const appendLogToSyncQueue = async (
  supabase: SupabaseClient<Database>,
  syncQueueId: DbSyncQueue['id'],
  message: string,
  level: LogLevel,
) => {
  await supabase.rpc('append_log_to_sync_queue', {
    id: syncQueueId,
    entry: {
      timestamp: formatISO(new Date()),
      message,
      level,
    },
  });
};

export const getPublicAnonSupabase = () => {
  return createClient<Database>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
};

export const createServiceRoleSupabaseClient = () => {
  return createClient<Database>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
};

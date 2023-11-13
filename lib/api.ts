import { Source } from '@markprompt/core';

import { getResponseOrThrow, slugFromNameOrRandom } from '@/lib/utils';
import {
  DbFile,
  DbUser,
  Domain,
  FileData,
  Project,
  PromptConfig,
  DbSource,
  SourceType,
  DbTeam,
  Token,
  QueryStatsProcessingResponseData,
  SerializableMarkpromptOptions,
} from '@/types/types';

import { Theme } from './themes';

export const updateUser = async (values: Partial<DbUser>): Promise<DbUser> => {
  const res = await fetch('/api/user', {
    method: 'PATCH',
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow(res);
};

export const deleteUserAndMembershipsAndTeams = async () => {
  const res = await fetch('/api/user', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow(res);
};

export const updateProject = async (
  id: Project['id'],
  values: Partial<Project>,
): Promise<Project> => {
  const res = await fetch(`/api/project/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Project>(res);
};

export const createPromptConfig = async (
  id: Project['id'],
  shareKey: string,
  config: {
    theme: Theme;
    options?: SerializableMarkpromptOptions;
  },
): Promise<PromptConfig> => {
  const res = await fetch(`/api/project/${id}/prompt-configs`, {
    method: 'POST',
    body: JSON.stringify({ shareKey, config }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<PromptConfig>(res);
};

export const deletePromptConfig = async (
  id: Project['id'],
  promptConfigId: PromptConfig['id'],
): Promise<Project> => {
  const res = await fetch(`/api/project/${id}/prompt-configs`, {
    method: 'DELETE',
    body: JSON.stringify({ promptConfigId }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Project>(res);
};

export const processFile = async (
  sourceId: DbSource['id'],
  fileData: FileData,
) => {
  const res = await fetch('/api/v1/openai/train-file', {
    method: 'POST',
    body: JSON.stringify({
      file: fileData,
      sourceId,
    }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<void>(res);
};

export const deleteFiles = async (
  projectId: Project['id'],
  ids: DbFile['id'][],
) => {
  return fetch(`/api/project/${projectId}/files`, {
    method: 'DELETE',
    body: JSON.stringify(ids),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
};

export const initUserData = async (): Promise<{
  team: DbTeam;
  project: Project;
}> => {
  const res = await fetch('/api/user/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<{ team: DbTeam; project: Project }>(res);
};

export const createTeam = async (name: string) => {
  const candidateSlug = slugFromNameOrRandom(name);
  const res = await fetch('/api/teams', {
    method: 'POST',
    body: JSON.stringify({ name, candidateSlug }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<DbTeam>(res);
};

export const updateTeam = async (
  id: DbTeam['id'],
  values: Partial<DbTeam>,
): Promise<DbTeam> => {
  const res = await fetch(`/api/team/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<DbTeam>(res);
};

export const deleteTeamAndMemberships = async (
  id: DbTeam['id'],
): Promise<any> => {
  const res = await fetch(`/api/team/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<any>(res);
};

export const createProject = async (teamId: DbTeam['id'], name: string) => {
  const res = await fetch(`/api/team/${teamId}/projects`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<Project>(res);
};

export const deleteProject = async (projectId: DbTeam['id']) => {
  fetch(`/api/project/${projectId}`, { method: 'DELETE' });
};

export const isTeamSlugAvailable = async (slug: string): Promise<boolean> => {
  const res = await fetch('/api/slug/is-team-slug-available', {
    method: 'POST',
    body: JSON.stringify({ slug }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  try {
    return getResponseOrThrow<boolean>(res);
  } catch {
    return false;
  }
};

export const isProjectSlugAvailable = async (
  teamId: DbTeam['id'],
  slug: string,
): Promise<boolean> => {
  const res = await fetch('/api/slug/is-project-slug-available', {
    method: 'POST',
    body: JSON.stringify({ teamId, slug }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  try {
    return getResponseOrThrow<boolean>(res);
  } catch {
    return false;
  }
};

export const addDomain = async (
  projectId: Project['id'],
  name: string,
): Promise<Domain> => {
  const res = await fetch(`/api/project/${projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Domain>(res);
};

export const deleteDomain = async (
  projectId: Project['id'],
  id: Domain['id'],
) => {
  fetch(`/api/project/${projectId}/domains`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
};

export const addToken = async (projectId: Project['id']): Promise<Token> => {
  const res = await fetch(`/api/project/${projectId}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ projectId }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Token>(res);
};

export const deleteToken = async (
  projectId: Project['id'],
  id: Token['id'],
) => {
  const res = await fetch(`/api/project/${projectId}/tokens`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
  return getResponseOrThrow<any>(res);
};

export const addSource = async (
  projectId: Project['id'],
  sourceType: SourceType,
  data: any,
): Promise<DbSource> => {
  const res = await fetch(`/api/project/${projectId}/sources`, {
    method: 'POST',
    body: JSON.stringify({ projectId, type: sourceType, data }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<DbSource>(res);
};

export const setSourceData = async (
  projectId: Project['id'],
  sourceId: DbSource['id'],
  data: any,
): Promise<void> => {
  const res = await fetch(`/api/project/${projectId}/sources`, {
    method: 'PATCH',
    body: JSON.stringify({ sourceId, data }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<void>(res);
};

export const deleteSource = async (
  projectId: Project['id'],
  id: DbSource['id'],
) => {
  const res = await fetch(`/api/project/${projectId}/sources`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
  return getResponseOrThrow<any>(res);
};

export const cancelSubscription = (teamId: DbTeam['id']) => {
  return fetch('/api/subscriptions/cancel', {
    method: 'POST',
    body: JSON.stringify({ teamId }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
};

export const processQueryStats = async (projectId: Project['id']) => {
  const res = await fetch(`/api/cron/query-stats?projectId=${projectId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<QueryStatsProcessingResponseData>(res);
};

export const getFileIdBySourceAndPath = async (
  projectId: Project['id'],
  source: Source,
  path: string,
) => {
  const res = await fetch(`/api/project/${projectId}/files/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ source, path }),
  });
  return getResponseOrThrow<DbFile['id']>(res);
};

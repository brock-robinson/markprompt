import Nango from '@nangohq/frontend';

import { FileData, NangoIntegrationId, Project, SyncData } from '@/types/types';

import { getResponseOrThrow } from '../utils';

export const getNangoClientInstance = () => {
  return new Nango({
    publicKey: process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY!,
  });
};

export const setMetadata = async (
  projectId: Project['id'],
  integrationId: NangoIntegrationId,
  connectionId: string,
  metadata: Record<string, any> | undefined,
) => {
  const res = await fetch(
    `/api/project/${projectId}/integrations/nango/set-metadata`,
    {
      method: 'POST',
      body: JSON.stringify({ integrationId, connectionId, metadata }),
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    },
  );
  return getResponseOrThrow<void>(res);
};

export const deleteConnection = async (
  projectId: Project['id'],
  integrationId: NangoIntegrationId,
  connectionId: string,
) => {
  const res = await fetch(
    `/api/project/${projectId}/integrations/nango/delete-connection`,
    {
      method: 'POST',
      body: JSON.stringify({ integrationId, connectionId }),
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    },
  );
  return getResponseOrThrow<void>(res);
};

export const triggerSyncs = async (
  projectId: Project['id'],
  data: SyncData[],
) => {
  const res = await fetch(
    `/api/project/${projectId}/integrations/nango/trigger-syncs`,
    {
      method: 'POST',
      body: JSON.stringify({ data }),
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    },
  );
  return getResponseOrThrow<void>(res);
};

export const getRecords = async (
  projectId: Project['id'],
  integrationId: NangoIntegrationId,
  connectionId: string,
  model: string,
  delta: string | undefined,
  offset: number | undefined,
  limit: number | undefined,
  sortBy: string | undefined,
  order: 'asc' | 'desc' | undefined,
  filter: 'added' | 'updated' | 'deleted' | undefined,
): Promise<FileData[]> => {
  const res = await fetch(
    `/api/project/${projectId}/integrations/nango/get-records`,
    {
      method: 'POST',
      body: JSON.stringify({
        integrationId,
        connectionId,
        model,
        delta,
        offset,
        limit,
        sortBy,
        order,
        filter,
      }),
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    },
  );

  const data = await getResponseOrThrow<{ fileData: FileData[] }>(res);

  return data.fileData;
};

export const sourceExists = async (
  projectId: Project['id'],
  identifier: string,
): Promise<boolean> => {
  const res = await fetch(
    `/api/project/${projectId}/integrations/nango/source-exists`,
    {
      method: 'POST',
      body: JSON.stringify({
        identifier,
      }),
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const existsRes = await getResponseOrThrow<{ exists: boolean }>(res);
  return existsRes.exists;
};

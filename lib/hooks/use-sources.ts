import { useCallback } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { isPresent } from 'ts-is-present';

import {
  DbSource,
  DbSyncQueueOverview,
  NangoIntegrationId,
  NangoSourceDataType,
} from '@/types/types';

import useProject from './use-project';
import { getIntegrationName, getSyncData } from '../integrations/nango';
import { triggerSyncs } from '../integrations/nango.client';
import { fetcher } from '../utils';

export default function useSources() {
  const { project } = useProject();
  const {
    data: sources,
    mutate,
    error,
  } = useSWR(
    project?.id ? `/api/project/${project.id}/sources` : null,
    fetcher<DbSource[]>,
  );

  const { data: latestSyncQueues, mutate: mutateSyncQueues } = useSWR(
    project?.id ? `/api/project/${project.id}/sources/syncs/latest` : null,
    fetcher<DbSyncQueueOverview[]>,
    { refreshInterval: 10000 },
  );

  const loading = !sources && !error;

  const syncAllSources = useCallback(async () => {
    if (!project?.id || !sources || sources.length === 0) {
      return;
    }
    return triggerSyncs(
      project.id,
      sources.map((d) => getSyncData(d)).filter(isPresent),
    );
  }, [project?.id, sources]);

  const syncSources = useCallback(
    (
      sources: Pick<DbSource, 'type' | 'data'>[],
      onIsMessageLoading?: (started: boolean) => void,
    ) => {
      if (!project?.id) {
        return;
      }

      const data = sources.map((s) => getSyncData(s)).filter(isPresent);
      if (data.length === 0) {
        return;
      }

      onIsMessageLoading?.(true);
      const triggerSyncPromise = triggerSyncs(project.id, data);
      toast.promise(triggerSyncPromise, {
        loading: 'Initiating sync...',
        success: () => {
          mutateSyncQueues();
          return 'Sync has been initiated';
        },
        error: 'Error initiating sync',
        finally: () => {
          onIsMessageLoading?.(false);
        },
      });
    },
    [project?.id, mutateSyncQueues],
  );

  const isNameAvailable = useCallback(
    (name: string) => {
      return !sources?.find(
        (s) =>
          s.type === 'nango' && (s.data as NangoSourceDataType).name === name,
      );
    },
    [sources],
  );

  const generateUniqueName = useCallback(
    (integrationId: NangoIntegrationId, candidateBaseName?: string) => {
      const baseName = candidateBaseName || getIntegrationName(integrationId);
      if (isNameAvailable(baseName)) {
        return baseName;
      }
      let c = 1;
      let candidateName = `${baseName} ${c}`;
      while (!isNameAvailable(candidateName)) {
        c = c + 1;
        candidateName = `${baseName} ${c}`;
      }
      return candidateName;
    },
    [isNameAvailable],
  );

  return {
    sources: (sources || []) as DbSource[],
    syncAllSources,
    syncSources,
    latestSyncQueues,
    mutateSyncQueues,
    isNameAvailable,
    generateUniqueName,
    loading,
    mutate,
  };
}

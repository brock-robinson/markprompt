import type Nango from '@nangohq/frontend';
import { FC, useCallback, useState } from 'react';

import Button from '@/components/ui/Button';
import { addSource } from '@/lib/api';
import useSources from '@/lib/hooks/use-sources';
import { deleteConnection, setMetadata } from '@/lib/integrations/nango.client';
import { generateConnectionId } from '@/lib/utils';
import { DbSource, NangoIntegrationId, Project } from '@/types/types';

import { Step, ConnectSourceStepState } from './Step';

export const addSourceAndNangoConnection = async (
  nango: Nango,
  projectId: Project['id'],
  integrationId: NangoIntegrationId,
  name: string,
  nangoConnectionConfigParams: Record<string, string> | undefined,
  syncMetadata: Record<string, string> | undefined,
  authed: boolean,
): Promise<DbSource | undefined> => {
  // Create the Nango connection. Note that nango.yaml specifies
  // `auto_start: false` to give us a chance to set the metadata
  // before we trigger the first sync.
  const connectionId = generateConnectionId();

  try {
    if (authed) {
      await nango.auth(
        integrationId,
        connectionId,
        nangoConnectionConfigParams,
      );
    } else {
      await nango.create(integrationId, connectionId, {
        params: nangoConnectionConfigParams || {},
      });
    }

    const newSource = await addSource(projectId, 'nango', {
      integrationId,
      connectionId,
      name,
      connectionConfig: nangoConnectionConfigParams,
      syncMetadata,
    });

    if (!newSource.id) {
      throw new Error('Unable to create source');
    }

    if (syncMetadata) {
      await setMetadata(projectId, integrationId, connectionId, syncMetadata);
    }

    return newSource;
  } catch (e) {
    // If there is an error, make sure to delete the Nango connection
    try {
      deleteConnection(projectId, integrationId, connectionId);
    } catch {
      // No nothing
    }
    // Throw error from nango.auth to catch on the client side.
    throw e;
  }
};

type SyncStepProps = {
  source: DbSource | undefined;
  state: ConnectSourceStepState;
  onComplete: () => void;
};

export const SyncStep: FC<SyncStepProps> = ({ source, state, onComplete }) => {
  const { syncSources } = useSources();
  const [syncStarted, setSyncStarted] = useState(false);

  const startSyncing = useCallback(async () => {
    if (!source) {
      return;
    }
    syncSources([source], (started) => {
      setSyncStarted(started);
      if (!started) {
        onComplete();
      }
    });
  }, [source, syncSources, onComplete]);

  return (
    <Step title="Sync" description="Start syncing your content." state={state}>
      <Button
        variant="cta"
        buttonSize="sm"
        onClick={startSyncing}
        disabled={state === 'not_started'}
        loading={syncStarted}
      >
        Start sync
      </Button>
    </Step>
  );
};

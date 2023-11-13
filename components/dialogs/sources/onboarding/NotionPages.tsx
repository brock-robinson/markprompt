import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode, useCallback, useState } from 'react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import { getNangoClientInstance } from '@/lib/integrations/nango.client';
import { DbSource, Project } from '@/types/types';

import { SyncStep, addSourceAndNangoConnection } from './shared';
import { Step, ConnectSourceStepState } from './Step';
import { NotionPagesSettings } from '../settings-panes/NotionPages';
import SourceDialog from '../SourceDialog';

const nango = getNangoClientInstance();

const ConnectStep = ({
  projectId,
  state,
  onDidConnect,
}: {
  projectId: Project['id'];
  state: ConnectSourceStepState;
  onDidConnect: (source: DbSource) => void;
}) => {
  const { mutate: mutateSources, generateUniqueName } = useSources();
  const [isLoading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      const integrationId = 'notion-pages';
      const name = generateUniqueName(integrationId);
      const newSource = await addSourceAndNangoConnection(
        nango,
        projectId,
        integrationId,
        name,
        undefined,
        undefined,
        true,
      );

      if (!newSource) {
        toast.error('Error connecting to Notion');
        return;
      }

      await mutateSources();
      setLoading(false);
      onDidConnect(newSource);
      toast.success('Connected to Notion');
    } catch (e: any) {
      setLoading(false);
      if (e?.type === 'callback_err' || e?.type === 'windowClosed') {
        // This is the error that is thrown when the user closes or
        // cancels the auth popup. No need to show an error here
        toast.error('Connection canceled');
        return;
      }
      toast.error('Error connecting to Notion');
    }
  }, [generateUniqueName, projectId, mutateSources, onDidConnect]);

  return (
    <Step
      title="Authorize"
      description="Sign in to Notion and select pages in your workspace to sync."
      state={state}
    >
      <Button
        variant="cta"
        buttonSize="sm"
        onClick={connect}
        loading={isLoading}
        disabled={state === 'not_started' || state === 'complete'}
      >
        {state === 'complete' ? 'Authorized' : 'Authorize Notion'}
      </Button>
    </Step>
  );
};

const ConfigureStep = ({
  projectId,
  source,
  state,
  onDidCompleteOrSkip,
}: {
  projectId: Project['id'];
  source: DbSource | undefined;
  state: ConnectSourceStepState;
  onDidCompleteOrSkip: () => void;
}) => {
  return (
    <Step
      title="Configure"
      description="Configure the source. You can always change the configuration later."
      state={state}
    >
      <NotionPagesSettings
        projectId={projectId}
        source={source}
        forceDisabled={state === 'not_started'}
        onDidCompletedOrSkip={onDidCompleteOrSkip}
      />
    </Step>
  );
};

const NotionPagesOnboardingDialog = ({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}) => {
  const { project } = useProject();
  const [source, setSource] = useState<DbSource | undefined>(undefined);
  const [didCompleteConfiguration, setDidCompleteConfiguration] =
    useState(false);

  const reset = useCallback(() => {
    // Reset state on close
    setDidCompleteConfiguration(false);
    setSource(undefined);
  }, []);

  if (!project?.id) {
    return <></>;
  }

  return (
    <SourceDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          reset();
        }
        onOpenChange?.(open);
      }}
      trigger={children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
      title="Connect Notion"
      description="Select pages to sync from your Notion workspaces."
    >
      <ConnectStep
        projectId={project.id}
        state={source ? 'complete' : 'in_progress'}
        onDidConnect={(source) => {
          setSource(source);
        }}
      />
      <ConfigureStep
        projectId={project.id}
        source={source}
        state={
          source && didCompleteConfiguration
            ? 'complete'
            : source
            ? 'in_progress'
            : 'not_started'
        }
        onDidCompleteOrSkip={() => {
          setDidCompleteConfiguration(true);
        }}
      />
      <SyncStep
        source={source}
        state={
          source && didCompleteConfiguration ? 'in_progress' : 'not_started'
        }
        onComplete={() => {
          reset();
          onOpenChange?.(false);
        }}
      />
    </SourceDialog>
  );
};

export default NotionPagesOnboardingDialog;

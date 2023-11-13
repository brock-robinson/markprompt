import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FC, JSXElementConstructor, ReactNode, useMemo, useState } from 'react';
import useSWR from 'swr';

import Button from '@/components/ui/Button';
import { FormField, FormLabel } from '@/components/ui/Forms';
import { CTABar } from '@/components/ui/SettingsCard';
import { Tag } from '@/components/ui/Tag';
import { formatShortDateTimeInTimeZone } from '@/lib/date';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import {
  getIntegrationEnvironment,
  getIntegrationEnvironmentName,
  getIntegrationId,
  getIntegrationName,
} from '@/lib/integrations/nango';
import { fetcher, removeTrailingSlash } from '@/lib/utils';
import { removeSchema } from '@/lib/utils.nodeps';
import {
  DbSource,
  DbSyncQueue,
  NangoSourceDataType,
  SourceConfigurationView,
} from '@/types/types';

import { SyncQueueLogs } from './SyncQueueLogs';
import { getTagForSyncQueue } from './utils';
import SourceDialog from '../SourceDialog';

const DeleteSourceDialog = dynamic(
  () => import('@/components/dialogs/sources/DeleteSource'),
);

type BaseConfigurationDialogProps = {
  source?: DbSource;
  defaultView?: SourceConfigurationView;
  Icon?: JSXElementConstructor<any>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

export const BaseConfigurationDialog: FC<BaseConfigurationDialogProps> = ({
  source,
  defaultView,
  Icon,
  open,
  onOpenChange,
  children,
}) => {
  const { project } = useProject();
  const { latestSyncQueues, syncSources } = useSources();
  const [syncStarted, setSyncStarted] = useState(false);
  const [showDeleteSourceDialog, setShowDeleteSourceDialog] = useState(false);

  const { data: allSyncQueuesForSource, error } = useSWR(
    project?.id && source?.id
      ? `/api/project/${project.id}/sources/syncs/${source?.id}`
      : null,
    fetcher<DbSyncQueue[]>,
  );

  const currentStatus = useMemo(() => {
    return latestSyncQueues?.find((q) => q.source_id === source?.id)?.status;
  }, [latestSyncQueues, source?.id]);

  const loadingSyncQueues = !allSyncQueuesForSource && !error;

  const lastCompletedSyncDate = useMemo(() => {
    return allSyncQueuesForSource?.find((q) => q.status === 'complete')
      ?.ended_at;
  }, [allSyncQueuesForSource]);

  const lastSyncQueue = allSyncQueuesForSource?.[0];

  const title = useMemo(() => {
    if (source?.type !== 'nango') {
      return 'Configuration';
    }
    const data = source?.data as NangoSourceDataType;
    return data?.name || getIntegrationName(data.integrationId);
  }, [source]);

  const integrationId = source && getIntegrationId(source);

  // Proper to integrations like Salesforce
  const integrationEnvironment =
    integrationId && getIntegrationEnvironment(integrationId);
  const instanceUrl = (source?.data as NangoSourceDataType)?.connectionConfig
    ?.instance_url;

  // Proper to integrations like unauthed websites
  const baseUrl = (source?.data as NangoSourceDataType)?.syncMetadata?.baseUrl;

  return (
    <SourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      Accessory={
        currentStatus ? (
          getTagForSyncQueue(currentStatus)
        ) : (
          <Tag color="orange">Not synced</Tag>
        )
      }
    >
      <div className="flex h-full flex-col">
        <Tabs.Root
          className="TabsRoot flex-grow overflow-hidden"
          defaultValue={defaultView || 'configuration'}
        >
          <Tabs.List className="TabsList" aria-label="Configure source">
            <Tabs.Trigger className="TabsTrigger" value="configuration">
              Configuration
            </Tabs.Trigger>
            <Tabs.Trigger className="TabsTrigger" value="logs">
              Logs
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content
            className="TabsContent flex-grow overflow-y-auto px-4 py-8"
            value="configuration"
          >
            <div className="FormRoot mb-6 border-b border-neutral-900 pb-6">
              <FormField>
                <FormLabel>Source</FormLabel>
                <div className="flex flex-row items-center gap-2 overflow-hidden">
                  {Icon && (
                    <Icon className="h-5 w-5 flex-none text-neutral-500" />
                  )}
                  <div className="flex-grow overflow-hidden truncate text-sm text-neutral-300">
                    {integrationId ? getIntegrationName(integrationId) : ''}
                  </div>
                </div>
              </FormField>
              {integrationEnvironment && (
                <FormField>
                  <FormLabel>Environment</FormLabel>
                  <div className="truncate text-sm text-neutral-300">
                    {getIntegrationEnvironmentName(integrationEnvironment)}
                  </div>
                </FormField>
              )}
              {instanceUrl && (
                <FormField>
                  <FormLabel>Instance URL</FormLabel>
                  <Link
                    href={instanceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="subtle-underline self-start truncate text-sm text-neutral-300"
                  >
                    {removeTrailingSlash(instanceUrl)}
                  </Link>
                </FormField>
              )}
              {baseUrl && (
                <FormField>
                  <FormLabel>Base URL</FormLabel>
                  <Link
                    href={baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="subtle-underline self-start truncate text-sm text-neutral-300"
                  >
                    {removeSchema(removeTrailingSlash(baseUrl))}
                  </Link>
                </FormField>
              )}
            </div>
            {children}
            <div className="mt-8 border-t border-neutral-900 pt-8" />
            <Button
              buttonSize="sm"
              variant="plainDanger"
              onClick={() => {
                setShowDeleteSourceDialog(true);
              }}
            >
              Delete source
            </Button>
          </Tabs.Content>
          <Tabs.Content
            className="TabsContent flex-grow overflow-y-auto"
            value="logs"
          >
            <div className="TabsContent flex-grow overflow-y-auto">
              <SyncQueueLogs
                loading={loadingSyncQueues}
                syncQueues={allSyncQueuesForSource}
              />
            </div>
          </Tabs.Content>
        </Tabs.Root>
        <div className="flex-none">
          <CTABar>
            <div className="flex flex-grow flex-row items-center gap-2">
              <div className="flex-grow">
                {lastCompletedSyncDate && (
                  <p className="animate-fade-in text-xs text-neutral-500">
                    Last sync completed on{' '}
                    {formatShortDateTimeInTimeZone(
                      parseISO(lastCompletedSyncDate),
                    )}
                  </p>
                )}
              </div>
              <Button
                className="flex-none"
                loading={syncStarted}
                disabled={lastSyncQueue?.status === 'running'}
                variant="cta"
                buttonSize="sm"
                onClick={() => {
                  if (!source) {
                    return;
                  }
                  syncSources([source], setSyncStarted);
                }}
              >
                {lastSyncQueue?.status === 'running'
                  ? 'Initiating sync...'
                  : 'Sync now'}
              </Button>
            </div>
          </CTABar>
        </div>
      </div>
      {project?.id && source && (
        <Dialog.Root
          open={!!showDeleteSourceDialog}
          onOpenChange={() => setShowDeleteSourceDialog(false)}
        >
          <DeleteSourceDialog
            projectId={project.id}
            source={source}
            onComplete={() => setShowDeleteSourceDialog(false)}
          />
        </Dialog.Root>
      )}
    </SourceDialog>
  );
};

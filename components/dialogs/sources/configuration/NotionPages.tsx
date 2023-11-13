import { FC, useMemo } from 'react';

import { NotionIcon } from '@/components/icons/Notion';
import useSources from '@/lib/hooks/use-sources';
import { DbSource, Project, SourceConfigurationView } from '@/types/types';

import { BaseConfigurationDialog } from './BaseConfiguration';
import { NotionPagesSettings } from '../settings-panes/NotionPages';

type NotionPagesConfigurationDialogProps = {
  projectId: Project['id'];
  sourceId?: DbSource['id'];
  defaultView?: SourceConfigurationView;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const NotionPagesConfigurationDialog: FC<
  NotionPagesConfigurationDialogProps
> = ({ projectId, sourceId, defaultView, open, onOpenChange }) => {
  const { sources } = useSources();

  const source = useMemo(() => {
    return sources?.find((s) => s.id === sourceId);
  }, [sources, sourceId]);

  return (
    <BaseConfigurationDialog
      source={source}
      defaultView={defaultView}
      open={open}
      onOpenChange={onOpenChange}
      Icon={NotionIcon}
    >
      <NotionPagesSettings
        projectId={projectId}
        source={source}
        forceDisabled={false}
      />
    </BaseConfigurationDialog>
  );
};

export default NotionPagesConfigurationDialog;

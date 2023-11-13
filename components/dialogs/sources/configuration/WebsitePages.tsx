import { Globe } from 'lucide-react';
import { FC, useMemo } from 'react';

import useSources from '@/lib/hooks/use-sources';
import { DbSource, Project, SourceConfigurationView } from '@/types/types';

import { BaseConfigurationDialog } from './BaseConfiguration';
import { WebsitePagesSettings } from '../settings-panes/WebsitePages';

type WebsitePagesConfigurationDialogProps = {
  projectId: Project['id'];
  sourceId?: DbSource['id'];
  defaultView?: SourceConfigurationView;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const WebsitePagesConfigurationDialog: FC<
  WebsitePagesConfigurationDialogProps
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
      Icon={(props) => <Globe {...props} strokeWidth={1.5} />}
    >
      <WebsitePagesSettings
        projectId={projectId}
        source={source}
        forceDisabled={false}
      />
    </BaseConfigurationDialog>
  );
};

export default WebsitePagesConfigurationDialog;

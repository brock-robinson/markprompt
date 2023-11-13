import { FC, useMemo } from 'react';

import { SalesforceIcon } from '@/components/icons/Salesforce';
import useSources from '@/lib/hooks/use-sources';
import { DbSource, Project, SourceConfigurationView } from '@/types/types';

import { BaseConfigurationDialog } from './BaseConfiguration';
import { SalesforceDatabaseSettings } from '../settings-panes/SalesforceDatabase';

type SalesforceDatabaseConfigurationDialogProps = {
  projectId: Project['id'];
  sourceId?: DbSource['id'];
  defaultView?: SourceConfigurationView;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const SalesforceDatabaseConfigurationDialog: FC<
  SalesforceDatabaseConfigurationDialogProps
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
      Icon={SalesforceIcon}
    >
      <SalesforceDatabaseSettings
        projectId={projectId}
        source={source}
        forceDisabled={false}
      />
    </BaseConfigurationDialog>
  );
};

export default SalesforceDatabaseConfigurationDialog;

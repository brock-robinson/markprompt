import { FC, useState } from 'react';
import { toast } from 'sonner';

import ConfirmDialog from '@/components/dialogs/Confirm';
import { deleteSource } from '@/lib/api';
import useFiles from '@/lib/hooks/use-files';
import useSources from '@/lib/hooks/use-sources';
import useUsage from '@/lib/hooks/use-usage';
import { getConnectionId, getIntegrationId } from '@/lib/integrations/nango';
import { deleteConnection } from '@/lib/integrations/nango.client';
import { getLabelForSource } from '@/lib/utils';
import { Project, DbSource } from '@/types/types';

type DeleteSourceDialogProps = {
  projectId: Project['id'];
  source: DbSource;
  onComplete: () => void;
};

const DeleteSourceDialog: FC<DeleteSourceDialogProps> = ({
  projectId,
  source,
  onComplete,
}) => {
  const { mutate: mutateFiles } = useFiles();
  const { mutate: mutateSources } = useSources();
  const { mutate: mutateFileStats } = useUsage();
  const [loading, setLoading] = useState(false);

  return (
    <ConfirmDialog
      title={`Delete ${getLabelForSource(source, true)}?`}
      description={<>All associated files and data will be deleted.</>}
      cta="Delete"
      variant="danger"
      loading={loading}
      onCTAClick={async () => {
        setLoading(true);
        try {
          await deleteSource(projectId, source.id);

          // For Nango integrations, make sure to delete the connection to
          // avoid subsequent syncs.
          if (source.type === 'nango') {
            const integrationId = getIntegrationId(source);
            const connectionId = getConnectionId(source);
            if (integrationId && connectionId) {
              try {
                // This can take a lot of time (20 seconds currently)
                // so don't await here.
                deleteConnection(projectId, integrationId, connectionId);
              } catch (e) {
                // Ignore
              }
            }
          }

          await mutateSources();
          await mutateFiles();
          await mutateFileStats();
          setLoading(false);
          onComplete();

          toast.success(`${getLabelForSource(source, true)} has been deleted`);
        } catch (e) {
          console.error(e);
          toast.error('Error deleting source');
        }
      }}
    />
  );
};

export default DeleteSourceDialog;

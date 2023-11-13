import * as Dialog from '@radix-ui/react-dialog';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { toast } from 'sonner';

import useUsage from '@/lib/hooks/use-usage';

import SourceDialog from './SourceDialog';

const Loading = <p className="p-4 text-sm text-neutral-500">Loading...</p>;

const FileDnd = dynamic(() => import('@/components/files/FileDnd'), {
  loading: () => Loading,
});

const DocsLimit = dynamic(() => import('@/components/files/DocsLimit'), {
  loading: () => Loading,
});

const FilesAddSourceDialog = ({
  open,
  onOpenChange,
  onDidAddSource,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDidAddSource?: () => void;
  children?: ReactNode;
}) => {
  const { isInfiniteEmbeddingsTokensAllowance } = useUsage();

  return (
    <SourceDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
      title="Connect Notion"
      description="Sync pages from a Notion workspace."
    >
      <div className="flex-grow p-4">
        <FileDnd
          onTrainingComplete={() => {
            toast.success('Processing complete.', {
              id: 'processing-complete',
            });
            setTimeout(async () => {
              onOpenChange?.(false);
              onDidAddSource?.();
            }, 1000);
          }}
        />
      </div>
      {!isInfiniteEmbeddingsTokensAllowance && (
        <div className="border-t border-neutral-900">
          <DocsLimit />
        </div>
      )}
    </SourceDialog>
  );
};

export default FilesAddSourceDialog;

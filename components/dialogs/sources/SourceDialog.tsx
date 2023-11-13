import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode } from 'react';

const SourceDialog = ({
  title,
  description,
  open,
  onOpenChange,
  trigger,
  Accessory,
  children,
}: {
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  trigger?: ReactNode;
  Accessory?: ReactNode | undefined;
  children: ReactNode;
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content flex h-[90%] max-h-[720px] w-[90%] max-w-[640px] flex-col">
          <div className="flex flex-none flex-row items-center gap-4 border-b border-neutral-900 px-4 py-4">
            <div className="flex flex-grow flex-col gap-1">
              <Dialog.Title className="flex-none text-base font-bold text-neutral-100">
                {title}
              </Dialog.Title>
              {description && (
                <p className="text-sm text-neutral-500">{description}</p>
              )}
            </div>
            {Accessory && <div className="flex-none">{Accessory}</div>}
          </div>
          <div className="flex-grow overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SourceDialog;

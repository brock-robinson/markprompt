import * as Dialog from '@radix-ui/react-dialog';
import { Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FC, JSXElementConstructor, ReactNode, useState } from 'react';

import { NotionIcon } from '@/components/icons/Notion';
import { SalesforceFullIcon } from '@/components/icons/Salesforce';
import Button from '@/components/ui/Button';
import { CTABar } from '@/components/ui/SettingsCard';
import emitter, { EVENT_OPEN_CONTACT } from '@/lib/events';
import { getIntegrationName } from '@/lib/integrations/nango';
import { NangoIntegrationId } from '@/types/types';

type SourceSpec = {
  integrationId: NangoIntegrationId;
  Icon: JSXElementConstructor<any>;
};

const SalesforceDatabaseOnboardingDialog = dynamic(
  () => import('@/components/dialogs/sources/onboarding/SalesforceDatabase'),
);

const NotionPagesOnboardingDialog = dynamic(
  () => import('@/components/dialogs/sources/onboarding/NotionPages'),
);

const WebsitePagesOnboardingDialog = dynamic(
  () => import('@/components/dialogs/sources/onboarding/WebsitePages'),
);

const sources: SourceSpec[] = [
  {
    integrationId: 'notion-pages',
    Icon: NotionIcon,
  },
  {
    integrationId: 'salesforce-knowledge',
    Icon: SalesforceFullIcon,
  },
  {
    integrationId: 'salesforce-case',
    Icon: SalesforceFullIcon,
  },
  {
    integrationId: 'website-pages',
    Icon: (props) => <Globe {...props} strokeWidth={1.5} />,
  },
];

const SourceButton: FC<
  {
    source: SourceSpec;
  } & {
    onSelected: () => void;
  }
> = ({ source: { integrationId, Icon }, onSelected }) => {
  return (
    <button
      className="button-ring group flex flex-col items-center justify-start gap-4 rounded-md px-2 py-4 transition hover:bg-neutral-900"
      onClick={() => onSelected()}
    >
      <Icon className="h-10 w-10 flex-none text-neutral-300 group-hover:text-neutral-100 group-focus:text-neutral-100" />
      <p className="flex flex-grow items-center text-sm font-medium text-neutral-300 group-hover:text-neutral-100">
        {getIntegrationName(integrationId)}
      </p>
    </button>
  );
};

const SourcesDialog = ({
  // onSourceSelected,
  children,
}: {
  // onSourceSelected: (integrationId: NangoIntegrationId) => void;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [connectSourceDialogOpen, setConnectSourceDialogOpen] = useState<
    | {
        // Add other IDs manually here until they are moved to Nango
        dialogId:
          | NangoIntegrationId
          | 'motif'
          | 'github'
          | 'website'
          | 'api-uploads';
      }
    | undefined
  >(undefined);

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
          <Dialog.Content
            className="animate-dialog-slide-in dialog-content flex max-h-[90%] w-[90%] max-w-[500px] flex-col"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex-none">
              <Dialog.Title className="dialog-title flex-none">
                Connect source
              </Dialog.Title>
              <div className="dialog-description flex flex-none flex-col gap-2 border-b border-neutral-900 pb-4">
                Once you connect a source, you can start using it as context for
                your agents and chatbots.
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto px-4 pt-4 pb-12">
              {sources.map((source, i) => (
                <SourceButton
                  key={`source-${source.integrationId}-${i}`}
                  source={source}
                  onSelected={() => {
                    setOpen(false);
                    setConnectSourceDialogOpen({
                      dialogId: source.integrationId,
                    });
                  }}
                />
              ))}
            </div>
            <CTABar>
              <div className="flex w-full flex-grow flex-row items-center justify-start gap-4">
                <p className="flex-grow text-xs text-neutral-500">
                  Need another source?
                </p>
                <Button
                  variant="plain"
                  buttonSize="sm"
                  onClick={() => {
                    emitter.emit(EVENT_OPEN_CONTACT);
                  }}
                >
                  Request source
                </Button>
              </div>
            </CTABar>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <SalesforceDatabaseOnboardingDialog
        databaseType="knowledge"
        open={
          connectSourceDialogOpen?.dialogId === 'salesforce-knowledge' ||
          connectSourceDialogOpen?.dialogId === 'salesforce-knowledge-sandbox'
        }
        onOpenChange={(open) => {
          if (!open) {
            setConnectSourceDialogOpen(undefined);
          }
        }}
      />
      <SalesforceDatabaseOnboardingDialog
        databaseType="case"
        open={
          connectSourceDialogOpen?.dialogId === 'salesforce-case' ||
          connectSourceDialogOpen?.dialogId === 'salesforce-case-sandbox'
        }
        onOpenChange={(open) => {
          if (!open) {
            setConnectSourceDialogOpen(undefined);
          }
        }}
      />
      <NotionPagesOnboardingDialog
        open={connectSourceDialogOpen?.dialogId === 'notion-pages'}
        onOpenChange={(open) => {
          if (!open) {
            setConnectSourceDialogOpen(undefined);
          }
        }}
      />
      <WebsitePagesOnboardingDialog
        open={connectSourceDialogOpen?.dialogId === 'website-pages'}
        onOpenChange={(open) => {
          if (!open) {
            setConnectSourceDialogOpen(undefined);
          }
        }}
      />
    </>
  );
};

export default SourcesDialog;

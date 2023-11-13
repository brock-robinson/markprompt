import * as Dialog from '@radix-ui/react-dialog';
import {
  ErrorMessage,
  Field,
  Formik,
  FormikErrors,
  FormikValues,
} from 'formik';
import { ReactNode, useCallback, useState } from 'react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import {
  ErrorLabel,
  FormField,
  FormLabel,
  FormRoot,
} from '@/components/ui/Forms';
import { NoAutoInput } from '@/components/ui/Input';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import { getNangoClientInstance } from '@/lib/integrations/nango.client';
import { fetchPageContent } from '@/lib/integrations/website';
import { extractMeta } from '@/lib/markdown';
import { addSchemaRemoveTrailingSlashAndHash } from '@/lib/utils';
import { guessShortNameFromTitle } from '@/lib/utils.nodeps';
import { DbSource, Project } from '@/types/types';

import { SyncStep, addSourceAndNangoConnection } from './shared';
import { Step, ConnectSourceStepState } from './Step';
import { WebsitePagesSettings } from '../settings-panes/WebsitePages';
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

  return (
    <Step
      title="Set base URL"
      description="Select the website to import."
      state={state}
    >
      <Formik
        initialValues={{ url: '' }}
        enableReinitialize
        validateOnMount
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          setSubmitting(true);

          let url = addSchemaRemoveTrailingSlashAndHash(values.url);

          let content = await fetchPageContent(url, false, true);

          if (!content) {
            // Check with http:// instea of https://
            url = addSchemaRemoveTrailingSlashAndHash(values.url, true);
            content = await fetchPageContent(url, false, true);
          }

          if (!content) {
            const errors: FormikErrors<FormikValues> = {
              url: `Website is not accessible. If your website has security
                  checks, this might be the reason. Please contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} to discuss options.`,
            };
            setErrors(errors);
            return;
          }

          const integrationId = 'website-pages';
          const meta = extractMeta(content, 'html');
          const pageTitle = (meta as any)?.title;
          const guessedNameFromTitle =
            pageTitle && guessShortNameFromTitle(pageTitle);
          const name = generateUniqueName(integrationId, guessedNameFromTitle);

          const newSource = await addSourceAndNangoConnection(
            nango,
            projectId,
            integrationId,
            name,
            undefined,
            { baseUrl: url },
            false,
          );

          if (!newSource) {
            toast.error(`Error connecting to ${url}`);
            return;
          }

          await mutateSources();
          setSubmitting(false);

          onDidConnect(newSource);
          toast.success(`Connected to ${url}`);
        }}
      >
        {({ isSubmitting, isValid }) => (
          <FormRoot>
            <FormField>
              <FormLabel>Base URL</FormLabel>
              <Field
                className="flex-grow"
                type="text"
                name="url"
                inputSize="sm"
                as={NoAutoInput}
                disabled={isSubmitting || state === 'complete'}
              />
              <ErrorMessage name="url" component={ErrorLabel} />
            </FormField>
            <Button
              className="place-self-start"
              disabled={!isValid || state === 'complete'}
              loading={isSubmitting}
              variant="cta"
              buttonSize="sm"
              type="submit"
            >
              {state === 'complete' ? 'Connected' : 'Connect'}
            </Button>
          </FormRoot>
        )}
      </Formik>
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
      <WebsitePagesSettings
        projectId={projectId}
        source={source}
        forceDisabled={state === 'not_started'}
        onDidCompletedOrSkip={onDidCompleteOrSkip}
      />
    </Step>
  );
};

const WebsitePagesOnboardingDialog = ({
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
      title="Connect website"
      description="Select pages to sync from your website."
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
        state={source ? 'in_progress' : 'not_started'}
        onComplete={() => {
          reset();
          onOpenChange?.(false);
        }}
      />
    </SourceDialog>
  );
};

export default WebsitePagesOnboardingDialog;

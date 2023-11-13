import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
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
import {
  SalesforceEnvironment,
  getSalesforceDatabaseIntegrationId,
} from '@/lib/integrations/salesforce';
import type { SalesforceDatabaseType } from '@/lib/integrations/salesforce';
import { isUrl } from '@/lib/utils';
import { DbSource, Project } from '@/types/types';

import { SyncStep, addSourceAndNangoConnection } from './shared';
import { Step, ConnectSourceStepState } from './Step';
import { SalesforceDatabaseSettings } from '../settings-panes/SalesforceDatabase';
import SourceDialog from '../SourceDialog';

const nango = getNangoClientInstance();

const ConnectStep = ({
  projectId,
  databaseType,
  state,
  onDidConnect,
}: {
  projectId: Project['id'];
  databaseType: SalesforceDatabaseType;
  state: ConnectSourceStepState;
  onDidConnect: (source: DbSource) => void;
}) => {
  const { mutate: mutateSources, generateUniqueName } = useSources();

  const connect = useCallback(
    async (environment: SalesforceEnvironment, instanceUrl: string) => {
      try {
        const integrationId = getSalesforceDatabaseIntegrationId(
          databaseType,
          environment,
        );
        const name = generateUniqueName(integrationId);
        const newSource = await addSourceAndNangoConnection(
          nango,
          projectId,
          integrationId,
          name,
          { instance_url: instanceUrl },
          undefined,
          true,
        );
        if (!newSource) {
          toast.error('Error connecting to Salesforce');
          return;
        }
        await mutateSources();
        onDidConnect(newSource);
        toast.success('Connected to Salesforce');
      } catch (e: any) {
        if (e?.type === 'callback_err') {
          // This is the error that is thrown when the user closes or
          // cancels the auth popup. No need to show an error here
          toast.error(`Connection canceled`);
          return;
        }
        toast.error('Error connecting to Salesforce');
      }
    },
    [databaseType, generateUniqueName, projectId, mutateSources, onDidConnect],
  );

  const isEditingState = !(state === 'not_started' || state === 'complete');

  return (
    <Step
      title="Authorize"
      description="Sign in to your Salesforce environment."
      state={state}
    >
      <Formik
        initialValues={{
          environment: 'production' as SalesforceEnvironment,
          instanceUrl: '',
        }}
        enableReinitialize
        validate={async (values) => {
          const errors: FormikErrors<FormikValues> = {};
          if (values.instanceUrl && !isUrl(values.instanceUrl)) {
            errors.instanceUrl = 'Please provide a valid instance URL.';
          }
          return errors;
        }}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          if (!isUrl(values.instanceUrl)) {
            setErrors({
              instanceUrl: 'Please provide a valid instance URL.',
            });
            return;
          }
          setSubmitting(true);
          await connect(values.environment, values.instanceUrl);
          setSubmitting(false);
        }}
      >
        {({ isSubmitting, isValid, values, setFieldValue }) => (
          <FormRoot>
            <FormField>
              <FormLabel>Environment</FormLabel>
              <RadioGroup.Root
                className="RadioGroupRoot RadioGroupRootRowLayout gap-6"
                defaultValue={values.environment}
                disabled={isSubmitting || !isEditingState}
                aria-label="Select environment"
                onValueChange={(value) => {
                  setFieldValue('environment', value);
                }}
              >
                <div className="flex cursor-pointer flex-row items-center gap-2">
                  <RadioGroup.Item
                    className="RadioGroupItem"
                    value="production"
                    id="production"
                  >
                    <RadioGroup.Indicator className="RadioGroupIndicator" />
                  </RadioGroup.Item>
                  <label
                    className="cursor-pointer select-none pl-1 text-sm text-white"
                    htmlFor="production"
                  >
                    Production
                  </label>
                </div>
                <div className="flex cursor-pointer flex-row items-center gap-2">
                  <RadioGroup.Item
                    className="RadioGroupItem"
                    value="sandbox"
                    id="sandbox"
                  >
                    <RadioGroup.Indicator className="RadioGroupIndicator" />
                  </RadioGroup.Item>
                  <label
                    className="cursor-pointer select-none pl-1 text-sm text-white"
                    htmlFor="sandbox"
                  >
                    Sandbox
                  </label>
                </div>
              </RadioGroup.Root>
            </FormField>
            <FormField>
              <FormLabel>Instance URL</FormLabel>
              <Field
                className="flex-grow"
                type="text"
                name="instanceUrl"
                inputSize="sm"
                as={NoAutoInput}
                disabled={isSubmitting || !isEditingState}
              />
              <ErrorMessage name="instanceUrl" component={ErrorLabel} />
            </FormField>
            <Button
              className="self-start"
              variant="cta"
              buttonSize="sm"
              type="submit"
              loading={isSubmitting}
              disabled={!isValid || !isEditingState}
            >
              {state === 'complete' ? 'Authorized' : 'Authorize Salesforce'}
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
      <SalesforceDatabaseSettings
        projectId={projectId}
        source={source}
        forceDisabled={state === 'not_started'}
        onDidCompletedOrSkip={onDidCompleteOrSkip}
      />
    </Step>
  );
};

const SalesforceDatabaseOnboardingDialog = ({
  databaseType,
  open,
  onOpenChange,
  children,
}: {
  databaseType: SalesforceDatabaseType;
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
      title={
        databaseType === 'knowledge'
          ? 'Connect Salesforce Knowledge'
          : 'Connect Salesforce Case'
      }
      description="Specify how to query your Salesforce database"
    >
      <ConnectStep
        projectId={project.id}
        databaseType={databaseType}
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

export default SalesforceDatabaseOnboardingDialog;

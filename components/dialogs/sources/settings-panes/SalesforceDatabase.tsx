import {
  ErrorMessage,
  Field,
  Formik,
  FormikErrors,
  FormikValues,
} from 'formik';
import { FC, useCallback } from 'react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import {
  ErrorLabel,
  FormField,
  FormLabel,
  FormRoot,
} from '@/components/ui/Forms';
import { NoAutoInput } from '@/components/ui/Input';
import { setSourceData } from '@/lib/api';
import useSources from '@/lib/hooks/use-sources';
import { setMetadata } from '@/lib/integrations/nango.client';
import { SalesforceSyncMetadata } from '@/lib/integrations/salesforce';
import { parseProcessorOptions } from '@/lib/schema';
import { capitalize } from '@/lib/utils';
import { DbSource, NangoSourceDataType, Project } from '@/types/types';

import { SalesforceSharedForm } from './SalesforceSharedForm';
import { prepareFields } from './utils';

type SalesforceDatabaseSettingsProps = {
  projectId: Project['id'];
  source: DbSource | undefined;
  forceDisabled?: boolean;
  onDidCompletedOrSkip?: () => void;
};

export const SalesforceDatabaseSettings: FC<
  SalesforceDatabaseSettingsProps
> = ({ projectId, source, forceDisabled, onDidCompletedOrSkip }) => {
  const { mutate: mutateSources, isNameAvailable } = useSources();

  const sourceData = source?.data as NangoSourceDataType | undefined;
  const syncMetadata = sourceData?.syncMetadata as SalesforceSyncMetadata;

  const updateConfiguration = useCallback(
    async (
      newData: any | undefined,
      syncMetadata: SalesforceSyncMetadata | undefined,
      setSubmitting: (submitting: boolean) => void,
    ) => {
      if (
        !projectId ||
        !source ||
        !sourceData?.integrationId ||
        !sourceData?.connectionId
      ) {
        return;
      }

      setSubmitting(true);

      await setSourceData(projectId, source.id, {
        ...(source.data as any),
        ...newData,
        ...(syncMetadata ? { syncMetadata } : {}),
      });

      if (syncMetadata) {
        await setMetadata(
          projectId,
          sourceData.integrationId,
          sourceData.connectionId,
          syncMetadata,
        );
      }

      setSubmitting(false);
      toast.success('Configuration has been updated');
      onDidCompletedOrSkip?.();
      await mutateSources();
    },
    [
      mutateSources,
      onDidCompletedOrSkip,
      projectId,
      source,
      sourceData?.connectionId,
      sourceData?.integrationId,
    ],
  );

  return (
    <>
      <Formik
        initialValues={{
          name: sourceData?.name || '',
        }}
        enableReinitialize
        validateOnMount
        validate={async (values) => {
          const errors: FormikErrors<FormikValues> = {};
          if (!values.name || values.name.trim().length === 0) {
            errors.name = 'Please enter a name';
          } else if (
            values.name !== sourceData?.name &&
            !isNameAvailable(values.name)
          ) {
            errors.name = 'This name is already taken';
          }

          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          await updateConfiguration(
            { name: values.name },
            undefined,
            setSubmitting,
          );
        }}
      >
        {({ isSubmitting, isValid }) => (
          <FormRoot>
            <FormField>
              <FormLabel>Name</FormLabel>
              <Field
                className="flex-grow"
                type="text"
                name="name"
                inputSize="sm"
                as={NoAutoInput}
                disabled={isSubmitting || forceDisabled}
              />
              <ErrorMessage name="name" component={ErrorLabel} />
            </FormField>
            <Button
              className="place-self-start"
              disabled={!isValid || forceDisabled}
              loading={isSubmitting}
              variant="plain"
              buttonSize="sm"
              type="submit"
            >
              Save
            </Button>
          </FormRoot>
        )}
      </Formik>
      <div className="h-8" />
      <Formik
        initialValues={{
          customFields: syncMetadata?.customFields?.join(', ') || '',
          filters: syncMetadata?.filters || '',
          titleMapping: syncMetadata?.mappings?.title || '',
          contentMapping: syncMetadata?.mappings?.content || '',
          pathMapping: syncMetadata?.mappings?.path || '',
          metadataFields: syncMetadata?.metadataFields?.join(', ') || '',
          processorOptions: syncMetadata?.processorOptions
            ? JSON.stringify(syncMetadata.processorOptions, null, 2)
            : '',
        }}
        enableReinitialize
        validateOnMount
        validate={async (values) => {
          const errors: FormikErrors<FormikValues> = {};
          if (values.processorOptions) {
            const parsedConfig = parseProcessorOptions(values.processorOptions);
            if (!parsedConfig && parseProcessorOptions.message) {
              errors.processorOptions = `${capitalize(
                parseProcessorOptions.message,
              )} at character ${parseProcessorOptions.position}.`;
            }
          }
          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          const syncMetadata: SalesforceSyncMetadata = {
            customFields: prepareFields(values.customFields),
            filters: values.filters,
            mappings: {
              title: values.titleMapping,
              content: values.contentMapping,
              path: values.pathMapping,
            },
            metadataFields: prepareFields(values.metadataFields),
            processorOptions: parseProcessorOptions(values.processorOptions),
          };
          await updateConfiguration(undefined, syncMetadata, setSubmitting);
        }}
      >
        {({ isSubmitting, isValid }) => (
          <FormRoot>
            <SalesforceSharedForm
              isSubmitting={isSubmitting}
              forceDisabled={forceDisabled}
            />
            <Button
              className="mt-4 flex-none self-start"
              disabled={!isValid || forceDisabled}
              loading={isSubmitting}
              variant="plain"
              buttonSize="sm"
              type="submit"
            >
              Save
            </Button>
          </FormRoot>
        )}
      </Formik>
    </>
  );
};

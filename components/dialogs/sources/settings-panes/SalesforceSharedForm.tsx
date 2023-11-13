import { Field } from 'formik';
import { FC } from 'react';

import {
  FormField,
  FormGrid13,
  FormHeading,
  FormHeadingGroup,
  FormLabel,
  FormRowLegend,
  FormSubHeading,
} from '@/components/ui/Forms';
import { NoAutoInput } from '@/components/ui/Input';
import { NoAutoTextArea } from '@/components/ui/TextArea';

import { ProcessorOptions } from './ProcessorOptions';

type SalesforceSharedFormProps = {
  isSubmitting: boolean;
  forceDisabled?: boolean;
};

export interface SalesforceSyncMetadata {
  customFields: string[];
  filters: string;
  mappings: {
    title: string | undefined;
    content: string | undefined;
    path: string | undefined;
  };
  metadataFields: string[];
}

export const SalesforceSharedForm: FC<SalesforceSharedFormProps> = ({
  isSubmitting,
  forceDisabled,
}) => {
  return (
    <>
      <FormHeadingGroup>
        <FormHeading>SOQL query</FormHeading>
        <FormSubHeading>Specify how to query the database.</FormSubHeading>
      </FormHeadingGroup>
      <FormField>
        <FormLabel>Custom fields (comma separated)</FormLabel>
        <Field
          className="h-[60px] flex-grow font-mono text-xs"
          type="text"
          name="customFields"
          placeholder={`Example: Language, IsPrivate, ArticleBody, UrlName`}
          textAreaSize="sm"
          as={NoAutoTextArea}
          disabled={isSubmitting}
        />
      </FormField>
      <FormField>
        <FormLabel learnMoreHref="https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_select_conditionexpression.htm">
          Filters (SOQL &apos;WHERE&apos; clause)
        </FormLabel>
        <Field
          className="h-[120px] flex-grow font-mono text-xs"
          type="text"
          name="filters"
          placeholder={`Example: Language = 'en_US' AND IsPrivate = false`}
          textAreaSize="sm"
          as={NoAutoTextArea}
          disabled={isSubmitting}
        />
      </FormField>
      <FormHeadingGroup>
        <FormHeading>Mappings</FormHeading>
        <FormSubHeading>
          Specify how your object fields should map to files.
        </FormSubHeading>
      </FormHeadingGroup>
      <FormGrid13>
        <FormRowLegend>Title</FormRowLegend>
        <Field
          className="font-mono text-xs"
          type="text"
          name="titleMapping"
          placeholder={`Example: Title`}
          inputSize="sm"
          as={NoAutoInput}
          disabled={isSubmitting}
        />
        <FormRowLegend>Content</FormRowLegend>
        <Field
          className="font-mono text-xs"
          type="text"
          name="contentMapping"
          placeholder={`Example: ArticleBody`}
          inputSize="sm"
          as={NoAutoInput}
          disabled={isSubmitting}
        />
        <FormRowLegend>Path</FormRowLegend>
        <Field
          className="font-mono text-xs"
          type="text"
          name="pathMapping"
          placeholder={`Example: UrlName`}
          inputSize="sm"
          as={NoAutoInput}
          disabled={isSubmitting}
        />
      </FormGrid13>
      <FormHeadingGroup>
        <FormHeading>Metadata fields</FormHeading>
        <FormSubHeading>
          Specify custom fields to include in the file metadata
          (comma-separated).
        </FormSubHeading>
      </FormHeadingGroup>
      <Field
        className="h-[60px] flex-grow font-mono text-xs"
        type="text"
        name="metadataFields"
        placeholder={`Example: Id, Language`}
        textAreaSize="sm"
        as={NoAutoTextArea}
        disabled={isSubmitting}
      />
      <ProcessorOptions
        isSubmitting={isSubmitting}
        forceDisabled={forceDisabled}
      />
    </>
  );
};

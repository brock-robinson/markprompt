import { Field } from 'formik';
import { FC } from 'react';

import {
  FormField,
  FormHeading,
  FormHeadingGroup,
  FormSubHeading,
} from '@/components/ui/Forms';
import { NoAutoTextArea } from '@/components/ui/TextArea';

type ProcessorOptionsProps = {
  isSubmitting: boolean;
  forceDisabled?: boolean;
};

export const ProcessorOptions: FC<ProcessorOptionsProps> = ({
  isSubmitting,
  forceDisabled,
}) => {
  return (
    <>
      <FormHeadingGroup>
        <FormHeading>Content processing</FormHeading>
        <FormSubHeading learnMoreHref="https://markprompt.com/docs#configuration">
          Specify rules to process your content, such as link or image source
          transformations.
        </FormSubHeading>
      </FormHeadingGroup>
      <FormField>
        <Field
          className="h-[200px] flex-grow font-mono text-xs"
          type="text"
          name="processorOptions"
          textAreaSize="sm"
          as={NoAutoTextArea}
          disabled={isSubmitting || forceDisabled}
        />
      </FormField>
    </>
  );
};

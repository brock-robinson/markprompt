import { Form } from 'formik';
import { FC, ReactNode } from 'react';

type ErrorLabelProps = {
  children?: ReactNode;
};

export const ErrorLabel: FC<ErrorLabelProps> = ({ children }) => {
  return <div className="mt-0.5 text-xs text-rose-600">{children}</div>;
};

export const FormRoot = ({ children }: { children: ReactNode }) => {
  return <Form className="FormRoot">{children}</Form>;
};

export const FormHeadingGroup = ({ children }: { children: ReactNode }) => {
  return <div className="FormHeadingGroup">{children}</div>;
};

export const FormHeading = ({ children }: { children: ReactNode }) => {
  return <div className="FormHeading">{children}</div>;
};

export const FormGrid13 = ({ children }: { children: ReactNode }) => {
  return <div className="grid_1_3 grid items-center gap-2">{children}</div>;
};

export const FormField = ({ children }: { children: ReactNode }) => {
  return <div className="FormField">{children}</div>;
};

export const FormRowLegend = ({ children }: { children: ReactNode }) => {
  return <div className="FormRowLegend">{children}</div>;
};

export const FormSubHeading = ({
  children,
  learnMoreHref,
}: {
  children: ReactNode;
  learnMoreHref?: string;
}) => {
  return (
    <div className="FormSubheading">
      {children}
      {learnMoreHref && (
        <>
          {' '}
          <a
            className="subtle-underline"
            href={learnMoreHref}
            rel="noreferrer"
            target="_blank"
          >
            Learn more
          </a>
        </>
      )}
    </div>
  );
};

export const FormLabel = ({
  children,
  learnMoreHref,
}: {
  children: ReactNode;
  learnMoreHref?: string;
}) => {
  if (learnMoreHref) {
    return (
      <div className="flex flex-row items-center gap-2">
        <div className="FormLabel flex-grow overflow-hidden truncate">
          {children}
        </div>
        <a
          className="subtle-underline flex-none whitespace-nowrap text-xs font-normal text-neutral-300"
          href={learnMoreHref}
          target="_blank"
        >
          Learn more
        </a>
      </div>
    );
  }
  return <div className="FormLabel">{children}</div>;
};

import cn from 'classnames';
import { ReactNode } from 'react';

import { InfoTooltip } from './Tooltip';

export const Row = ({
  label,
  tip,
  className,
  indented,
  collapseMargin,
  top,
  fullWidth,
  children,
}: {
  label?: string | ReactNode;
  tip?: string;
  className?: string;
  indented?: boolean;
  collapseMargin?: boolean;
  top?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        className,
        {
          'my-1': !collapseMargin,
          'py-1': collapseMargin,
          'border-l border-neutral-800': indented,
          'items-start': top,
          'items-center': !top,
        },
        'grid grid-cols-2 gap-4',
      )}
    >
      {!fullWidth && (
        <div
          className={cn(
            'flex flex-row items-center gap-2 py-1 text-sm text-neutral-300',
            {
              'pl-3': indented,
            },
          )}
        >
          <span className="truncate">{label}</span>
          {tip && (
            <span className="flex-grow">
              <InfoTooltip message={tip} dimmed />
            </span>
          )}
        </div>
      )}
      {children && (
        <div
          className={cn('flex w-full justify-end', {
            'col-span-2': fullWidth,
            'pl-3': indented && fullWidth,
          })}
        >
          {children}
        </div>
      )}
    </div>
  );
};

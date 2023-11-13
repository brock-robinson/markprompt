import cn from 'classnames';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';

export type ConnectSourceStepState = 'complete' | 'in_progress' | 'not_started';

export const Step = ({
  title,
  description,
  state,
  children,
}: {
  title: string;
  description?: string;
  state: ConnectSourceStepState;
  children?: ReactNode;
}) => {
  return (
    <div className="relative flex flex-col gap-2 py-8 pl-12 pr-8">
      <div className="absolute inset-y-0 left-[24px] w-px bg-neutral-900" />
      <div
        className={cn('absolute left-[19px] top-[39px] rounded-full border-2', {
          'bg-neutral-700': state === 'not_started',
          'bg-neutral-900': state !== 'not_started',
          'border-neutral-1000': state === 'not_started',
          'border-white': state === 'in_progress',
          'border-green-600 bg-green-600': state === 'complete',
        })}
      >
        {state === 'complete' ? (
          <Check className="h-2 w-2 stroke-white text-white" strokeWidth={5} />
        ) : (
          <div className="h-2 w-2" />
        )}
      </div>
      <div
        className={cn('transition', {
          'pointer-events-none opacity-30': state === 'not_started',
        })}
      >
        <h2 className="text-base font-semibold text-neutral-100">{title}</h2>
        {description && (
          <p className="text-sm text-neutral-500">{description}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

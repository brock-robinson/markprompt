import * as ReactTooltip from '@radix-ui/react-tooltip';
import cn from 'classnames';
import { Info } from 'lucide-react';
import { JSXElementConstructor, ReactNode, useState } from 'react';

export const Tooltip = ({
  message,
  as,
  children,
}: {
  message: string;
  as?: JSXElementConstructor<any> | string;
  children?: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const Comp = as || 'button';

  return (
    <ReactTooltip.Provider>
      <ReactTooltip.Root open={open} onOpenChange={(open) => setOpen(open)}>
        <ReactTooltip.Trigger asChild>
          <Comp
            className="button-ring flex w-min cursor-pointer flex-row items-center gap-2 truncate whitespace-nowrap rounded-md text-xs text-neutral-300"
            onClick={() => {
              setOpen(!open);
            }}
          >
            {children}
          </Comp>
        </ReactTooltip.Trigger>
        <ReactTooltip.Portal>
          <ReactTooltip.Content
            className="tooltip-content z-50 max-w-[300px]"
            sideOffset={5}
          >
            {message}
            <ReactTooltip.Arrow className="tooltip-arrow" />
          </ReactTooltip.Content>
        </ReactTooltip.Portal>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  );
};

export const InfoTooltip = ({
  message,
  dimmed,
  as,
}: {
  message: string;
  dimmed?: boolean;
  as?: JSXElementConstructor<any> | string;
}) => {
  return (
    <Tooltip message={message} as={as}>
      <Info
        className={cn('h-3 w-3', {
          'text-neutral-300': !dimmed,
          'text-neutral-500': dimmed,
        })}
      />
    </Tooltip>
  );
};

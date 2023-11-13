import cn from 'classnames';
import { FC } from 'react';

import { SystemStatus } from '@/types/types';

type SystemStatusButtonProps = {
  status: SystemStatus;
};

export const SystemStatusButton: FC<SystemStatusButtonProps> = ({ status }) => {
  return (
    <a
      className="button-ring group flex w-min flex-row items-center gap-2 rounded-md border border-neutral-900 px-2 py-1 outline-none transition hover:bg-neutral-950"
      href="https://status.markprompt.com"
      target="_blank"
      rel="noreferrer"
    >
      <div
        className={cn('h-1.5 w-1.5 rounded-full group-hover:animate-pulse', {
          'bg-green-500': status === 'operational',
          'bg-orange-500': status === 'degraded',
          'bg-rose-500': status === 'downtime',
        })}
      />
      <div className="whitespace-nowrap text-xs font-normal text-neutral-500">
        {(() => {
          switch (status) {
            case 'degraded':
              return 'Partial degradation';
            case 'downtime':
              return 'Services temporarily unavailable';
            default:
              return 'All systems normal';
          }
        })()}
      </div>
    </a>
  );
};

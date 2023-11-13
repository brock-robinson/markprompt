import cn from 'classnames';
import { Clipboard } from 'lucide-react';
import { FC, Fragment, useMemo } from 'react';
import { toast } from 'sonner';

import { copyToClipboard } from '@/lib/utils';

type JSONViewerProps = {
  json: { [key: string]: unknown };
  className?: string;
};

export const JSONViewer: FC<JSONViewerProps> = ({ json, className }) => {
  const rows = useMemo(() => {
    return Object.keys(json || {}).reduce((acc, key) => {
      const rawValue = json[key];
      return [
        ...acc,
        {
          key,
          value:
            typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue),
        },
      ];
    }, [] as { key: string; value: string }[]);
  }, [json]);

  return (
    <div
      className={cn(
        className,
        'grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-left',
      )}
    >
      {rows.map((row, i) => {
        return (
          <Fragment key={`${row.key}-${i}`}>
            <div className="whitespace-nowrap text-sm text-neutral-500">
              {row.key}
            </div>
            <div className="flex flex-row items-center gap-2 overflow-hidden truncate text-sm text-neutral-100">
              <div className="flex-grow overflow-hidden truncate whitespace-nowrap">
                {row.value}
              </div>
              <div
                className="cursor-pointer rounded bg-neutral-1000/80 p-1 transition hover:bg-neutral-900"
                onClick={() => {
                  copyToClipboard(row.value);
                  toast.success('Copied!');
                }}
              >
                <Clipboard className="h-4 w-4 text-neutral-500" />
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
};

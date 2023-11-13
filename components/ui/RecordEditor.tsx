import cn from 'classnames';
import { Plus, X } from 'lucide-react';
import { ChangeEvent, FC, Fragment } from 'react';

import Button from './Button';
import Input from './Input';

type RecordEntry = { key: string; value: string };

type RecordEditorProps = {
  records: RecordEntry[];
  onRecordsChanged: (records: RecordEntry[]) => void;
  className?: string;
};

const RecordRow = ({
  record,
  onChange,
  onRemove,
}: {
  record: RecordEntry;
  onChange: (data: RecordEntry) => void;
  onRemove: () => void;
}) => {
  return (
    <Fragment>
      <Input
        className="col-span-3"
        placeholder="Key"
        inputSize="sm"
        value={record.key}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange({ key: event.target.value, value: record.value });
        }}
      />
      <div className="col-span-9 flex flex-row items-center gap-2">
        <Input
          className="flex-grow"
          placeholder="Value"
          inputSize="sm"
          value={record.value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange({ ...record, value: event.target.value });
          }}
        />
        <button
          className="w-min flex-none rounded-full p-1 text-neutral-500 outline-none ring-white/50 transition hover:text-neutral-300 focus:ring-2"
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </Fragment>
  );
};

export const RecordEditor: FC<RecordEditorProps> = ({
  records,
  onRecordsChanged,
  className,
}) => {
  return (
    <div
      className={cn(
        className,
        'grid grid-cols-12 items-center gap-x-2 gap-y-2 text-left',
      )}
    >
      {records.map((record, i) => {
        return (
          <RecordRow
            key={`record-editor-row-${i}`}
            record={record}
            onChange={(r) =>
              onRecordsChanged([
                ...records.slice(0, i),
                r,
                ...records.slice(i + 1),
              ])
            }
            onRemove={() =>
              onRecordsChanged([
                ...records.slice(0, i),
                ...records.slice(i + 1),
              ])
            }
          />
        );
      })}
      <div className="flex flex-row gap-2">
        <Button
          variant="plain"
          buttonSize="xs"
          onClick={(e) => {
            e.preventDefault();
            onRecordsChanged([...records, { key: '', value: '' }]);
          }}
          Icon={Plus}
        >
          Add header
        </Button>
      </div>
    </div>
  );
};

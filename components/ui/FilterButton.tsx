import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import * as RadioGroup from '@radix-ui/react-radio-group';
import cn from 'classnames';
import { isEqual } from 'lodash-es';
import { ChevronDown, Plus, PlusCircle, X, XCircle } from 'lucide-react';
import {
  ChangeEvent,
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { isPresent } from 'ts-is-present';

import { FilterSpec } from '@/lib/hooks/use-insights';
import { SUPPORTED_QUERY_FILTER_COMPARISON_OPERATIONS } from '@/lib/supabase';
import { arrayEquals } from '@/lib/utils.nodeps';
import { QueryFilterComparisonOperation } from '@/types/types';

import Button from './Button';
import { Checkbox } from './Checkbox';
import Input from './Input';

type FilterButtonProps = {
  legend: string;
  value?: string;
  onClear?: () => void;
};

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  ({ legend, value, onClear, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        variant={value ? 'bordered' : 'bordered-dashed'}
        shape="rounded"
        buttonSize="xs"
        noPadding
        className="px-2"
      >
        <div className="flex flex-row items-center overflow-visible whitespace-nowrap">
          {value ? (
            <button
              className="group cursor-pointer rounded-full transition duration-200 hover:bg-neutral-900 focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                onClear?.();
              }}
            >
              <XCircle className="h-3 w-3 text-neutral-300 group-hover:text-rose-500 group-focus:text-rose-500" />
            </button>
          ) : (
            <div>
              <PlusCircle className="h-3 w-3 text-neutral-600" />
            </div>
          )}
          <span className="py-1 pr-1 pl-2 font-medium">{legend}</span>
          {value && (
            <>
              <div className="ml-2 h-4 w-px bg-neutral-800" />
              <span className="ml-2 mr-1 font-medium text-sky-500">
                {value}
              </span>
              <ChevronDown className="h-3 w-3 text-neutral-600" />
            </>
          )}
        </div>
      </Button>
    );
  },
);

FilterButton.displayName = 'FilterButton';

type MultiSelectFilterButtonProps = {
  legend: string;
  title: string;
  activeLabel?: string;
  options: string[];
  checkedIndices?: number[];
  align?: 'start' | 'center' | 'end';
  onSubmit?: (indices: number[]) => void;
  onClear?: () => void;
};

export const MultiSelectFilterButton: FC<MultiSelectFilterButtonProps> = ({
  legend,
  title,
  activeLabel,
  options,
  checkedIndices: initialCheckedIndices,
  align,
  onSubmit,
  onClear,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [checkedIndices, setCheckedIndices] = useState<number[]>([]);

  useEffect(() => {
    setCheckedIndices(initialCheckedIndices || []);
  }, [initialCheckedIndices]);

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          // Reset to initial values
          setCheckedIndices(initialCheckedIndices || []);
        }
        setOpen(o);
      }}
    >
      <Popover.Trigger asChild>
        <FilterButton legend={legend} value={activeLabel} onClear={onClear} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="animate-menu-up dropdown-menu-content z-50 flex min-w-[240px] flex-col gap-1 p-3"
          align={align}
          sideOffset={5}
        >
          <h2 className="mb-2 text-sm font-bold text-neutral-300">{title}</h2>
          {options.map((option, i) => {
            return (
              <div
                key={`filter-pill-${option}`}
                className="flex flex-row items-center gap-2"
              >
                <Checkbox
                  label={option}
                  defaultChecked={checkedIndices?.includes(i)}
                  onCheckedChange={(c) => {
                    const rest = checkedIndices.filter((v) => v !== i);
                    if (c === true) {
                      setCheckedIndices([...rest, i]);
                    } else {
                      setCheckedIndices(rest);
                    }
                  }}
                />
              </div>
            );
          })}

          <Button
            className="mt-2"
            variant="cta"
            buttonSize="xs"
            disabled={arrayEquals(initialCheckedIndices || [], checkedIndices)}
            onClick={() => {
              setOpen(false);
              onSubmit?.(checkedIndices);
            }}
          >
            Apply
          </Button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

type SingleSelectFilterButtonProps = {
  legend: string;
  title: string;
  activeLabel?: string;
  options: string[];
  selectedIndex?: number;
  align?: 'start' | 'center' | 'end';
  onSubmit?: (index: number) => void;
  onClear?: () => void;
};

export const SingleSelectFilterButton: FC<SingleSelectFilterButtonProps> = ({
  legend,
  title,
  activeLabel,
  options,
  selectedIndex: initialSelectedIndex,
  align,
  onSubmit,
  onClear,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    setSelectedIndex(initialSelectedIndex);
  }, [initialSelectedIndex]);

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          // Reset to initial values
          setSelectedIndex(initialSelectedIndex);
        }
        setOpen(o);
      }}
    >
      <Popover.Trigger asChild>
        <FilterButton legend={legend} value={activeLabel} onClear={onClear} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="animate-menu-up dropdown-menu-content z-50 flex min-w-[240px] flex-col gap-1 p-3"
          align={align}
          sideOffset={5}
        >
          <h2 className="mb-2 text-sm font-bold text-neutral-300">{title}</h2>
          <RadioGroup.Root
            className="RadioGroupRoot RadioGroupRootColumnLayout"
            aria-label={title}
            defaultValue={`${initialSelectedIndex || 0}`}
            onValueChange={(value: any) => {
              setSelectedIndex(parseInt(value));
            }}
          >
            {options.map((option, i) => {
              const id = `filter-pill-${option}`;
              return (
                <div key={id} className="flex flex-row items-center gap-2">
                  <RadioGroup.Item
                    className="RadioGroupItem"
                    value={`${i}`}
                    id={id}
                  >
                    <RadioGroup.Indicator className="RadioGroupIndicator" />
                  </RadioGroup.Item>
                  <label htmlFor={id}>
                    <span className="Label">{option}</span>
                  </label>
                </div>
              );
            })}
          </RadioGroup.Root>
          <Button
            className="mt-2"
            variant="cta"
            buttonSize="xs"
            disabled={initialSelectedIndex === selectedIndex}
            onClick={() => {
              setOpen(false);
              if (typeof selectedIndex !== 'undefined') {
                onSubmit?.(selectedIndex);
              }
            }}
          >
            Apply
          </Button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

type FilterSpecProps = {
  spec?: Partial<FilterSpec>;
  onChange?: (spec: Partial<FilterSpec>) => void;
  onRemove?: () => void;
};

const toDescription = (op: QueryFilterComparisonOperation) => {
  switch (op) {
    case 'eq': {
      return { symbol: '=', description: 'equals' };
    }
    case 'neq': {
      return { symbol: '<>', description: 'no equal' };
    }
    case 'gt': {
      return { symbol: '>', description: 'greater than' };
    }
    case 'lt': {
      return { symbol: '<', description: 'less than' };
    }
    case 'gte': {
      return { symbol: '>=', description: 'greater than or equal' };
    }
    case 'lte': {
      return { symbol: '<=', description: 'less than or equal' };
    }
    case 'like': {
      return { symbol: '~~', description: 'matches pattern' };
    }
    case 'ilike': {
      return { symbol: '~~*', description: 'matches pattern ignoring case' };
    }
    case 'in': {
      return { symbol: 'in', description: 'one of a list' };
    }
    case 'is': {
      return {
        symbol: 'is',
        description: 'null/not null/true/false',
      };
    }
    default: {
      return { symbol: '=', description: 'equals' };
    }
  }
};

const FilterRow: FC<FilterSpecProps> = ({ spec, onChange, onRemove }) => {
  return (
    <div className="grid grid-cols-12 items-center justify-center gap-2">
      <Input
        className="col-span-5"
        inputSize="xs"
        placeholder="Property"
        value={spec?.field || ''}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange?.({ ...spec, field: event.target.value });
        }}
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="col-span-2 flex h-full w-full select-none flex-row items-center justify-center rounded-md border border-neutral-800 text-xs text-neutral-300 outline-none transition focus-within:border-transparent focus-within:outline-none focus-within:ring-2 focus-within:ring-white/50 hover:bg-neutral-800 hover:text-neutral-400"
            aria-label="Select operator"
          >
            {
              toDescription(
                spec?.op ||
                  (SUPPORTED_QUERY_FILTER_COMPARISON_OPERATIONS[0] as QueryFilterComparisonOperation),
              ).symbol
            }
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="animate-menu-up dropdown-menu-content"
            sideOffset={5}
          >
            {SUPPORTED_QUERY_FILTER_COMPARISON_OPERATIONS.map((op) => {
              const _op = op as QueryFilterComparisonOperation;
              const description = toDescription(_op);
              return (
                <DropdownMenu.Item
                  key={op}
                  className="dropdown-menu-item"
                  onSelect={() => {
                    onChange?.({ ...spec, op: _op });
                  }}
                >
                  <div className="grid grid-cols-4 gap-2 pl-3 pr-4 text-xs">
                    <div className="text-neutral-500">{description.symbol}</div>
                    <div className="col-span-3 text-neutral-300">
                      {description.description}
                    </div>
                  </div>
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <Input
        className="col-span-4"
        inputSize="xs"
        placeholder="Value"
        value={spec?.value || ''}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange?.({ ...spec, value: event.target.value });
        }}
      />
      <button
        className="p-1/2 col-span-1 rounded-full text-neutral-500 outline-none transition hover:text-neutral-300"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

type GenericFieldsFilterButtonProps = {
  legend: string;
  title: string;
  activeLabel?: string;
  initialFilters: FilterSpec[];
  align?: 'start' | 'center' | 'end';
  onSubmit?: (filters: FilterSpec[]) => void;
  onClear?: () => void;
};

const isValidFilter = (filter: Partial<FilterSpec>) => {
  return filter.field && filter.op && filter.value;
};

const toValidFilterOrUndefined = (
  filter: Partial<FilterSpec>,
): FilterSpec | undefined => {
  return isValidFilter(filter) ? (filter as FilterSpec) : undefined;
};

export const GenericFieldsFilterButton: FC<GenericFieldsFilterButtonProps> = ({
  legend,
  title,
  activeLabel,
  initialFilters,
  align,
  onSubmit,
  onClear,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [filters, setFilters] = useState<Partial<FilterSpec>[]>([]);

  useEffect(() => {
    setFilters(initialFilters || []);
  }, [initialFilters]);

  const onAddFilterClick = useCallback(() => {
    setFilters((filters) => {
      return [...filters, { op: 'eq' as QueryFilterComparisonOperation }];
    });
  }, []);

  const isLastFilterInvalid = useMemo(() => {
    return filters.length > 0 && !isValidFilter(filters[filters.length - 1]);
  }, [filters]);

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          // Reset to initial values
          setFilters(initialFilters);
        }
        setOpen(o);
      }}
    >
      <Popover.Trigger asChild>
        <FilterButton legend={legend} value={activeLabel} onClear={onClear} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="animate-menu-up dropdown-menu-content z-50 flex w-[320px] flex-col gap-1 p-3"
          align={align}
          sideOffset={5}
        >
          <h2 className="mb-1 text-sm font-bold text-neutral-300">{title}</h2>
          {filters && filters.length > 0 && (
            <div className="mt-1 flex flex-col gap-2">
              {filters?.map((spec, i) => {
                // Make sure key does not depend on field, op or value, as this
                // would cause a rerender and hence loss of focus at each
                // keystroke.
                const key = `filter-spec-${i}`;
                return (
                  <FilterRow
                    key={key}
                    spec={spec}
                    onChange={(newSpec) => {
                      setFilters((filters) => {
                        return [
                          ...filters.slice(0, i),
                          newSpec,
                          ...filters.slice(i + 1),
                        ];
                      });
                    }}
                    onRemove={() => {
                      setFilters((filters) => {
                        return [
                          ...filters.slice(0, i),
                          ...filters.slice(i + 1),
                        ];
                      });
                    }}
                  />
                );
              })}
            </div>
          )}
          <div
            className={cn('grid grid-cols-2 gap-2', {
              'mt-2 border-t border-neutral-800 pt-1':
                filters && filters?.length > 0,
            })}
          >
            <Button
              className="mt-2"
              variant="plain"
              buttonSize="xs"
              disabled={isLastFilterInvalid}
              onClick={onAddFilterClick}
              Icon={Plus}
            >
              Add filter
            </Button>
            <Button
              className="mt-2"
              variant="cta"
              buttonSize="xs"
              disabled={arrayEquals(initialFilters, filters, isEqual)}
              onClick={() => {
                setOpen(false);
                onSubmit?.(
                  filters.map(toValidFilterOrUndefined).filter(isPresent),
                );
              }}
            >
              Apply
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  Table as TANTable,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Atom } from 'lucide-react';
import { ChangeEvent } from 'react';
import * as React from 'react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonPanel, SkeletonTable } from '@/components/ui/Skeletons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { REFERENCE_TIMEZONE } from '@/lib/date';
import emitter, { EVENT_OPEN_PLAN_PICKER_DIALOG } from '@/lib/events';

interface QueriesDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  showUpgradeMessage?: boolean;
  page: number;
  setPage: (page: number) => void;
  hasMorePages: boolean;
  onRowClick?: (row: Row<TData>) => void;
}

function DataTable<TData, TValue>({
  table,
  columns,
  bodyOnly,
  onRowClick,
}: {
  table: TANTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  bodyOnly?: boolean;
  onRowClick?: (row: Row<TData>) => void;
}) {
  return (
    <Table>
      <colgroup>
        <col className="w-[calc(50%-220px)]" />
        <col className="w-[100px]" />
        <col className="w-[150px]" />
        <col className="w-[190px]" />
      </colgroup>
      {!bodyOnly && (
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
      )}
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function QueriesDataTable<TData, TValue>({
  columns,
  data,
  loading,
  showUpgradeMessage,
  page,
  setPage,
  hasMorePages,
  onRowClick,
}: QueriesDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="flex items-center py-4">
        {/* Disable search for now since it only searches the current
            page of results. */}
        {false && !loading && data?.length > 0 && (
          <div className="relative">
            <Input
              inputSize="sm"
              placeholder="Search questions..."
              value={
                (table.getColumn('prompt')?.getFilterValue() as string) ?? ''
              }
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                table.getColumn('prompt')?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
            <SkeletonPanel onDark absolute loading={loading} />
          </div>
        )}
        {/* <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="plain" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenu.CheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenu.CheckboxItem>
                );
              })}
          </DropdownMenu.Content>
        </DropdownMenu.Root> */}
      </div>
      <div className="relative flex min-h-[320px] flex-col rounded-md">
        <SkeletonTable onDark loading={loading} />

        {!loading && data?.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            {page === 0
              ? 'No questions asked in this time range.'
              : 'No more questions asked in this time range.'}
          </p>
        ) : (
          <DataTable table={table} columns={columns} onRowClick={onRowClick} />
        )}
        {showUpgradeMessage && !loading && (
          <div className="relative mt-2 flex flex-col">
            <div className="z-10 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-neutral-900 bg-neutral-1100/10 p-12 backdrop-blur-md">
              <Atom className="h-6 w-6 text-white" />
              <h2 className="font-bold text-neutral-100">Enable Insights</h2>
              <p className="mb-4 max-w-lg text-center text-sm text-neutral-300">
                Get insight into the questions your users are asking, which ones
                went unanswered, what content is most cited, and other metrics
                to better understand how your prompt performs and improve your
                content.
              </p>
              <Button
                buttonSize="sm"
                variant="glow"
                onClick={() => {
                  emitter.emit(EVENT_OPEN_PLAN_PICKER_DIALOG);
                }}
              >
                Upgrade
              </Button>
            </div>
            <div className="pointer-events-none absolute inset-0 z-0 flex flex-col overflow-hidden border-neutral-900 bg-neutral-1100/10 backdrop-blur-md">
              <div className="absolute inset-x-0 bottom-0 top-10 z-10 bg-neutral-1100/5 bg-gradient-to-t from-neutral-1100 to-neutral-1100/0 backdrop-blur-md" />
              <div className="z-0 py-2">
                <DataTable table={table} columns={columns} bodyOnly />
                <DataTable table={table} columns={columns} bodyOnly />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-row gap-2 border-t border-neutral-900 py-4">
        <Button
          variant="plain"
          buttonSize="xs"
          onClick={() => setPage(page - 1)}
          disabled={page === 0 || loading}
        >
          Previous
        </Button>
        <Button
          variant="plain"
          buttonSize="xs"
          onClick={() => setPage(page + 1)}
          disabled={!hasMorePages || loading}
        >
          Next
        </Button>
      </div>
      <div className="py-4">
        <div className="relative flex items-center justify-end">
          <SkeletonPanel onDark absolute loading={loading} />
          {/* <div className="flex-1 text-sm text-neutral-500">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected. Insights
            are generated once a day. Sensitive information is redacted.
          </div> */}
          <div className="flex-1 text-xs text-neutral-500">
            Dates are shown in {REFERENCE_TIMEZONE} time.
          </div>
        </div>
      </div>
    </div>
  );
}

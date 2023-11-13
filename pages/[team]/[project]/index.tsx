import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import cn from 'classnames';
import { parseISO } from 'date-fns';
import dayjs from 'dayjs';
// Cf. https://github.com/iamkun/dayjs/issues/297#issuecomment-1202327426
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  MoreHorizontal,
  AlertCircle,
  Check,
  RefreshCw,
  XOctagon,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { FC, useEffect, useMemo, useState } from 'react';
import Balancer from 'react-wrap-balancer';
import { toast } from 'sonner';
import { isPresent } from 'ts-is-present';

import { UpgradeNote } from '@/components/files/UpgradeNote';
import { ProjectSettingsLayout } from '@/components/layouts/ProjectSettingsLayout';
import Button from '@/components/ui/Button';
import { IndeterminateCheckbox } from '@/components/ui/Checkbox';
import { SkeletonTable } from '@/components/ui/Skeletons';
import { Tooltip } from '@/components/ui/Tooltip';
import { deleteFiles } from '@/lib/api';
import { formatShortDateTimeInTimeZone } from '@/lib/date';
import useFiles from '@/lib/hooks/use-files';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import useTeam from '@/lib/hooks/use-team';
import useUsage from '@/lib/hooks/use-usage';
import { getTier } from '@/lib/stripe/tiers';
import {
  getIconForSource,
  getLabelForSource,
  getUrlPath,
  isUrl,
  pluralize,
} from '@/lib/utils';
import { getNameForPath } from '@/lib/utils.nodeps';
import { getFileTitle } from '@/lib/utils.non-edge';
import {
  DbFile,
  DbSource,
  DbSyncQueueOverview,
  NangoIntegrationId,
  NangoSourceDataType,
  Project,
  SourceConfigurationView,
} from '@/types/types';

dayjs.extend(relativeTime);

const Loading = <></>;

const SourcesDialog = dynamic(
  () => import('@/components/dialogs/sources/SourcesDialog'),
  { loading: () => Loading },
);

const SalesforceDatabaseConfigurationDialog = dynamic(
  () => import('@/components/dialogs/sources/configuration/SalesforceDatabase'),
);

const NotionPagesConfigurationDialog = dynamic(
  () => import('@/components/dialogs/sources/configuration/NotionPages'),
);

const WebsitePagesConfigurationDialog = dynamic(
  () => import('@/components/dialogs/sources/configuration/WebsitePages'),
);

const EditorDialog = dynamic(() => import('@/components/files/EditorDialog'), {
  loading: () => Loading,
});

const ConfirmDialog = dynamic(() => import('@/components/dialogs/Confirm'), {
  loading: () => Loading,
});

const DeleteSourceDialog = dynamic(
  () => import('@/components/dialogs/sources/DeleteSource'),
  {
    loading: () => Loading,
  },
);

const FileDnd = dynamic(() => import('@/components/files/FileDnd'), {
  loading: () => Loading,
});

const getBasePath = (pathWithFile: string) => {
  if (isUrl(pathWithFile)) {
    return getUrlPath(pathWithFile);
  }

  if (!pathWithFile.includes('/')) {
    return '/';
  }

  const parts = pathWithFile.split('/');
  if (parts.length <= 2 && pathWithFile.startsWith('/')) {
    return '/';
  } else {
    return parts.slice(0, -1).join('/').replace(/^\//, '');
  }
};

type SyncStatusIndicatorProps = {
  syncQueue?: DbSyncQueueOverview;
};

const SyncStatusIndicator: FC<SyncStatusIndicatorProps> = ({ syncQueue }) => {
  switch (syncQueue?.status) {
    case 'running':
      return (
        <Tooltip
          as="span"
          message={`Sync started at ${formatShortDateTimeInTimeZone(
            parseISO(syncQueue.created_at),
          )}`}
        >
          <RefreshCw className="h-4 w-4 animate-spin text-neutral-600" />
        </Tooltip>
      );
    case 'canceled':
      return <XOctagon className="h-4 w-4 text-neutral-600" />;
    case 'errored':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'complete': {
      let message = '';
      if (syncQueue.ended_at) {
        message = `Sync completed at ${formatShortDateTimeInTimeZone(
          parseISO(syncQueue.ended_at),
        )}`;
      } else {
        message = 'Sync completed';
      }
      return (
        <Tooltip as="span" message={message}>
          <Check className="h-4 w-4 text-green-600" />
        </Tooltip>
      );
    }
    default:
      // TODO: reenable when migration to new architecture is fully completed
      return <></>;
    // return (
    //   <Tooltip as="span" message="The source has not yet been synced">
    //     <AlertTriangle className="h-4 w-4 text-orange-600" />
    //   </Tooltip>
    // );
  }
};

type SourcesProps = {
  projectId: Project['id'] | undefined;
  onConfigureSelected: (
    source: DbSource,
    view: SourceConfigurationView,
  ) => void;
  onDeleteSelected: (source: DbSource) => void;
};

const Sources: FC<SourcesProps> = ({
  onConfigureSelected,
  onDeleteSelected,
}) => {
  const { sources, latestSyncQueues, syncSources } = useSources();

  return (
    <div className="-ml-2 flex w-[calc(100%+16px)] flex-col gap-1 ">
      {sources
        .map((source) => {
          const latestSyncQueue = latestSyncQueues?.find(
            (q) => q.source_id === source.id,
          );

          return (
            <SourceItem
              key={source.id}
              source={source}
              syncQueue={latestSyncQueue}
              onSyncSelected={() => syncSources([source])}
              onConfigureSelected={(view) => {
                onConfigureSelected(source, view);
              }}
              onDeleteSelected={() => {
                onDeleteSelected(source);
              }}
            />
          );
        })
        .filter(isPresent)}
    </div>
  );
};

type SourceItemProps = {
  source: DbSource;
  syncQueue: DbSyncQueueOverview | undefined;
  onSyncSelected: () => void;
  onConfigureSelected: (view: SourceConfigurationView) => void;
  onDeleteSelected: () => void;
};

const SourceItem: FC<SourceItemProps> = ({
  source,
  syncQueue,
  onSyncSelected,
  onConfigureSelected,
  onDeleteSelected,
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const Icon = getIconForSource(source);

  return (
    <div
      className={cn(
        'flex gap-2 rounded-md px-2 text-sm outline-none transition hover:bg-neutral-900',
        {
          'bg-neutral-1000': isDropdownOpen,
        },
      )}
    >
      <button
        className={cn(
          'flex flex-grow cursor-pointer flex-row items-center gap-2 overflow-hidden py-1.5 text-sm outline-none',
          { 'bg-neutral-1000': isDropdownOpen },
        )}
        onClick={() => {
          onConfigureSelected('configuration');
        }}
      >
        <Icon className="h-4 w-4 flex-none text-left text-neutral-500" />
        <p className="flex-grow overflow-hidden truncate text-left text-neutral-100">
          {getLabelForSource(source, false)}
        </p>
        {/* While we wait for proper sync status endpoints, we only show the
        sync status when it is running (on Inngest), so that users are not
        confused e.g. with a 'complete' indicator when we don't know what is
        going on on the Nango end. */}
        {/* {syncQueue?.status === 'running' && ( */}
        <SyncStatusIndicator syncQueue={syncQueue} />
        {/* )} */}
      </button>
      <DropdownMenu.Root open={isDropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(
              'my-1 flex-none select-none rounded-md p-1 text-neutral-500 opacity-50 outline-none transition hover:bg-neutral-800 hover:opacity-100',
              {
                'bg-neutral-800': isDropdownOpen,
              },
            )}
            aria-label="Source options"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="animate-menu-up dropdown-menu-content mr-2 min-w-[160px]"
            sideOffset={5}
          >
            <DropdownMenu.Item asChild onSelect={() => onSyncSelected()}>
              <span className="dropdown-menu-item dropdown-menu-item-noindent block">
                Sync now
              </span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              asChild
              onSelect={() => {
                setDropdownOpen(false);
                onConfigureSelected('configuration');
              }}
            >
              <span className="dropdown-menu-item dropdown-menu-item-noindent block">
                Configure
              </span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              asChild
              onSelect={() => {
                setDropdownOpen(false);
                onConfigureSelected('logs');
              }}
            >
              <span className="dropdown-menu-item dropdown-menu-item-noindent block">
                Show logs
              </span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="dropdown-menu-separator" />
            <DropdownMenu.Item
              asChild
              onSelect={() => {
                setDropdownOpen(false);
                onDeleteSelected();
              }}
            >
              <span className="dropdown-menu-item dropdown-menu-item-noindent block">
                Delete
              </span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

const Data = () => {
  const { team } = useTeam();
  const { project } = useProject();
  const {
    paginatedFiles,
    mutate: mutateFiles,
    loading: loadingFiles,
    page,
    setPage,
    hasMorePages,
    mutateCount,
    numFiles,
  } = useFiles();
  const {
    sources,
    syncSources,
    latestSyncQueues,
    loading: loadingSources,
  } = useSources();
  const {
    numTokensPerTeamAllowance,
    mutate: mutateFileStats,
    canAddMoreContent,
  } = useUsage();
  const [rowSelection, setRowSelection] = useState({});
  // const [forceRetrain, setForceRetrain] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sourceToRemove, setSourceToRemove] = useState<DbSource | undefined>(
    undefined,
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updated', desc: true },
  ]);
  const [openFileId, setOpenFileId] = useState<DbFile['id'] | undefined>(
    undefined,
  );
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [configureSourceDialogOpen, setConfigureSourceDialogOpen] = useState<{
    open: boolean;
    // Add other IDs manually here until they are moved to Nango
    dialogId?:
      | NangoIntegrationId
      | 'motif'
      | 'github'
      | 'website'
      | 'api-uploads';
    source?: DbSource;
    view?: SourceConfigurationView;
  }>({ open: false });

  const tier = team && getTier(team);

  const isOneSourceSyncing = useMemo(() => {
    return !!latestSyncQueues?.some((q) => q.status === 'running');
  }, [latestSyncQueues]);

  useEffect(() => {
    const refresh = async () => {
      mutateFiles();
      mutateFileStats();
    };

    if (!isOneSourceSyncing) {
      refresh();
      return;
    }

    // If a source is syncing, refresh files regularly
    const refreshInterval = window.setInterval(() => {
      refresh();
    }, 5000);

    return () => {
      window.clearInterval(refreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOneSourceSyncing]);

  const columnHelper = createColumnHelper<{
    id: DbFile['id'];
    path: string;
    source_id: string;
    updated_at: string;
    meta: any;
    token_count: number | undefined;
  }>();

  // const pageHasSelectableItems = useMemo(() => {
  //   return (paginatedFiles || []).some((f) => {
  //     const source = sources.find((s) => s.id === f.source_id);
  //     // return source && canDeleteSource(source.type);
  //     return !!source;
  //   });
  // }, [paginatedFiles, sources]);

  const columns: any = useMemo(
    () => [
      columnHelper.accessor((row) => row.source_id, {
        id: 'select',
        enableSorting: false,
        header: ({ table }) => {
          // if (!pageHasSelectableItems) {
          //   return <></>;
          // }
          return (
            <IndeterminateCheckbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          );
        },
        cell: (info) => {
          if (!info.row.getCanSelect()) {
            return <></>;
          }
          return (
            <IndeterminateCheckbox
              checked={info.row.getIsSelected()}
              indeterminate={info.row.getIsSomeSelected()}
              onChange={info.row.getToggleSelectedHandler()}
            />
          );
        },
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row, {
        id: 'name',
        header: () => <span>Title</span>,
        cell: (info) => {
          const value = info.getValue();
          // Ensure compat with previously trained data, where we don't
          // extract the title in the meta. Note that the title might be
          // a non-string value as well, e.g. in the case of an html
          // component.
          const title = getFileTitle(value, sources);
          return (
            <button
              className="w-full overflow-hidden truncate text-left outline-none"
              onClick={() => {
                setOpenFileId(value.id);
                setEditorOpen(true);
              }}
            >
              {title}
            </button>
          );
        },
        footer: (info) => info.column.id,
        sortingFn: (rowA, rowB, columnId) => {
          const valueA: { sourceId: DbSource['id']; path: string } =
            rowA.getValue(columnId);
          const valueB: { sourceId: DbSource['id']; path: string } =
            rowB.getValue(columnId);
          const nameA = getNameForPath(sources, valueA.sourceId, valueA.path);
          const nameB = getNameForPath(sources, valueB.sourceId, valueB.path);
          return nameA.localeCompare(nameB);
        },
      }),
      // columnHelper.accessor((row) => row.path, {
      //   id: 'path',
      //   header: () => <span>Path</span>,
      //   cell: (info) => {
      //     return (
      //       <ReactTooltip.Provider>
      //         <ReactTooltip.Root>
      //           <ReactTooltip.Trigger asChild>
      //             <div className="cursor-default truncate">
      //               {info.getValue()}
      //             </div>
      //           </ReactTooltip.Trigger>
      //           <ReactTooltip.Portal>
      //             <ReactTooltip.Content className="tooltip-content">
      //               {info.getValue()}
      //             </ReactTooltip.Content>
      //           </ReactTooltip.Portal>
      //         </ReactTooltip.Root>
      //       </ReactTooltip.Provider>
      //     );
      //   },
      //   footer: (info) => info.column.id,
      // }),
      columnHelper.accessor((row) => row.source_id, {
        id: 'source',
        header: () => <span>Source</span>,
        cell: (info) => {
          const value = info.getValue();
          const source = sources.find((s) => s.id === value);
          if (source) {
            const Icon = getIconForSource(source);
            const label = getLabelForSource(source, false);
            return (
              <div className="flex flex-row items-center gap-2">
                <Icon className="h-4 w-4 flex-none text-neutral-500" />
                <p className="ovrflow-hidden flex-grow truncate whitespace-nowrap text-neutral-500">
                  {label}
                </p>
              </div>
            );
          } else {
            return '';
          }
        },
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.updated_at, {
        id: 'updated',
        header: () => <span>Updated</span>,
        cell: (info) => {
          return dayjs(info.getValue()).fromNow();
        },
        footer: (info) => info.column.id,
      }),
    ],
    // [columnHelper, pageHasSelectableItems, sources],
    [columnHelper, sources],
  );

  const table = useReactTable({
    data: paginatedFiles || [],
    columns,
    state: { rowSelection, sorting },
    enableRowSelection: (row) => {
      // const value = row.getValue('source');
      // const source = sources.find((s) => s.id === value);
      // if (source && !canDeleteSource(source.type)) {
      //   return false;
      // }
      return true;
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const numSelected = Object.values(rowSelection).filter(Boolean).length;
  const hasFiles = paginatedFiles && paginatedFiles.length > 0;

  return (
    <ProjectSettingsLayout
      title="Data"
      width="2xl"
      RightHeading={
        <div className="flex w-full items-center gap-4">
          <div className="flex-grow" />
          {numSelected > 0 && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button loading={isDeleting} variant="danger" buttonSize="sm">
                  Delete
                </Button>
              </Dialog.Trigger>
              <ConfirmDialog
                title={`Delete ${pluralize(numSelected, 'file', 'files')}?`}
                description="Deleting a file will remove it as a source for future answers."
                cta="Delete"
                variant="danger"
                loading={isDeleting}
                onCTAClick={async () => {
                  if (!project?.id) {
                    return;
                  }
                  const selectedRowIndices = Object.keys(rowSelection);
                  const rowModel = table.getSelectedRowModel().rowsById;
                  const fileIds = selectedRowIndices
                    .map((i) => rowModel[i]?.original?.id)
                    .filter(isPresent);
                  if (fileIds.length === 0) {
                    return;
                  }
                  setIsDeleting(true);
                  await deleteFiles(project.id, fileIds);
                  await mutateFiles(
                    paginatedFiles?.filter((f) => !fileIds.includes(f.id)),
                  );
                  await mutateFileStats();
                  await mutateCount();
                  setRowSelection([]);
                  setIsDeleting(false);
                  toast.success(
                    `${pluralize(fileIds.length, 'file', 'files')} deleted`,
                  );
                }}
              />
            </Dialog.Root>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-12">
        <div className="flex w-full flex-col gap-2 sm:col-span-3 md:col-span-2">
          {!loadingFiles && !canAddMoreContent && (
            <UpgradeNote className="mb-4" showDialog>
              You have reached your quota of indexed content (
              {numTokensPerTeamAllowance} tokens) on this plan. Please upgrade
              your plan to index more documents.
            </UpgradeNote>
          )}
          {sources.length > 0 && (
            <>
              <p className="mb-2 text-xs text-neutral-500">Connected sources</p>
              <div className="mb-8">
                <Sources
                  projectId={project?.id}
                  onConfigureSelected={(source, view) => {
                    if (source.type !== 'nango') {
                      toast.error('This source cannot be configured');
                      return;
                    }
                    const data = source.data as NangoSourceDataType;
                    setConfigureSourceDialogOpen({
                      open: true,
                      dialogId: data.integrationId,
                      source: source,
                      view: view,
                    });
                  }}
                  onDeleteSelected={setSourceToRemove}
                />
              </div>
            </>
          )}

          {project && (
            <SourcesDialog>
              <Button
                variant={
                  loadingSources || (sources && sources.length) > 0
                    ? 'plain'
                    : 'cta'
                }
                buttonSize="sm"
                Icon={Plus}
              >
                Connect source
              </Button>
            </SourcesDialog>
          )}
        </div>
        <div className="sm:col-span-9 md:col-span-10">
          {loadingFiles && (
            <div className="relative min-h-[200px]">
              <SkeletonTable onDark loading />
            </div>
          )}
          {!loadingFiles && !hasFiles && (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-neutral-800 text-center">
              {!loadingFiles &&
              (!sources || sources.length === 0) &&
              !hasFiles ? (
                <>
                  <p className="text-base font-semibold text-neutral-300">
                    Start by connecting a source
                  </p>
                  <p className="max-w-[400px] text-sm text-neutral-500">
                    <Balancer>
                      Once you connect a source, you can start using it as
                      context for your agents and chatbots.
                    </Balancer>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-neutral-300">
                    Sync {sources.length > 1 ? 'sources' : 'source'}
                  </p>
                  <p className="mb-4 max-w-[400px] text-sm text-neutral-500">
                    <Balancer>
                      Once a source is synced, it will appear here and you can
                      start using it as context for your agents and chatbots.
                    </Balancer>
                  </p>
                  <Button
                    variant="cta"
                    buttonSize="sm"
                    loading={isOneSourceSyncing}
                    onClick={() => syncSources(sources)}
                  >
                    Sync now
                  </Button>
                </>
              )}
            </div>
          )}
          {!loadingFiles && hasFiles && (
            <table className="w-full max-w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[32px]" />
                <col className="w-[calc(80%-152px)]" />
                {/* <col className="w-[30%]" /> */}
                <col className="w-[20%]" />
                <col className="w-[160px]" />
              </colgroup>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className="cursor-pointer py-2 px-2 text-left text-sm font-bold text-neutral-300"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder ? null : (
                            <div className="flex flex-row items-center gap-2">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {header.id !== 'select' && (
                                <>
                                  <span className="text-sm font-normal text-neutral-600">
                                    {{
                                      asc: '↓',
                                      desc: '↑',
                                    }[header.column.getIsSorted() as string] ??
                                      null}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-neutral-900 hover:bg-neutral-1000',
                        {
                          'bg-neutral-1000': row.getIsSelected(),
                        },
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <td
                            key={cell.id}
                            style={{
                              width: 100,
                            }}
                            className={cn(
                              'overflow-hidden truncate text-ellipsis whitespace-nowrap py-2 px-2 text-sm',
                              {
                                'font-medium text-neutral-300':
                                  cell.column.id === 'name',
                                'text-neutral-500':
                                  // cell.column.id === 'path' ||
                                  cell.column.id === 'source' ||
                                  cell.column.id === 'updated',
                              },
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {paginatedFiles && paginatedFiles.length > 0 && (
            <div className="flex flex-row items-center gap-2 py-4">
              <Button
                variant="plain"
                buttonSize="xs"
                onClick={() => setPage(page - 1)}
                disabled={page === 0 || loadingFiles}
              >
                Previous
              </Button>
              <Button
                variant="plain"
                buttonSize="xs"
                onClick={() => setPage(page + 1)}
                disabled={!hasMorePages || loadingFiles}
              >
                Next
              </Button>
              <div className="flex-grow" />
              {numFiles > 0 && (
                <span className="flex-none whitespace-nowrap text-right text-xs text-neutral-500">{`${numFiles} files indexed`}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <Dialog.Root
        open={!!sourceToRemove}
        onOpenChange={() => setSourceToRemove(undefined)}
      >
        {sourceToRemove && project && (
          <DeleteSourceDialog
            projectId={project.id}
            source={sourceToRemove}
            onComplete={() => setSourceToRemove(undefined)}
          />
        )}
      </Dialog.Root>
      {project?.id && (
        <>
          <EditorDialog
            fileId={openFileId}
            open={editorOpen}
            setOpen={(open) => {
              if (!open) {
                setEditorOpen(false);
              }
            }}
          />
          <SalesforceDatabaseConfigurationDialog
            projectId={project?.id}
            open={
              configureSourceDialogOpen.open &&
              (configureSourceDialogOpen?.dialogId === 'salesforce-knowledge' ||
                configureSourceDialogOpen?.dialogId ===
                  'salesforce-knowledge-sandbox' ||
                configureSourceDialogOpen?.dialogId === 'salesforce-case' ||
                configureSourceDialogOpen?.dialogId ===
                  'salesforce-case-sandbox')
            }
            onOpenChange={(open) => {
              if (!open) {
                setConfigureSourceDialogOpen((s) => ({ ...s, open: false }));
              }
            }}
            sourceId={configureSourceDialogOpen?.source?.id}
            defaultView={configureSourceDialogOpen?.view}
          />
          <NotionPagesConfigurationDialog
            projectId={project?.id}
            open={
              configureSourceDialogOpen.open &&
              configureSourceDialogOpen?.dialogId === 'notion-pages'
            }
            onOpenChange={(open) => {
              if (!open) {
                // Do not set to undefined, as this will cause flicker when
                // data in nulled and the fields in the dialog get reset.
                setConfigureSourceDialogOpen((s) => ({
                  ...s,
                  open: false,
                }));
              }
            }}
            sourceId={configureSourceDialogOpen?.source?.id}
            defaultView={configureSourceDialogOpen?.view}
          />
          <WebsitePagesConfigurationDialog
            projectId={project?.id}
            open={
              configureSourceDialogOpen.open &&
              configureSourceDialogOpen?.dialogId === 'website-pages'
            }
            onOpenChange={(open) => {
              if (!open) {
                // Do not set to undefined, as this will cause flicker when
                // data in nulled and the fields in the dialog get reset.
                setConfigureSourceDialogOpen((s) => ({
                  ...s,
                  open: false,
                }));
              }
            }}
            sourceId={configureSourceDialogOpen?.source?.id}
            defaultView={configureSourceDialogOpen?.view}
          />
        </>
      )}
    </ProjectSettingsLayout>
  );
};

export default Data;

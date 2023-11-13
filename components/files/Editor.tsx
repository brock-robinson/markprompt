import { FileReferenceFileData } from '@markprompt/core';
import { parseISO } from 'date-fns';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import matter from 'gray-matter';
import Link from 'next/link';
import { FC, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { getFileIdBySourceAndPath } from '@/lib/api';
import { formatShortDateTimeInTimeZone } from '@/lib/date';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import { convertToMarkdown } from '@/lib/markdown';
import {
  fetcher,
  getDisplayPathForPath,
  getFileType,
  getFullURLForPath,
  getIconForSource,
  getLabelForSource,
  getURLForSource,
} from '@/lib/utils';
import { getFileNameForSourceAtPath } from '@/lib/utils.nodeps';
import { getFileTitle } from '@/lib/utils.non-edge';
import { DbFile } from '@/types/types';

import { MarkdownContainer } from '../emails/templates/MarkdownContainer';
import { SkeletonTable } from '../ui/Skeletons';

dayjs.extend(localizedFormat);

// The editor can take either a file id, or reference data (e.g. from
// the conversation query stats).
type EditorProps = {
  fileId?: DbFile['id'];
  fileReferenceData?: FileReferenceFileData;
  highlightSectionSlug?: string;
};

export const Editor: FC<EditorProps> = ({
  fileId: _fileId,
  fileReferenceData,
}) => {
  const { project } = useProject();
  const { sources } = useSources();
  const [fileId, setFileId] = useState(_fileId);

  useEffect(() => {
    if (!project?.id || _fileId || !fileReferenceData) {
      return;
    }

    (async () => {
      const fileId = await getFileIdBySourceAndPath(
        project?.id,
        fileReferenceData.source,
        fileReferenceData.path,
      );
      if (fileId) {
        setFileId(fileId);
      }
    })();
  }, [project?.id, _fileId, fileReferenceData]);

  const { data: file, error } = useSWR(
    project?.id && fileId ? `/api/project/${project.id}/files/${fileId}` : null,
    fetcher<DbFile>,
  );

  const loading = !file && !error;

  const source = useMemo(() => {
    return sources?.find((s) => s.id === file?.source_id);
  }, [sources, file?.source_id]);

  const SourceItem = useMemo(() => {
    if (!source) {
      return <></>;
    }
    const Icon = getIconForSource(source);
    const label = getLabelForSource(source, false);
    const url = getURLForSource(source);

    return (
      <div className="flex flex-row items-center gap-2">
        <Icon className="h-4 w-4 flex-none text-neutral-500" />
        <div className="flex-grow overflow-hidden truncate text-neutral-300">
          {url ? (
            <Link
              href={url}
              className="subtle-underline"
              target="_blank"
              rel="noreferrer"
            >
              {label}
            </Link>
          ) : (
            <p>{label}</p>
          )}
        </div>
      </div>
    );
  }, [source]);

  const markdownContent = useMemo(() => {
    if (!file?.raw_content || !source) {
      return '';
      // return { markdownContent: '', filename: '' };
    }

    // TODO: remove this in the future. This is for backwards
    // compatibility for sources that have not yet been synced with
    // the new system, which stores the converted Markdown as the
    // raw_content.
    const insertedAt = new Date(source.inserted_at);
    const newSyncArchitectureReleaseDate = new Date('2023-11-12');
    if (insertedAt.getTime() < newSyncArchitectureReleaseDate.getTime()) {
      const filename = getFileNameForSourceAtPath(source, file.path);
      const fileType =
        (file.internal_metadata as any)?.contentType ?? getFileType(filename);
      const m = matter(file.raw_content);
      return convertToMarkdown(m.content.trim(), fileType, undefined);
    }

    const m = matter(file.raw_content);
    return m.content.trim();
  }, [file?.internal_metadata, file?.path, file?.raw_content, source]);

  if (loading) {
    return (
      <div className="w-full p-4">
        <div className="relative">
          <SkeletonTable loading />;
        </div>
      </div>
    );
  }

  console.log('file', JSON.stringify(file, null, 2));
  console.log('source', JSON.stringify(source, null, 2));

  if (!file || !source) {
    return (
      <div className="p-4 text-sm text-neutral-300">
        The file is not accessible. Please sync your data again, and if the
        problem persists,{' '}
        <a
          className="subtle-underline"
          href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
        >
          contact support
        </a>
        .
      </div>
    );
  }

  const displayPath = getDisplayPathForPath(source, file.path);
  const pathUrl = getFullURLForPath(source, file.path);

  return (
    <div className="mx-auto flex max-w-screen-md flex-col gap-2">
      <h1 className="mt-12 text-3xl font-bold text-neutral-100">
        {getFileTitle(file, sources)}
      </h1>
      <div className="mt-8 grid grid-cols-3 gap-4 border-b border-neutral-900 pb-4">
        <div className="text-sm text-neutral-500">Synced</div>
        <div className="text-sm text-neutral-500">Source</div>
        <div className="text-sm text-neutral-500">Path</div>
        <div className="text-sm text-neutral-300">
          {formatShortDateTimeInTimeZone(parseISO(file.updated_at))}
        </div>
        <div className="overflow-hidden truncate whitespace-nowrap text-sm text-neutral-300">
          {SourceItem}
        </div>
        <div className="overflow-hidden truncate whitespace-nowrap text-sm text-neutral-300">
          {pathUrl ? (
            <Link
              href={pathUrl}
              target="_blank"
              rel="noreferrer"
              className="subtle-underline"
            >
              {displayPath}
            </Link>
          ) : (
            <>{displayPath}</>
          )}
        </div>
      </div>
      {/*
      {supportsFrontmatter(getFileType(filename)) &&
        file?.meta &&
        Object.keys(file.meta).length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 overflow-hidden border-b border-neutral-900 pb-4 sm:grid-cols-4">
            {Object.keys(file.meta).map((k) => {
              const value = (file.meta as any)[k];
              let comp = undefined;
              if (typeof value === 'string') {
                comp = value;
              } else {
                comp = JSON.stringify(value);
              }
              return (
                <Fragment key={`meta-${k}`}>
                  <p className="text-sm text-neutral-500">{k}</p>
                  <p className="text-sm text-neutral-300 sm:col-span-3">
                    {comp}
                  </p>
                </Fragment>
              );
            })}
          </div>
        )} */}
      <div className="mt-8 pb-24">
        {markdownContent ? (
          <MarkdownContainer markdown={markdownContent} />
        ) : (
          <p className="select-none text-sm text-neutral-700">Empty content</p>
        )}
      </div>
    </div>
  );
};

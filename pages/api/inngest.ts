import { NangoSyncWebhookBody } from '@nangohq/node';
import { EventSchemas, Inngest } from 'inngest';
import { serve } from 'inngest/next';
import { isEqual } from 'lodash-es';

import {
  EMBEDDING_MODEL,
  MAX_CHUNK_LENGTH,
  MIN_SECTION_CONTENT_LENGTH,
  OPENAI_RPM,
} from '@/lib/constants';
import { bulkCreateSectionEmbeddings } from '@/lib/file-processing';
import {
  getNangoServerInstance,
  getSourceSyncData,
} from '@/lib/integrations/nango.server';
import {
  convertToMarkdown,
  extractMeta,
  splitIntoSections,
} from '@/lib/markdown';
import { MarkdownProcessorOptions } from '@/lib/schema';
import {
  createServiceRoleSupabaseClient,
  getProjectIdFromSource,
  getProjectConfigData,
  createFile,
  batchStoreFileSections,
  batchDeleteFiles,
  batchDeleteFilesBySourceAndNangoId,
  getOrCreateRunningSyncQueueForSource,
  updateSyncQueue,
  getFilesIdAndCheksumBySourceAndNangoId,
} from '@/lib/supabase';
import { createChecksum, pluralize } from '@/lib/utils';
import { Json } from '@/types/supabase';
import {
  DbFileMetaChecksum,
  DbSource,
  FileSections,
  NangoFileWithMetadata,
  Project,
} from '@/types/types';

// Payload for the webhook and manual sync bodies that we send
// to Inngest.
export type NangoSyncPayload = Pick<
  NangoSyncWebhookBody,
  'providerConfigKey' | 'connectionId' | 'model' | 'queryTimeStamp'
>;

export type FileTrainEventData = {
  file: NangoFileWithMetadata;
  projectId: Project['id'];
  sourceId: DbSource['id'];
  processorOptions: MarkdownProcessorOptions | undefined;
};

type Events = {
  'nango/sync': {
    data: NangoSyncPayload;
  };
  'markprompt/file.train': {
    data: FileTrainEventData;
  };
  'markprompt/files.delete': {
    data: { ids: NangoFileWithMetadata['id'][]; sourceId: string };
  };
};

type NamedEvent<T extends keyof Events> = Events[T] & { name: T };

export const inngest = new Inngest({
  id: 'markprompt',
  schemas: new EventSchemas().fromRecord<Events>(),
});

const syncNangoRecords = inngest.createFunction(
  { id: 'sync-nango-records' },
  { event: 'nango/sync' },
  async ({ event, step }) => {
    const supabase = createServiceRoleSupabaseClient();

    const sourceSyncData = await getSourceSyncData(
      supabase,
      event.data.connectionId,
    );

    if (!sourceSyncData) {
      return { updated: 0, deleted: 0 };
    }

    const syncQueueId = await getOrCreateRunningSyncQueueForSource(
      supabase,
      sourceSyncData.id,
    );

    const nango = getNangoServerInstance();

    const recordIncludingErrors = (await nango.getRecords<any>({
      providerConfigKey: event.data.providerConfigKey,
      connectionId: event.data.connectionId,
      model: event.data.model,
      delta: event.data.queryTimeStamp || undefined,
    })) as NangoFileWithMetadata[];

    console.log('[INNGEST] getRecords', recordIncludingErrors.length);

    const records = recordIncludingErrors.filter((r) => !r.error);

    const errorMessages = recordIncludingErrors
      .filter((r) => r.error)
      .map((r) => `${r.path}: ${r.error}`);

    if (errorMessages.length > 0) {
      await updateSyncQueue(supabase, syncQueueId, 'running', {
        message: `Error processing ${pluralize(
          errorMessages.length,
          'file',
          'files',
        )}:\n\n${errorMessages.join('\n')}`,
        level: 'error',
      });
    }

    const projectId = await getProjectIdFromSource(supabase, sourceSyncData.id);

    if (!projectId) {
      await updateSyncQueue(supabase, syncQueueId, 'errored', {
        message: 'Project not found',
        level: 'error',
      });
      return { updated: 0, deleted: 0 };
    }

    // Delete files

    const filesIdsToDelete = records
      .filter((record) => {
        return record._nango_metadata.last_action === 'DELETED';
      })
      .map((record) => record.id);

    // Delete files

    await step.sendEvent('delete-files', {
      name: 'markprompt/files.delete',
      data: { ids: filesIdsToDelete, sourceId: sourceSyncData.id },
    });

    // Train added/updated files

    const syncMetadata = (sourceSyncData.data as any)?.syncMetadata;

    const processorOptions =
      syncMetadata?.processorOptions ||
      (await getProjectConfigData(supabase, projectId)).markpromptConfig
        .processorOptions;

    const trainEvents = records
      .filter((record) => {
        return (
          record._nango_metadata.last_action === 'ADDED' ||
          record._nango_metadata.last_action === 'UPDATED'
        );
      })
      .map<NamedEvent<'markprompt/file.train'>>((record) => {
        return {
          name: 'markprompt/file.train',
          data: {
            file: record,
            sourceId: sourceSyncData.id,
            projectId,
            processorOptions,
          },
        };
      });

    await step.sendEvent('train-files', trainEvents);

    await updateSyncQueue(supabase, syncQueueId, 'complete', {
      message: `Updated ${pluralize(
        trainEvents.length,
        'file',
        'files',
      )}. Deleted ${pluralize(filesIdsToDelete.length, 'file', 'files')}.`,
      level: 'info',
    });

    return { updated: trainEvents.length, deleted: filesIdsToDelete.length };
  },
);

export const isFileChanged = (
  newFile: Omit<DbFileMetaChecksum, 'id'>,
  storedFile: Omit<DbFileMetaChecksum, 'id'>,
) => {
  return (
    newFile.path !== storedFile.path ||
    newFile.checksum !== storedFile.checksum ||
    !isEqual(newFile.meta, storedFile.meta)
  );
};

// Meta is built from the Markdown frontmatter, and from additional
// data, such as Notion properties.
export const createFullMeta = async (file: NangoFileWithMetadata) => {
  let meta: {
    [key: string]: string;
  } = {};

  if (file.content) {
    meta = (await extractMeta(file.content, file.contentType)) || {};
  }

  meta = { ...file.meta, ...meta };
  if (file.title) {
    meta = { title: file.title, ...meta };
  }

  return meta;
};

export const runTrainFile = async (data: FileTrainEventData) => {
  const nangoFile = data.file;
  const sourceId = data.sourceId;
  const projectId = data.projectId;

  if (!nangoFile?.id || nangoFile.error) {
    return;
  }

  const supabase = createServiceRoleSupabaseClient();

  const foundFiles = await getFilesIdAndCheksumBySourceAndNangoId(
    supabase,
    sourceId,
    nangoFile.id,
  );

  let foundFile: DbFileMetaChecksum | undefined = undefined;

  if (foundFiles.length > 0) {
    foundFile = foundFiles[0];
    if (foundFiles.length > 1) {
      // There should not be more than one file with the same source id and
      // Nango id, but if there is exceptionally, purge all but the first.
      await batchDeleteFiles(
        supabase,
        foundFiles.slice(1).map((f) => f.id),
      );
    }
  }

  const meta = await createFullMeta(nangoFile);
  const markdown = nangoFile.content
    ? await convertToMarkdown(
        nangoFile.content,
        nangoFile.contentType,
        data.processorOptions,
      )
    : '';
  const checksum = createChecksum(markdown);

  if (
    foundFile &&
    !isFileChanged(
      { path: nangoFile.path, meta: meta || {}, checksum },
      foundFile,
    )
  ) {
    // If checksums match on the Markdown, skip. Note that we don't compare
    // on the raw content, since two different raw versions chould still have
    // the same Markdown, in which case we don't need to recreate the
    // embeddings.
    return;
  }

  const sections = (await splitIntoSections(markdown, MAX_CHUNK_LENGTH)).filter(
    (s) => {
      // Filter out very short sections, to avoid noise
      return s.content.length >= MIN_SECTION_CONTENT_LENGTH;
    },
  );

  const embeddingsResponse = await bulkCreateSectionEmbeddings(
    sections.map((s) => s.content),
  );

  const tokenCount = embeddingsResponse.tokenCount;
  const sectionsWithEmbeddings = embeddingsResponse.embeddings.map((e, i) => {
    return {
      ...sections[i],
      embedding: e,
    };
  });

  const internalMetadata = {
    nangoFileId: nangoFile.id,
    ...(nangoFile.contentType ? { contentType: nangoFile.contentType } : {}),
  };

  const newFileId = await createFile(
    supabase,
    projectId,
    sourceId,
    nangoFile.path,
    meta,
    internalMetadata,
    checksum,
    markdown || '',
    tokenCount,
  );

  if (!newFileId) {
    return;
  }

  const sectionsData = sectionsWithEmbeddings.map<
    Omit<FileSections, 'id' | 'token_count'>
  >((section) => {
    return {
      file_id: newFileId,
      content: section.content,
      meta: (section.leadHeading
        ? { leadHeading: section.leadHeading }
        : undefined) as Json,
      embedding: section.embedding as any,
      cf_file_meta: meta as Json,
      cf_project_id: projectId,
    };
  });

  await batchStoreFileSections(supabase, sectionsData);

  // If previous file existed, delete it here (i.e. once its replacement has
  // been fully indexed, so we avoid a time where the content is not available).
  if (foundFile) {
    await batchDeleteFiles(supabase, [foundFile.id]);
  }
};

// The train function adheres to the OpenAI rate limits.
const trainFile = inngest.createFunction(
  {
    id: 'train-file',
    rateLimit: {
      limit: OPENAI_RPM[EMBEDDING_MODEL],
      period: '1m',
    },
  },
  { event: 'markprompt/file.train' },
  async ({ event }) => {
    return runTrainFile(event.data);
  },
);

const deleteFiles = inngest.createFunction(
  { id: 'delete-files' },
  { event: 'markprompt/files.delete' },
  async ({ event, logger }) => {
    logger.debug('Delete files', event.data.ids);

    const supabase = createServiceRoleSupabaseClient();

    await batchDeleteFilesBySourceAndNangoId(
      supabase,
      event.data.sourceId,
      event.data.ids,
    );
  },
);

export default serve({
  client: inngest,
  functions: [syncNangoRecords, trainFile, deleteFiles],
});

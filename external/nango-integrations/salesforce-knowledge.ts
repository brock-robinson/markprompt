/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NangoSync, NangoFile } from './models';

interface Metadata {
  customFields: string[];
  filters: string;
  mappings: {
    title: string | undefined;
    content: string | undefined;
    path: string | undefined;
  };
  metadataFields: string[];
}

export default async function fetchData(nango: NangoSync) {
  const metadata = await nango.getMetadata<Metadata>();

  const fixedFields = ['Id', 'Title', 'LastModifiedDate'];
  const customFields = (metadata?.customFields || []).filter(
    (f) => !fixedFields.includes(f),
  );
  const fields = [...fixedFields, ...customFields];

  let query = `SELECT ${fields.join(
    ', ',
  )} FROM Knowledge__kav WHERE IsLatestVersion = true`;

  const filters = metadata?.filters;

  if (filters?.length > 0) {
    query += ` AND (${filters})`;
  }

  // if (nango.lastSyncDate) {
  //   query += ` AND LastModifiedDate > ${nango.lastSyncDate.toISOString()}`;
  // }

  let endpoint = '/services/data/v53.0/query';

  const records: NangoFile[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await nango.get({
      endpoint: endpoint,
      params: endpoint === '/services/data/v53.0/query' ? { q: query } : {},
    });

    const mappedRecords = mapRecords(
      response.data.records,
      metadata?.mappings,
      metadata?.metadataFields,
    );

    for (const mappedRecord of mappedRecords) {
      records.push(mappedRecord);
    }

    if (response.data.done) {
      break;
    }

    endpoint = response.data.nextRecordsUrl;
  }

  // Important: we have enabled track_deletes, which means that everything
  // that is not present in `batchSave` calls within a sync run will be deleted.
  // Therefore, we need to call `batchSave` only once. Otherwise, if the
  // script fails after a few calls to `batchSave`, everything else will be
  // deleted. We'd rather the script fails and doesn't delete any data.
  await nango.batchSave(records, 'NangoFile');
}

function mapRecords(
  records: any[],
  mappings: Metadata['mappings'],
  metadataFields: Metadata['metadataFields'],
): NangoFile[] {
  return records.map((record: any) => {
    return {
      id: record.Id,
      path: mappings.path ? record[mappings.path] : record.Id,
      title: mappings.title ? record[mappings.title] : record.Title,
      content: mappings.content ? record[mappings.content] : '',
      contentType: 'html',
      meta: {
        ...(metadataFields || []).reduce((acc, key) => {
          return { ...acc, [key]: record[key] };
        }, {}),
      },
      error: undefined,
    };
  });
}

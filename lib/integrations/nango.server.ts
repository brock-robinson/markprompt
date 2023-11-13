import { Nango } from '@nangohq/node';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';
import { DbSource, SyncData } from '@/types/types';

export const getNangoServerInstance = () => {
  return new Nango({
    secretKey:
      process.env.NODE_ENV === 'production'
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          process.env.NANGO_SECRET_KEY_PROD!
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          process.env.NANGO_SECRET_KEY_DEV!,
  });
};

export const getSourceId = async (
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<DbSource['id'] | undefined> => {
  const { data } = await supabase
    .from('sources')
    .select('id')
    .eq('data->>connectionId', connectionId)
    .limit(1)
    .maybeSingle();
  return data?.id;
};

export const getSourceSyncData = async (
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<Pick<DbSource, 'id' | 'data'> | undefined> => {
  const { data } = await supabase
    .from('sources')
    .select('id,data')
    .eq('data->>connectionId', connectionId)
    .limit(1)
    .maybeSingle();
  if (!data) {
    return undefined;
  }
  return data;
};

export const pauseSyncForSource = async (
  supabase: SupabaseClient<Database>,
  data: SyncData,
) => {
  if (!data.integrationId || !data.connectionId || !data.syncId) {
    return;
  }

  const sourceId = await getSourceId(supabase, data.connectionId);

  if (!sourceId) {
    throw new Error('Source not found.');
  }

  const nango = getNangoServerInstance();

  const syncStatuses = await nango.syncStatus(
    data.integrationId,
    [data.syncId],
    data.connectionId,
  );

  for (const sync of syncStatuses.syncs) {
    switch (sync.status) {
      case 'RUNNING':
      case 'SUCCESS': {
        await nango.pauseSync(
          data.integrationId,
          [data.syncId],
          data.connectionId,
        );
        break;
      }
    }
  }
};

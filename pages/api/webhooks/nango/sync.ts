import { SupabaseClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getSyncId } from '@/lib/integrations/nango';
import {
  getSourceSyncData,
  pauseSyncForSource,
} from '@/lib/integrations/nango.server';
import { getTier, isAutoSyncAccessible } from '@/lib/stripe/tiers';
import {
  createServiceRoleSupabaseClient,
  getProjectIdFromSource,
} from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { NangoSourceDataType } from '@/types/types';

import { inngest } from '../../inngest';
import type { NangoSyncPayload } from '../../inngest';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | { content: string };

const allowedMethods = ['POST'];

const shouldPauseSync = async (
  supabase: SupabaseClient<Database>,
  nangoSyncPayload: NangoSyncPayload,
) => {
  const sourceSyncData = await getSourceSyncData(
    supabase,
    nangoSyncPayload.connectionId,
  );

  if (!sourceSyncData) {
    return true;
  }

  const projectId = await getProjectIdFromSource(supabase, sourceSyncData.id);

  const { data } = await supabase
    .from('teams')
    .select('stripe_price_id,plan_details,projects (id)')
    .eq('projects.id', projectId)
    .limit(1)
    .maybeSingle();

  if (!data) {
    return true;
  }

  return !isAutoSyncAccessible(data);
};

const pauseConnection = async (
  supabase: SupabaseClient<Database>,
  connectionId: string,
) => {
  const sourceSyncData = await getSourceSyncData(supabase, connectionId);
  const data = sourceSyncData?.data as NangoSourceDataType;
  const integrationId = data.integrationId;

  if (!integrationId || !connectionId) {
    return;
  }

  const syncId = getSyncId(integrationId);

  await pauseSyncForSource(supabase, {
    integrationId,
    connectionId,
    syncId,
  });
};

// This webhook is called whenever Nango finishes a sync. It sends a message
// to Inngest for indexing the new Nango data. It also pauses the sync unless
// the tier has auto-sync available.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  console.debug('[NANGO] Webhook called', JSON.stringify(req.body));

  const nangoSyncPayload = req.body as NangoSyncPayload;

  await inngest.send({
    name: 'nango/sync',
    data: nangoSyncPayload,
  });

  const supabase = createServiceRoleSupabaseClient();

  // If this is a non-enterprise project, pause the sync
  const shouldPause = await shouldPauseSync(supabase, nangoSyncPayload);
  if (shouldPause) {
    await pauseConnection(supabase, nangoSyncPayload.connectionId);
  }

  return res.status(200).json({});
}

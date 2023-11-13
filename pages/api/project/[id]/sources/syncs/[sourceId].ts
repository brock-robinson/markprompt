import type { NextApiRequest, NextApiResponse } from 'next';

import { withProjectAccess } from '@/lib/middleware/common';
import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { DbSource, DbSyncQueue } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | DbSyncQueue[];

const allowedMethods = ['GET'];

// Admin access to Supabase, bypassing RLS.
const supabase = createServiceRoleSupabaseClient();

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    if (req.method !== 'GET') {
      return res.status(400).end();
    }

    const sourceId = req.query.sourceId as DbSource['id'];

    const { data } = await supabase
      .from('sync_queues')
      .select('*')
      .eq('source_id', sourceId)
      .order('created_at', { ascending: false })
      .limit(50);

    return res.status(200).json(data || []);
  },
);

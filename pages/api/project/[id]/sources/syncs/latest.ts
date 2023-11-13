import type { NextApiRequest, NextApiResponse } from 'next';

import { withProjectAccess } from '@/lib/middleware/common';
import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { Project, DbSyncQueueOverview } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | DbSyncQueueOverview[];

const allowedMethods = ['GET'];

// Admin access to Supabase, bypassing RLS.
const supabase = createServiceRoleSupabaseClient();

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    if (req.method !== 'GET') {
      return res.status(400).end();
    }

    const projectId = req.query.id as Project['id'];

    const { data } = await supabase.rpc('get_latest_sync_queues', {
      project_id: projectId,
    });

    return res.status(200).json(data || []);
  },
);

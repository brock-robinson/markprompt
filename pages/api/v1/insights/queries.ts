import { NextApiRequest, NextApiResponse } from 'next';

import { createServiceRoleSupabaseClient, getQueryStats } from '@/lib/supabase';
import { safeParseInt } from '@/lib/utils.nodeps';
import { PromptQueryStat } from '@/types/types';

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createServiceRoleSupabaseClient();

type Data =
  | {
      status?: string;
      error?: string;
    }
  | { queries: PromptQueryStat[] };

const allowedMethods = ['GET'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  // Preflight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (req.method === 'GET') {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return res.status(400).json({ error: 'Please provide a projectId.' });
    }

    const limit = Math.min(safeParseInt(req.query.limit as string, 50), 50);
    const page = Math.max(safeParseInt(req.query.page as string, 0), 0);
    const { queries, error } = await getQueryStats(
      supabaseAdmin,
      projectId,
      req.query.from as string,
      req.query.to as string,
      limit,
      page,
      [],
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!queries) {
      return res.status(404).json({ error: 'No results found.' });
    }

    return res.status(200).json({ queries });
  }

  return res.status(200).json({ status: 'ok' });
}

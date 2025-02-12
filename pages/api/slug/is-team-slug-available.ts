import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

import { isTeamSlugAvailable } from './generate-team-slug';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | boolean;

const allowedMethods = ['POST'];

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createServiceRoleSupabaseClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isAvailable = await isTeamSlugAvailable(supabaseAdmin, req.body.slug);

  return res.status(200).json(isAvailable);
}

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { withProjectAccess } from '@/lib/middleware/common';
import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { safeParseInt } from '@/lib/utils.nodeps';
import { Database } from '@/types/supabase';
import { Project, ReferenceWithOccurrenceCount } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | ReferenceWithOccurrenceCount[];

const allowedMethods = ['GET'];

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createServiceRoleSupabaseClient();

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    if (!req.method || !allowedMethods.includes(req.method)) {
      res.setHeader('Allow', allowedMethods);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }

    const supabase = createServerSupabaseClient<Database>({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const projectId = req.query.id as Project['id'];

    if (req.method === 'GET') {
      const limit = Math.min(safeParseInt(req.query.limit as string, 50), 50);
      const {
        error,
        data: references,
      }: {
        error: { message: string } | null;
        data:
          | {
              path: string;
              occurrences: number;
              source_type: any;
              source_data: any;
            }[]
          | null;
      } = await supabaseAdmin.rpc('query_stats_top_references', {
        project_id: projectId,
        from_tz: req.query.from as string,
        to_tz: req.query.to as string,
        match_count: limit,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!references) {
        return res.status(404).json({ error: 'No results found.' });
      }

      return res.status(200).json(references);
    }

    return res.status(400).end();
  },
);

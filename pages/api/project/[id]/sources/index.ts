import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { withProjectAccess } from '@/lib/middleware/common';
import { Database } from '@/types/supabase';
import { Project, DbSource, SourceType } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | DbSource[]
  | DbSource;

const allowedMethods = ['POST', 'PATCH', 'GET', 'DELETE'];

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    const supabase = createServerSupabaseClient<Database>({ req, res });

    const projectId = req.query.id as Project['id'];

    if (req.method === 'GET') {
      const { data: sources, error } = await supabase
        .from('sources')
        .select('*')
        .eq('project_id', projectId)
        .order('inserted_at', { ascending: true });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(sources);
    } else if (req.method === 'POST') {
      const sourceType = req.body.type as SourceType;
      const data = req.body.data as any;

      const { error, data: newSource } = await supabase
        .from('sources')
        .insert([
          {
            project_id: projectId,
            type: sourceType,
            data,
          },
        ])
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!newSource) {
        return res.status(400).json({ error: 'Error generating token.' });
      }

      return res.status(200).json(newSource);
    } else if (req.method === 'PATCH') {
      const sourceId = req.body.sourceId as string;
      const data = req.body.data as any;

      if (!sourceId) {
        return res.status(400).json({ error: 'Please provide a source id' });
      }

      await supabase.from('sources').update({ data }).eq('id', sourceId);

      return res.status(200).json({ status: 'ok' });
    } else if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('sources')
        .delete()
        .eq('id', req.body.id);
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ status: 'ok' });
    }

    return res.status(400).end();
  },
);

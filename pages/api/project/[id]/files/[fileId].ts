import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { withProjectAccess } from '@/lib/middleware/common';
import { Database } from '@/types/supabase';
import { DbFile } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | DbFile;

const allowedMethods = ['GET'];

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    const supabase = createServerSupabaseClient<Database>({ req, res });

    if (req.method === 'GET') {
      const fileId = req.query.fileId as string;

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching file:', error.message);
        return res.status(400).json({ error: error.message });
      }

      if (!data) {
        console.error('File not found');
        return res.status(404).json({ error: `File ${fileId} not found.` });
      }

      return res.status(200).json(data);
    }

    return res.status(400).end();
  },
);

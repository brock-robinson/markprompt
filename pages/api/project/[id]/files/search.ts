import { Source } from '@markprompt/core';
import {
  SupabaseClient,
  createServerSupabaseClient,
} from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { withProjectAccess } from '@/lib/middleware/common';
import { Database } from '@/types/supabase';
import { DbFile, DbSource, Project } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | DbFile['id'];

const allowedMethods = ['POST'];

const getSourceId = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  source: Source,
): Promise<DbSource['id'] | undefined> => {
  switch (source.type) {
    case 'github':
    case 'website':
      return (
        await supabase
          .from('sources')
          .select('id')
          .eq('project_id', projectId)
          .eq('type', source.type)
          .eq('data->>url', source.data?.url)
          .limit(1)
          .maybeSingle()
      )?.data?.id;
    case 'file-upload':
    case 'api-upload':
      return (
        await supabase
          .from('sources')
          .select('id')
          .eq('project_id', projectId)
          .eq('type', source.type)
          .limit(1)
          .maybeSingle()
      )?.data?.id;
    case 'motif':
      return (
        await supabase
          .from('sources')
          .select('id')
          .eq('project_id', projectId)
          .eq('type', source.type)
          .eq('data->>projectDomain', (source.data as any)?.projectDomain)
          .limit(1)
          .maybeSingle()
      )?.data?.id;
    case 'nango': {
      return (
        await supabase
          .from('sources')
          .select('id')
          .eq('project_id', projectId)
          .eq('type', source.type)
          .eq('data->>connectionId', (source.data as any)?.connectionId)
          .limit(1)
          .maybeSingle()
      )?.data?.id;
    }
  }

  return undefined;
};

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    const supabase = createServerSupabaseClient<Database>({ req, res });

    if (req.method === 'POST') {
      const projectId = req.query.id as string;
      const sourceData = req.body.source;
      const path = req.body.path;

      const sourceId = await getSourceId(supabase, projectId, sourceData);

      if (!sourceId) {
        return res.status(400).json({ error: 'Source not found' });
      }

      const { data, error } = await supabase
        .from('files')
        .select('id')
        .eq('path', path)
        .eq('source_id', sourceId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching file:', error.message);
        return res.status(400).json({ error: error.message });
      }

      if (!data) {
        console.error('File not found');
        return res.status(404).json({ error: `File ${path} not found.` });
      }

      return res.status(200).json(data.id);
    }

    return res.status(400).end();
  },
);

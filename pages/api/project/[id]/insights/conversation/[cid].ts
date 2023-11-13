import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { withProjectAccess } from '@/lib/middleware/common';
import { safeParseJSON } from '@/lib/utils.nodeps';
import { Database } from '@/types/supabase';
import { DbQueryStat, PromptQueryStatFull } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | PromptQueryStatFull[];

const allowedMethods = ['GET'];

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    const supabase = createServerSupabaseClient<Database>({ req, res });

    if (req.method === 'GET') {
      const conversationId = req.query.cid as DbQueryStat['id'];
      const { data, error } = await supabase
        .from('decrypted_query_stats')
        .select(
          'id,created_at,decrypted_prompt,decrypted_response,no_response,feedback,meta,processed_state,decrypted_conversations(decrypted_metadata)',
        )
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error fetching conversation:', error.message);
        return res.status(400).json({ error: error.message });
      }

      const readyFullQueryStats = data
        ?.filter((d) => {
          return (
            d.processed_state === 'processed' || d.processed_state === 'skipped'
          );
        })
        .map((d) => {
          const {
            decrypted_prompt,
            decrypted_response,
            decrypted_conversations,
            ...rest
          } = d;

          const decrypted_conversation = decrypted_conversations as {
            decrypted_metadata: string | null;
          };

          let conversationMetadata: any = {};
          if (decrypted_conversation?.decrypted_metadata) {
            conversationMetadata = safeParseJSON(
              decrypted_conversation?.decrypted_metadata,
              undefined,
            );
          }

          return {
            ...rest,
            prompt: decrypted_prompt,
            response: decrypted_response,
            conversationMetadata,
          } as PromptQueryStatFull;
        });

      if (readyFullQueryStats?.length === 0) {
        return res.status(404).json({ error: 'No messages found.' });
      }

      return res.status(200).json(readyFullQueryStats);
    }

    return res.status(400).end();
  },
);

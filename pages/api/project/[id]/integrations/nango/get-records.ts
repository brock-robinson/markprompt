import type { NextApiRequest, NextApiResponse } from 'next';

import { getNangoServerInstance } from '@/lib/integrations/nango.server';
import { withProjectAccess } from '@/lib/middleware/common';
import { FileData, NangoFileWithMetadata } from '@/types/types';

type Data = {
  status?: string;
  error?: string;
  fileData?: FileData[];
};

const allowedMethods = ['POST'];

export default withProjectAccess(
  allowedMethods,
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    if (req.method === 'POST') {
      if (!req.body.integrationId) {
        return res.status(400).json({ error: 'No integration id provided.' });
      } else if (!req.body.connectionId) {
        return res.status(400).json({ error: 'No connection id provided.' });
      }

      const nango = getNangoServerInstance();

      const records = await nango.getRecords({
        providerConfigKey: req.body.integrationId,
        connectionId: req.body.connectionId,
        model: req.body.model,
        delta: req.body.delta,
        offset: req.body.offset,
        limit: req.body.limit,
        sortBy: req.body.sortBy,
        order: req.body.order,
        filter: req.body.filter,
      });

      const fileData = records?.map((record: NangoFileWithMetadata) => {
        return {
          path: record.path,
          name: record.title,
          content: record.content,
          metadata: {
            title: record.title,
            ...record.meta,
          },
          contentType: record.contentType,
        } as FileData;
      });

      return res.status(200).json({ fileData });
    }

    return res.status(400).end();
  },
);

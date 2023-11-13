import type { NextApiRequest, NextApiResponse } from 'next';

import { getNangoServerInstance } from '@/lib/integrations/nango.server';
import { withProjectAccess } from '@/lib/middleware/common';

type Data = {
  status?: string;
  error?: string;
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

      await nango.deleteConnection(
        req.body.integrationId,
        req.body.connectionId,
      );

      return res.status(200).json({});
    }

    return res.status(400).end();
  },
);

import type { NextApiRequest, NextApiResponse } from 'next';

import { SystemStatus } from '@/types/types';

type Data =
  | {
      error?: any;
    }
  | SystemStatus;

const allowedMethods = ['GET'];

export const getSystemStatus = async (): Promise<SystemStatus> => {
  try {
    const json = await fetch(
      `https://betteruptime.com/api/v2/status-pages/${process.env.BETTERSTACK_MARKPROMPT_STATUS_PAGE_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.BETTERSTACK_API_TOKEN}`,
        },
      },
    ).then((r) => r.json());

    return json?.data?.attributes?.aggregate_state || 'operational';
  } catch {
    return 'operational';
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const status = await getSystemStatus();
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error });
  }
}

import { Tag } from '@/components/ui/Tag';
import { DbSyncQueueOverview } from '@/types/types';

export const getTagForSyncQueue = (status: DbSyncQueueOverview['status']) => {
  switch (status) {
    case 'complete':
      return <Tag color="green">Synced</Tag>;
    case 'canceled':
      return <Tag color="orange">Canceled</Tag>;
    case 'errored':
      return <Tag color="red">Errored</Tag>;
    case 'running':
      return <Tag color="fuchsia">Syncing</Tag>;
  }
};

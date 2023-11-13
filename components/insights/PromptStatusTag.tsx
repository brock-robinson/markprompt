import { Tag } from '@/components/ui/Tag';

export const PromptStatusTag = ({ noResponse }: { noResponse: boolean }) => {
  return (
    <Tag color={noResponse ? 'orange' : 'green'}>
      {noResponse ? 'No response' : 'Answered'}
    </Tag>
  );
};

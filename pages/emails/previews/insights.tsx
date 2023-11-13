import { add, endOfWeek, format, startOfWeek } from 'date-fns';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { FC, useCallback, useState } from 'react';
import { toast } from 'sonner';

import { PreviewWrapper } from '@/components/emails/PreviewWrapper';
import { sampleUserUsageStats } from '@/lib/samples/data';

// SSR = false to avoid hydration warnings.
const InsightsEmail = dynamic(() => import('@/components/emails/Insights'), {
  ssr: false,
});

const referenceDate = add(new Date(), { days: -7 });

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      stats: sampleUserUsageStats,
    },
    revalidate: 60,
  };
};

const PreviewPage: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  stats,
}) => {
  const [sending, setSending] = useState(false);

  const sendBatch = useCallback(async () => {
    const res = await fetch('/api/cron/weekly-update-email?test=1');
    if (!res.ok) {
      console.error(await res.text());
      toast.error('Error sending emails, see console logs');
      return;
    }
    const json = await res.json();
    console.debug('Response:', JSON.stringify(json, null, 2));
    toast.error('Email has been sent!');
  }, []);

  const from = startOfWeek(referenceDate);
  const to = endOfWeek(referenceDate);

  return (
    <PreviewWrapper
      title="Insights Email Preview"
      width="sm"
      onSendClick={async () => {
        setSending(true);
        await sendBatch();
        setSending(false);
      }}
      sending={sending}
    >
      <InsightsEmail
        preview={`Markprompt weekly report for ${format(
          from,
          'LLL dd',
        )} - ${format(to, 'LLL dd, y')}`}
        withHtml={false}
        stats={stats}
        from={from}
        to={to}
      />
    </PreviewWrapper>
  );
};

export default PreviewPage;

import { promises as fs } from 'fs';
import path from 'path';

import { formatISO, parseISO } from 'date-fns';
import matter from 'gray-matter';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { FC, useCallback, useState } from 'react';
import { toast } from 'sonner';

import { PreviewWrapper } from '@/components/emails/PreviewWrapper';

const EMAIL_ID = '2023-08-25-insights';
const EMAIL_FOLDER = 'resources/newsletters';

// SSR = false to avoid hydration warnings.
const NewsletterEmail = dynamic(
  () => import('@/components/emails/Newsletter'),
  {
    ssr: false,
  },
);

export const getStaticProps: GetStaticProps = async () => {
  const postsDirectory = path.join(process.cwd(), EMAIL_FOLDER);
  const filePath = path.join(postsDirectory, `${EMAIL_ID}.md`);
  const _matter = matter(await fs.readFile(filePath, 'utf8'));
  const frontmatter = _matter.data;
  const markdown = _matter.content.trim();

  return {
    props: {
      markdown,
      subject: frontmatter?.title,
      preview: frontmatter?.preview,
      date: formatISO(frontmatter?.date),
      templateId: frontmatter.template,
    },
    revalidate: 60,
  };
};

const PreviewPage: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  subject,
  markdown,
  preview,
  date,
  templateId,
}) => {
  const [sending, setSending] = useState(false);
  const _date = parseISO(date);

  const sendBatch = useCallback(
    async (num = 0, processed = 0) => {
      console.debug(`Sending batch ${num}`);
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          markdown,
          preview,
          templateId,
          emailId: EMAIL_ID,
          date: formatISO(_date),
        }),
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });
      if (!res.ok) {
        console.error(await res.text());
        toast.error('Error sending emails, see console logs');
        return;
      }

      const json = await res.json();
      console.debug('Response:', JSON.stringify(json, null, 2));
      if (json.done) {
        toast.error('Emails have been sent!');
      } else {
        await sendBatch(num + 1, processed + (json.emails || []).length);
      }
    },
    [_date, markdown, preview, subject, templateId],
  );

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
      InfoPanel={
        <div
          className="grid w-full grid-cols-2 gap-y-2 gap-x-4 truncate text-sm"
          style={{
            gridTemplateColumns: 'auto 1fr',
          }}
        >
          <div>Template</div>
          <div className="font-bold">{templateId}</div>
          <div>Subject</div>
          <div className="font-bold">{subject}</div>
          <div>Preview</div>
          <div className="font-bold">{preview}</div>
        </div>
      }
    >
      <NewsletterEmail
        date={_date}
        markdown={markdown}
        preview={preview}
        templateId={templateId}
      />
    </PreviewWrapper>
  );
};

export default PreviewPage;

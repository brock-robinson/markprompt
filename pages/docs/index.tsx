import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { FC } from 'react';

import { DocsLayout } from '@/components/layouts/DocsLayout';
import { SharedHead } from '@/components/pages/SharedHead';
import { getMarkdocStaticProps } from '@/lib/pages';

export const getStaticProps: GetStaticProps = async () => {
  return getMarkdocStaticProps(process.env.MOTIF_DOCS_PAGE_ID!);
};

const DocsPage: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  content,
  toc,
}) => {
  return (
    <>
      <SharedHead
        title="Markprompt Docs"
        ogImage="https://markprompt.com/static/cover-docs.png"
        section="docs"
        exludePostfixFromTitle
      />
      <DocsLayout content={JSON.parse(content)} toc={toc} />
    </>
  );
};

export default DocsPage;

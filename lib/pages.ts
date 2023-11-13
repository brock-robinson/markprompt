import { parse, transform } from '@markdoc/markdoc';
import dayjs from 'dayjs';
import yaml from 'js-yaml';
import { GetStaticProps } from 'next';

import {
  buttonTag,
  collapseGroupTag,
  collapseTag,
  createTOC,
  fenceNode,
  headingNode,
  iconTags,
  imageNode,
  noteTag,
  videoTag,
  youtubeTag,
} from '@/components/layouts/MarkdocLayout';
import { getSystemStatus } from '@/pages/api/status';
import { SystemStatus } from '@/types/types';

import { DEFAULT_SYSTEM_PROMPT } from './prompt';

export const getMarkdocStaticProps = async (pageId: string) => {
  const res = await fetch(`https://api.motif.land/v1/exports/raw/${pageId}`);
  const rawText = await res.text();
  const ast = parse(rawText);
  const config = {
    nodes: {
      fence: fenceNode,
      heading: headingNode,
      image: imageNode,
    },
    tags: {
      button: buttonTag,
      note: noteTag,
      collapsegroup: collapseGroupTag,
      collapse: collapseTag,
      video: videoTag,
      youtube: youtubeTag,
      img: imageNode,
      ...iconTags,
    },
    variables: {
      defaultPromptTemplate: DEFAULT_SYSTEM_PROMPT.content,
    },
  };

  const frontmatter = ast.attributes.frontmatter
    ? yaml.load(ast.attributes.frontmatter)
    : {};

  const content = transform(ast, config);
  const toc = createTOC(content);

  return {
    props: { content: JSON.stringify(content), toc, frontmatter },
    revalidate: 60,
  };
};

const getPageFrontmatter = async (pageId: string) => {
  const res = await fetch(`https://api.motif.land/v1/exports/raw/${pageId}`);
  const rawText = await res.text();
  const ast = parse(rawText);
  return ast.attributes.frontmatter
    ? yaml.load(ast.attributes.frontmatter)
    : {};
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const blogPageIds = JSON.parse(process.env.MOTIF_BLOG_PAGE_IDS!) as {
  [key: string]: string;
};

const repo = 'https://api.github.com/repos/motifland/markprompt';

export type BlogPostMetadata = {
  path: string;
  frontmatter: {
    title: string;
    date: string;
    description: string;
    authors: {
      name: string;
      twitter: string;
      avatar: string;
    }[];
    cover?: string;
  };
};

export const getBlogIndexStaticProps = async (
  limit?: number,
): Promise<{
  props: { posts: BlogPostMetadata[] };
}> => {
  const metadata: BlogPostMetadata[] = await Promise.all(
    Object.keys(blogPageIds).map(async (path) => {
      const frontmatter = (await getPageFrontmatter(
        blogPageIds[path],
      )) as BlogPostMetadata['frontmatter'];
      return { path, frontmatter };
    }),
  );

  let sortedMetadata = metadata.sort((entry1, entry2) => {
    if (!entry1.frontmatter?.date || !entry2.frontmatter?.date) {
      return 0;
    }
    const date1 = dayjs(entry1.frontmatter?.date).valueOf();
    const date2 = dayjs(entry2.frontmatter?.date).valueOf();
    return date1 > date2 ? -1 : 1;
  });

  if (limit && limit > 0) {
    sortedMetadata = sortedMetadata.slice(0, limit);
  }

  return { props: { posts: sortedMetadata } };
};

export const getIndexPageStaticProps = async (): Promise<{
  props: { stars: number; status: SystemStatus };
}> => {
  let stars = 1900;
  try {
    // Sometimes, the GitHub fetch call fails, so update the current star
    // count value regularly, as a fallback
    const json = await fetch(repo).then((r) => r.json());
    stars = json.stargazers_count || 1900;
  } catch {
    // Do nothing
  }

  const status = await getSystemStatus();

  return { props: { stars, status } };
};

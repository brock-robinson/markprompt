import { load } from 'cheerio';
import { isPresent } from 'ts-is-present';

import { RobotsTxtInfo } from '@/types/types';

import { MarkdownProcessorOptions } from '../schema';
import { removeTrailingSlashQueryParamsAndHash } from '../utils';

export type RequestHeader = { key: string; value: string };

export type WebsitePagesSyncMetadata = {
  baseUrl: string;
  includeRegexes?: string[];
  excludeRegexes?: string[];
  requestHeaders?: RequestHeader[];
  targetSelectors?: string;
  excludeSelectors?: string;
  processorOptions?: MarkdownProcessorOptions;
};

export const fetchRobotsTxtInfo = async (
  baseUrl: string,
): Promise<RobotsTxtInfo> => {
  const robotsTxt = await fetchPageContent(
    `${baseUrl}/robots.txt`,
    true,
    false,
  );
  if (!robotsTxt) {
    return {
      disallowedPaths: [],
    };
  }

  const lines = robotsTxt.split('\n');
  let sitemap: string | undefined = undefined;
  const disallowedPaths: string[] = [];
  let isInStarUserAgentSection = false;

  for (const line of lines) {
    if (line.startsWith('Sitemap:')) {
      sitemap = line.replace(/^Sitemap:/, '').trim();
    }

    const normalizedLine = line.toLowerCase().trim();
    if (normalizedLine.startsWith('user-agent:')) {
      if (normalizedLine === 'user-agent: *') {
        isInStarUserAgentSection = true;
      } else {
        isInStarUserAgentSection = false;
      }
    }

    if (isInStarUserAgentSection) {
      if (normalizedLine.startsWith('disallow:')) {
        disallowedPaths.push(normalizedLine.split(':').slice(1).join(':'));
      }
    }
  }

  return {
    sitemap,
    disallowedPaths,
  };
};

export const isSitemapUrl = (url: string) => {
  return url.endsWith('.xml');
};

export const fetchSitemapUrls = async (
  sitemapUrl: string,
  useCustomPageFetcher: boolean,
): Promise<string[]> => {
  const sitemap = await fetchPageContent(
    sitemapUrl,
    false,
    useCustomPageFetcher,
  );

  if (!sitemap) {
    return [];
  }

  const pageUrls: string[] = [];

  const addPageUrl = (url: string) => {
    try {
      const normalizedUrl = removeTrailingSlashQueryParamsAndHash(url);
      if (!pageUrls.includes(normalizedUrl)) {
        pageUrls.push(normalizedUrl);
      }
    } catch {
      // Ignore page
    }
  };

  const $ = load(sitemap, { xmlMode: true });

  const subSitemapUrls: string[] = [];
  $('sitemapindex > sitemap > loc').each(function () {
    const url = $(this).text();
    if (!subSitemapUrls.includes(url)) {
      subSitemapUrls.push(url);
    }
  });

  for (const subSitemapUrl of subSitemapUrls) {
    const subPageUrls = await fetchSitemapUrls(
      subSitemapUrl,
      useCustomPageFetcher,
    );
    for (const subPageUrl of subPageUrls) {
      addPageUrl(subPageUrl);
    }
  }

  $('url > loc').each(function () {
    addPageUrl($(this).text());
  });

  return pageUrls;
};

export const fetchPageContent = async (
  url: string,
  immediate: boolean,
  useCustomPageFetcher: boolean,
): Promise<string | undefined> => {
  const res = await fetch('/api/integrations/website/fetch-page', {
    method: 'POST',
    body: JSON.stringify({ url, immediate, useCustomPageFetcher }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  if (res.ok) {
    return (await res.json()).content;
  }
  return undefined;
};

export const isWebsiteAccessible = async (
  url: string,
  useCustomPageFetcher: boolean,
) => {
  // Some pages, like a sitemap.xml, may require a custom page fetcher
  // service to load.
  const page = await fetchPageContent(url, false, useCustomPageFetcher);
  return !!page;
};

export const extractLinksFromHtml = (html: string) => {
  const $ = load(html);
  const hrefs: string[] = [];
  // Filter on href attribute rather than tag. Several other tags
  // than <a> support href attributes, such as <area>.
  $('*[href]')
    .each((i, link) => {
      const s = $(link).attr('href')?.toString();
      if (s) {
        hrefs.push(s);
      }
    })
    .filter(isPresent);
  return hrefs;
};

import type { NangoSync, NangoFile } from './models';

interface Metadata {
  baseUrl: string;
  includeRegexes?: string[];
  excludeRegexes?: string[];
  requestHeaders?: { [key: string]: string };
}

type NangoWebpageFile = Pick<
  NangoFile,
  'id' | 'path' | 'content' | 'contentType' | 'error'
>;

type PageFetchResponse = {
  file: NangoWebpageFile;
  nextUrls?: string[];
};

const chunkArray = (arr: string[], chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

const unique = (arr: string[]) => {
  const result: string[] = [];

  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] as string;
    if (result.indexOf(v) === -1) {
      result.push(v);
    }
  }

  return result;
};

const WEBSITE_PAGES_PROVIDER_CONFIG_KEY = 'website-pages';

const fetchPageAndUrlsWithRetryWithThrows = async (
  nango: NangoSync,
  url: string,
  pageFetcherServiceBaseUrl: string,
  pageFetcherServicePath: string,
  pageFetcherServiceAPIToken: string,
  crawlerRoot: string,
  requestHeaders: { [key: string]: string } | undefined,
  includeRegexes: string[] | undefined,
  excludeRegexes: string[] | undefined,
): Promise<PageFetchResponse> => {
  // Note that this endpoint returns FULL urls. That is, it has resolved
  // e.g. absolute and relative URLs to their fully specified paths with
  // base URL prepended.

  await nango.log('Fetching ' + url);

  const res = await nango.proxy({
    method: 'POST',
    baseUrlOverride: pageFetcherServiceBaseUrl,
    endpoint: pageFetcherServicePath,
    providerConfigKey: WEBSITE_PAGES_PROVIDER_CONFIG_KEY,
    connectionId: nango.connectionId!,
    retries: 10,
    data: {
      url,
      crawlerRoot,
      includePageUrls: true,
      requestHeaders,
      includeRegexes,
      excludeRegexes,
    },
    headers: {
      Authorization: `Bearer ${pageFetcherServiceAPIToken}`,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });

  return {
    file: {
      id: url,
      path: url,
      content: res.data.content,
      contentType: 'html',
      error: undefined,
    },
    nextUrls: res.data.urls || [],
  };
};

const fetchPageAndUrlsWithRetry =
  (
    nango: NangoSync,
    pageFetcherServiceBaseUrl: string,
    pageFetcherServicePath: string,
    pageFetcherServiceAPIToken: string,
    crawlerRoot: string,
    requestHeaders: { [key: string]: string } | undefined,
    includeRegexes: string[] | undefined,
    excludeRegexes: string[] | undefined,
    retryAttempt: number,
    maxRetries: number,
  ) =>
  async (url: string): Promise<PageFetchResponse> => {
    try {
      const res = await fetchPageAndUrlsWithRetryWithThrows(
        nango,
        url,
        pageFetcherServiceBaseUrl,
        pageFetcherServicePath,
        pageFetcherServiceAPIToken,
        crawlerRoot,
        requestHeaders,
        includeRegexes,
        excludeRegexes,
      );
      return res;
    } catch (e) {
      if (retryAttempt >= maxRetries) {
        return {
          file: {
            id: url,
            path: url,
            content: undefined,
            contentType: undefined,
            error: `${e}`,
          },
        };
      } else {
        // setTimeout is not defined in the Nango runtime
        // await timeout(
        //   (800 + Math.round(Math.random() * 400)) * Math.pow(2, retryAttempt),
        // );
        const res = await fetchPageAndUrlsWithRetry(
          nango,
          pageFetcherServiceBaseUrl,
          pageFetcherServicePath,
          pageFetcherServiceAPIToken,
          crawlerRoot,
          requestHeaders,
          includeRegexes,
          excludeRegexes,
          retryAttempt + 1,
          maxRetries,
        )(url);
        return res;
      }
    }
  };

const parallelFetchPages = async (
  nango: NangoSync,
  pageFetcherServiceBaseUrl: string,
  pageFetcherServicePath: string,
  pageFetcherServiceAPIToken: string,
  crawlerRoot: string,
  urls: string[],
  requestHeaders: { [key: string]: string } | undefined,
  includeRegexes: string[] | undefined,
  excludeRegexes: string[] | undefined,
): Promise<PageFetchResponse[]> => {
  return (
    await Promise.all(
      urls.map(
        fetchPageAndUrlsWithRetry(
          nango,
          pageFetcherServiceBaseUrl,
          pageFetcherServicePath,
          pageFetcherServiceAPIToken,
          crawlerRoot,
          requestHeaders,
          includeRegexes,
          excludeRegexes,
          0,
          5,
        ),
      ),
    )
  ).filter((f) => !!f) as PageFetchResponse[];
};

const fetchPages = async (
  nango: NangoSync,
  pageFetcherServiceBaseUrl: string,
  pageFetcherServicePath: string,
  pageFetcherServiceAPIToken: string,
  crawlerRoot: string,
  urls: string[],
  requestHeaders: { [key: string]: string } | undefined,
  includeRegexes: string[] | undefined,
  excludeRegexes: string[] | undefined,
): Promise<{ files: NangoWebpageFile[]; nextUrls: string[] }> => {
  const files: NangoWebpageFile[] = [];
  const nextUrls: string[] = [];

  const parallelization = 40;
  const urlChunks = chunkArray(urls, parallelization);

  for (const urlChunk of urlChunks) {
    const filesWithUrls = await parallelFetchPages(
      nango,
      pageFetcherServiceBaseUrl,
      pageFetcherServicePath,
      pageFetcherServiceAPIToken,
      crawlerRoot,
      urlChunk,
      requestHeaders,
      includeRegexes,
      excludeRegexes,
    );
    filesWithUrls
      .flatMap((f) => f.file)
      .forEach((f) => {
        files.push(f);
      });
    filesWithUrls
      .flatMap((f) => f.nextUrls || [])
      .forEach((url) => {
        nextUrls.push(url);
      });
  }

  return { files, nextUrls: unique(nextUrls) };
};

export default async function fetchData(nango: NangoSync) {
  if (!nango.connectionId) {
    return;
  }

  const { baseUrl, includeRegexes, excludeRegexes, requestHeaders } =
    await nango.getMetadata<Metadata>();

  if (!baseUrl) {
    throw new Error('Missing base URL.');
  }

  const envVariables = await nango.getEnvironmentVariables();
  const pageFetcherServiceBaseUrl = envVariables?.find(
    (v) => v.name === 'CUSTOM_PAGE_FETCH_SERVICE_BASE_URL',
  )?.value;
  const pageFetcherServicePath = envVariables?.find(
    (v) => v.name === 'CUSTOM_PAGE_FETCH_SERVICE_PATH',
  )?.value;
  const pageFetcherServiceAPIToken = envVariables?.find(
    (v) => v.name === 'MARKPROMPT_API_TOKEN',
  )?.value;

  if (
    !pageFetcherServiceBaseUrl ||
    !pageFetcherServicePath ||
    !pageFetcherServiceAPIToken
  ) {
    throw new Error('Missing page fetcher service URL or API token.');
  }

  const filesToSave: NangoWebpageFile[] = [];

  const processedUrls: string[] = [];
  let linksToProcess = [baseUrl];

  const maxAllowedPages = 10000;
  let numProcessedLinks = 0;

  await nango.log(`linksToProcess: ${JSON.stringify(linksToProcess)}`);

  while (linksToProcess.length > 0) {
    try {
      numProcessedLinks += linksToProcess.length;

      const { files, nextUrls } = await fetchPages(
        nango,
        pageFetcherServiceBaseUrl,
        pageFetcherServicePath,
        pageFetcherServiceAPIToken,
        baseUrl,
        linksToProcess,
        requestHeaders,
        includeRegexes,
        excludeRegexes,
      );

      files.forEach((file) => {
        filesToSave.push(file);
      });

      linksToProcess.forEach((url) => {
        processedUrls.push(url);
      });

      linksToProcess = nextUrls
        .filter((url) => !processedUrls.includes(url))
        .slice(0, Math.max(0, maxAllowedPages - numProcessedLinks));
    } catch (e) {
      await nango.log(`[website-pages] ERROR: ${e}`);
      break;
    }
  }

  await nango.log(`Files to save: ${filesToSave.length}`);

  await nango.log(
    'batchSave called!\n\n' +
      JSON.stringify(
        filesToSave.map((f) => ({
          id: f.id,
          content: f.content?.slice(0, 200),
        })),
      ),
  );

  await nango.batchSave(filesToSave, 'NangoFile');
}

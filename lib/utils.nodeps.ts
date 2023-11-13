// Utilities that run without dependencies on any runtime, like
// edge, node or browser. Anything in here can run anywhere.
import { OpenAIChatCompletionsModelId } from '@markprompt/core';

import { DbSource, OpenAIModelIdWithType, Source } from '@/types/types';

import { APPROX_CHARS_PER_TOKEN } from './constants';

export const getNameFromUrlOrPath = (url: string) => {
  // When processing a text file, the type of a file (md, mdoc, html, etc)
  // is determined by the file name, specifically by its extension. In
  // the case where we are parsing websites, the URL of the page might
  // not contain the HTML extension, we nevertheless consider it as an
  // HTML file.
  const baseName = url.split('/').slice(-1)[0];
  if (/\.html$/.test(baseName)) {
    return baseName;
  } else if (baseName.length > 0) {
    return `${baseName}.html`;
  } else {
    return 'index.html';
  }
};

export const getFileNameForSourceAtPath = (source: Source, path: string) => {
  switch (source.type) {
    case 'website': {
      // Handles e.g. index.html when last path component is empty
      return getNameFromUrlOrPath(path);
    }
    default:
      return path.split('/').slice(-1)[0];
  }
};

export const getNameForPath = (
  sources: DbSource[],
  sourceId: DbSource['id'],
  path: string,
) => {
  const source = sources.find((s) => s.id === sourceId);
  if (!source) {
    return path;
  }
  return getFileNameForSourceAtPath(source, path);
};

export const isFalsyQueryParam = (param: unknown): param is false => {
  if (typeof param === 'string') {
    return param === 'false' || param === '0';
  } else if (typeof param === 'number') {
    return param === 0;
  } else {
    return param === false;
  }
};

export const isTruthyQueryParam = (param: unknown): param is true => {
  if (typeof param === 'string') {
    return param === 'true' || param === '1';
  } else if (typeof param === 'number') {
    return param === 1;
  } else {
    return param === true;
  }
};

export const roundToLowerOrderDecimal = (n: number) => {
  const order = Math.pow(10, Math.round(Math.log10(n)));
  const roundedNumber = Math.round(n / order) * order;
  return roundedNumber;
};

// Fast approximate token count. We use a slightly smaller value
// to ensure we stay within boundaries.
export const approximatedTokenCount = (text: string) => {
  return Math.round(text.length / APPROX_CHARS_PER_TOKEN);
};

const includesWithComparison = <T>(
  array: T[],
  element: T,
  comparisonFunction?: (item1: T, item2: T) => boolean,
) => {
  if (!comparisonFunction) {
    return array.includes(element);
  }

  for (let i = 0; i < array.length; i++) {
    if (comparisonFunction(array[i], element)) {
      return true;
    }
  }
  return false;
};

export const arrayEquals = <T>(
  arr1: T[],
  arr2: T[],
  comparisonFunction?: (item1: T, item2: T) => boolean,
) => {
  if (arr1.length !== arr2.length) {
    return false;
  }

  return arr1.every((item) =>
    includesWithComparison(arr2, item, comparisonFunction),
  );
};

export const getCompletionsUrl = (model: OpenAIModelIdWithType) => {
  switch (model.type) {
    case 'chat_completions': {
      return getChatCompletionsUrl();
    }
    default: {
      return 'https://api.openai.com/v1/completions';
    }
  }
};

export const getChatCompletionsUrl = () => {
  return 'https://api.openai.com/v1/chat/completions';
};

export const getCompletionsResponseText = (
  response: any,
  model: OpenAIModelIdWithType,
): string => {
  switch (model.type) {
    case 'chat_completions': {
      return getChatCompletionsResponseText(response);
    }
    default: {
      return response.choices[0].text;
    }
  }
};

export const getModelDisplayName = (model: OpenAIChatCompletionsModelId) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 'GPT-3.5 Turbo';
    case 'gpt-4':
      return 'GPT-4';
    case 'gpt-4-32k':
      return 'GPT-4 32k';
    case 'gpt-4-1106-preview':
      return 'GPT-4 Turbo';
  }
};

export const getChatCompletionsResponseText = (response: any): string => {
  return response.choices[0].message.content;
};

export const byteSize = (s: string) => {
  return new Blob([s]).size;
};

// Returns the "new billing period start date", namely, the same day/month
// but with year updated so that it is the closest before the current date.
export const closestPastDate = (date: Date) => {
  const now = new Date();
  const nowYear = now.getFullYear();
  date.setFullYear(nowYear);

  if (date > now) {
    date.setFullYear(nowYear - 1);
  }

  return date;
};

export const guessShortNameFromTitle = (title: string) => {
  // Split the title by common separators and get the first part.
  // E.g. "Stripe | Payment Processing Platform for the Internet"
  // returns "Stripe".
  return title.split(/\s*[|\-–—:·•]\s*/)[0].trim();
};

export const safeParseInt = (
  value: string | undefined | null,
  fallbackValue: number,
): number => {
  if (typeof value !== 'string') {
    return fallbackValue;
  }

  const intValue = parseInt(value);
  if (!isNaN(intValue)) {
    return intValue;
  }

  return fallbackValue;
};

export const safeParseIntOrUndefined = (
  value: string | undefined | null,
): number | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsedInt = parseInt(value);
  if (isNaN(parsedInt)) {
    return undefined;
  }
  return parsedInt;
};

export const safeParseJSON = <T>(
  value: string | undefined | null,
  fallbackValue: T,
): T => {
  if (typeof value !== 'string') {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch {
    //
  }

  return fallbackValue;
};

export const removeSchema = (origin: string) => {
  return origin.replace(/(^\w+:|^)\/\//, '');
};

export const getDomain = (url: string) => {
  let hostname: string;
  if (url.includes('://')) {
    hostname = new URL(url).hostname;
  } else {
    hostname = url.split('/')[0];
  }
  const domain = hostname.replace(/^www\./, '');
  return domain;
};

export const getAppHost = (subdomain?: string, forceProduction?: boolean) => {
  const isProd = forceProduction || process.env.NODE_ENV === 'production';
  const host = isProd ? process.env.NEXT_PUBLIC_APP_HOSTNAME : 'localhost:3000';
  return subdomain ? `${subdomain}.${host}` : host;
};

export const getAppOrigin = (subdomain?: string, forceProduction?: boolean) => {
  const host = getAppHost(subdomain, forceProduction);
  const isProd = forceProduction || process.env.NODE_ENV === 'production';
  const schema = isProd ? 'https://' : 'http://';
  return `${schema}${host}`;
};

export const getApiUrl = (
  api:
    | 'embeddings'
    | 'completions'
    | 'chat'
    | 'sections'
    | 'search'
    | 'feedback',
  forceProduction: boolean,
) => {
  return getAppOrigin('api', forceProduction) + '/v1/' + api;
};

export const isAppHost = (host: string) => {
  return host === getAppHost();
};

export const isRequestFromMarkprompt = (origin: string | undefined | null) => {
  const requesterHost = origin && removeSchema(origin);
  return requesterHost === getAppHost();
};

// Source: https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6?permalink_comment_id=4594127#gistcomment-4594127.
// We use our own implementation here, rather than lodash.merge, since
// lodash.merge makes use of non-edge-compatible functions.
export const deepMerge = (target: any | null, source: any | null) => {
  const result = { ...(target || {}), ...(source || {}) };
  for (const key of Object.keys(result)) {
    result[key] =
      typeof (target || {})[key] == 'object' &&
      typeof (source || {})[key] == 'object'
        ? deepMerge((target || {})[key], (source || {})[key])
        : structuredClone(result[key]);
  }
  return result;
};

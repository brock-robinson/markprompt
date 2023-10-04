export const I_DONT_KNOW = 'Sorry, I am not sure how to answer that.';
export const MIN_CONTENT_LENGTH = 5;
export const MAX_PROMPT_LENGTH = 200;
export const STREAM_SEPARATOR = '___START_RESPONSE_STREAM___';
export const CONTEXT_TOKENS_CUTOFF = 1500;
export const CONTEXT_TOKENS_CUTOFF_GPT_3_5_TURBO = 2048;
export const APPROX_CHARS_PER_TOKEN = 4;
export const SAMPLE_REPO_URL =
  'https://github.com/motifland/markprompt-sample-docs';
export const MIN_SLUG_LENGTH = 3;
export const DEFAULT_TEMPLATE_CONTEXT_TAG = '{{CONTEXT}}';
export const DEFAULT_TEMPLATE_PROMPT_TAG = '{{PROMPT}}';
export const DEFAULT_TEMPLATE_IDK_TAG = '{{I_DONT_KNOW}}';

export const DEFAULT_MARKPROMPT_CONFIG = `{
  "include": [
    "**/*"
  ],
  "exclude": [],
  "processorOptions": {}
}`;

export const MARKPROMPT_JS_PACKAGE_VERSIONS = {
  css: '0.15.0',
  web: '0.18.2',
  react: '0.26.1',
  'docusaurus-theme-search': '0.13.3',
};

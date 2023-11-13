import analyze from '@next/bundle-analyzer';
import nextMdx from '@next/mdx';
import remarkGfm from 'remark-gfm';

const withBundleAnalyzer = analyze({
  enabled: process.env.ANALYZE === 'true',
});

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
  },
});

const corsHeaders = [
  { key: 'Access-Control-Allow-Credentials', value: 'true' },
  { key: 'Access-Control-Allow-Origin', value: '*' },
  { key: 'Access-Control-Allow-Methods', value: '*' },
  {
    key: 'Access-Control-Allow-Headers',
    value:
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  },
  {
    key: 'Access-Control-Expose-Headers',
    value: 'x-markprompt-data, x-markprompt-debug-info',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.slack-edge.com' },
    ],
  },
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/{{lowerCase kebabCase member}}',
      skipDefaultConversion: true,
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  async headers() {
    return [{ source: '/(.*)', headers: corsHeaders }];
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));

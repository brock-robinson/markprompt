import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import Balancer from 'react-wrap-balancer';

import { YCIcon } from '@/components/icons/brands/YC';
import { MarkpromptColoredIcon } from '@/components/icons/MarkpromptColored';
import LandingNavbar from '@/components/layouts/LandingNavbar';
import Footer from '@/components/pages/Footer';
import { SharedHead } from '@/components/pages/SharedHead';
import { PatternMono } from '@/components/ui/Pattern';
import {
  BlogPostMetadata,
  getBlogIndexStaticProps,
  getIndexPageStaticProps,
} from '@/lib/pages';
import { SystemStatus } from '@/types/types';

type BackerSpec = {
  name: string;
  position: string;
  avatar?: string;
};

const backers: BackerSpec[] = [
  {
    name: 'Guillermo Rauch',
    position: 'Founder and CEO, Vercel',
  },
  {
    name: 'Alana Goyal',
    position: 'Founder, basecase',
  },
  {
    name: 'Nicolas Dessaigne',
    position: 'Partner, Y Combinator, Founder, Algolia',
  },
  {
    name: 'Ian McCrystal',
    position: 'Head of Developer AI, Stripe',
  },
  {
    name: 'Kanjun Qiu',
    position: 'Founder and CEO, Imbue',
  },
  {
    name: 'Nicole Forsgren',
    position: 'Partner, Microsoft Research',
  },
];

const BackerCard: FC<BackerSpec> = ({ name, position }) => {
  return (
    <div className="not-prose flex flex-col">
      <span className="text-sm font-medium text-neutral-300">{name}</span>
      <span className="text-sm text-neutral-500">{position}</span>
    </div>
  );
};

type AboutPageStaticProps = {
  stars: number;
  status: SystemStatus;
  posts: BlogPostMetadata[];
};

export const getStaticProps = async (): Promise<{
  props: AboutPageStaticProps;
  revalidate: number;
}> => {
  const indexStaticProps = await getIndexPageStaticProps();
  const blogStaticProps = await getBlogIndexStaticProps(5);
  return {
    props: {
      ...indexStaticProps.props,
      ...blogStaticProps.props,
    },
    revalidate: 60,
  };
};

const About = ({ stars, status, posts }: AboutPageStaticProps) => {
  return (
    <>
      <SharedHead title="About" />
      <div className="relative mx-auto min-h-screen w-full">
        <PatternMono />
        <div className="fixed top-0 left-0 right-0 z-30 h-24 bg-black/30 backdrop-blur">
          <div className="mx-auto max-w-screen-xl px-6 sm:px-8">
            <LandingNavbar noAnimation />
          </div>
        </div>
        <div className="relative mx-auto min-h-screen w-full max-w-screen-lg px-6 pt-40 pb-48 sm:px-8 sm:pt-60">
          <MarkpromptColoredIcon className="mx-auto w-28 sm:w-40" />
          <h1 className="gradient-heading mb-4 mt-16 text-center text-4xl sm:text-6xl">
            <Balancer>
              Building the AI infrastructure for customer experience
            </Balancer>
          </h1>
          <p className="mx-auto mt-12 max-w-screen-sm text-center text-lg text-neutral-500 sm:text-xl">
            <Balancer>
              Generative AI is changing every aspect of running a business, and
              it is happening{' '}
              <span className="border-b border-neutral-700">now</span>.
              Markprompt is born out of this revolution.
            </Balancer>
          </p>
        </div>
        <div className="not-prose relative mx-auto w-full max-w-screen-xl px-6 pt-12 sm:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-8 rounded-md border border-neutral-900 bg-neutral-1000 px-6 py-8 sm:p-12 lg:grid-cols-2">
            <div className="text-base leading-loose">
              <h2 className="text-xl font-bold text-neutral-300">Our vision</h2>
              <p className="mt-4 text-neutral-500">
                It is no coincidence that the term{' '}
                <span className="font-medium text-neutral-300">
                  Artificial Intelligence
                </span>{' '}
                was coined just a few years after the invention of modern
                computers. We projected magical capabilities onto them right
                away, yet for the next 70 years, they were to remain, at a
                fundamental level, tedious to work with. We had to adapt to
                them, not the other way around.
              </p>
              <p className="mt-4 text-neutral-500">
                This is changing, and it is happening now. Generative AI will
                completely transform the way we interact with computers,
                unlocking the magic potential we have been dreaming of for
                decades. At Markprompt, we are building the infrastructure that
                enables this tectonic shift to unfold within businesses,
                starting at the nerve center:{' '}
                <span className="font-medium text-neutral-300">
                  customer support
                </span>
                .
              </p>
            </div>
            <div>
              <Image
                src="/static/images/founders.png"
                width={1200}
                height={828}
                className="w-full rounded-md"
                alt="Marie and Michael"
              />
              <p className="mt-4 text-center text-xs text-neutral-500">
                <Balancer>
                  Marie Schneegans and Michael Fester, founders of Markprompt.
                </Balancer>
              </p>
            </div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-screen-md px-6 pt-12 sm:px-8">
          <h2 className="mt-32 text-2xl font-bold text-neutral-300">
            Backed by the best
          </h2>
          <div className="mx-auto mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {backers.map((backer, i) => {
              return <BackerCard key={`${backer.name}-${i}`} {...backer} />;
            })}
          </div>
          <p className="mt-8 text-sm text-neutral-500">
            and dozens other incredible founders and operators at companies like
            GitHub, Apple, Snowflake, Midjourney, Scale and Superhuman.
          </p>

          {/* <div className="mt-12 flex flex-row items-center gap-2">
            <YCIcon className="h-8 w-8" />
            <span className="bg-gradient-to-br from-white to-neutral-100/50 bg-clip-text text-base font-medium leading-[1.6] text-transparent">
              Combinator
            </span>
          </div> */}

          <h2 className="mt-32 text-2xl font-bold text-neutral-300">
            Read more
          </h2>
          <div className="justify-content-center mx-auto mt-12 grid grid-cols-1 divide-y divide-neutral-900 text-sm">
            {posts.map((entry, i) => {
              return (
                <Link
                  key={`${entry.path}-${i}`}
                  href={`/blog/${entry.path}`}
                  className="flex flex-row items-center gap-2 py-4 text-neutral-300 transition hover:text-neutral-100"
                >
                  <span className="flex-grow">{entry.frontmatter.title}</span>
                  <ChevronRight className="h-4 w-4 flex-none text-neutral-600" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <Footer stars={stars} status={status} />
    </>
  );
};

export default About;

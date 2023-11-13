import {
  ChevronRight,
  Code,
  File,
  Lightbulb,
  Pen,
  Sticker,
} from 'lucide-react';
import { GetStaticProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FC, JSXElementConstructor, ReactNode } from 'react';
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

type FeatureCardProps = {
  Icon: JSXElementConstructor<any>;
  heading: string;
  title: string;
  description: string;
  children: ReactNode;
};

const FeatureCard: FC<FeatureCardProps> = ({
  heading,
  title,
  description,
  children,
}) => {
  return (
    <div className="relative rounded-lg border border-neutral-900 p-2">
      <div className="rounded-md bg-neutral-1000">{children}</div>
      <div className="not-prose relative z-10 flex flex-col p-6 sm:p-8">
        <span className="mt-2 text-sm font-semibold text-sky-500">
          {heading}
        </span>
        <h2 className="text-lg font-semibold text-neutral-300">{title}</h2>
        <p className="mt-2 text-neutral-500">{description}</p>
        {/* <span className="text-sm font-medium text-neutral-300">{name}</span>
      <span className="text-sm text-neutral-500">{position}</span> */}
      </div>
    </div>
  );
};

const About = () => {
  return (
    <>
      <SharedHead title="About" />
      <div className="relative mx-auto min-h-screen w-full">
        <div className="not-prose relative mx-auto grid w-full max-w-screen-xl grid-cols-1 gap-8 px-6 pt-12 sm:grid-cols-2 sm:px-8">
          <div className="flex flex-col gap-8 pt-32">
            <FeatureCard
              Icon={Sticker}
              heading="Ticket deflection"
              title="Answer questions and take action automatically"
              description=""
            >
              <div />
            </FeatureCard>
            <FeatureCard
              Icon={Lightbulb}
              heading="Insights"
              title="Learn from customer interactions"
              description=""
            >
              <div />
            </FeatureCard>
          </div>
          <div className="flex flex-col gap-8">
            <FeatureCard
              Icon={Pen}
              heading="Draft composer"
              title="Generate well-crafted, on-brand replies"
              description=""
            >
              <div className="relative max-w-[400px]">
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-1100 to-neutral-1100/0" />
                <Image
                  src="/static/images/landing/salesforce-draft-composer.png"
                  width={700}
                  height={406}
                  alt="Draft composer for Salesforce"
                />
              </div>
            </FeatureCard>
            <FeatureCard
              Icon={Code}
              heading="APIs and components"
              title="Built for developers, too"
              description=""
            >
              <div />
            </FeatureCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;

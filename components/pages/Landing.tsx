import Spline from '@splinetool/react-spline';
import {
  BookmarkCheck,
  Check,
  Lightbulb,
  MessagesSquare,
  PenSquare,
  Sparkles,
  Timer,
} from 'lucide-react';
import { FC, JSXElementConstructor, ReactNode } from 'react';
import Balancer from 'react-wrap-balancer';

import { AngelListIcon } from '@/components/icons/AngelList';
import { AlgoliaIcon } from '@/components/icons/brands/Algolia';
import { NotionIcon } from '@/components/icons/brands/Notion';
import { SalesforceIcon } from '@/components/icons/brands/Salesforce';
import { SlackIcon } from '@/components/icons/brands/Slack';
import { ZendeskIcon } from '@/components/icons/brands/Zendesk';
import { CalIcon } from '@/components/icons/Cal';
import { DiscordIcon } from '@/components/icons/Discord';
import { GitHubIcon } from '@/components/icons/GitHub';
import LandingNavbar from '@/components/layouts/LandingNavbar';
import Button from '@/components/ui/Button';
import { Pattern } from '@/components/ui/Pattern';
import { SystemStatus } from '@/types/types';

import Footer from './Footer';
import { SharedHead } from './SharedHead';
import { HubSpotIcon } from '../icons/brands/HubSpotIcon';
import { YCIcon } from '../icons/brands/YC';
import { PlotlyIcon } from '../icons/Plotly';
import { SemgrepIcon } from '../icons/Semgrep';
import { SkeduloIcon } from '../icons/Skedulo';
import { Blurs } from '../ui/Blurs';
import { SystemStatusButton } from '../ui/SystemStatusButton';

const S = ({ children }: { children: ReactNode }) => {
  return <span className="text-neutral-300">{children}</span>;
};

const GoalList = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mt-12 rounded-lg border border-dashed border-neutral-900 bg-neutral-1000 px-4 py-6 sm:py-8">
      <div className="relative mx-auto grid max-w-screen-lg grid-cols-1 gap-4 sm:grid-cols-3">
        {children}
      </div>
    </div>
  );
};

const Goal = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-row items-center gap-4 text-base font-medium sm:justify-center">
      <Check className="h-5 w-5 text-green-400 sm:h-6 sm:w-6" />
      {children}
    </div>
  );
};

const FeatureCard = ({
  Icon,
  title,
  description,
}: {
  Icon: JSXElementConstructor<any>;
  title: string;
  description: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-500/10 bg-sky-500/10 p-2">
        <Icon className="w-full text-sky-500" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
      <div className="flex flex-col gap-4 text-neutral-500">{description}</div>
    </div>
  );
};

type LandingPageProps = {
  stars: number;
  status: SystemStatus;
};

const LandingPage: FC<LandingPageProps> = ({ stars, status }) => {
  return (
    <>
      <SharedHead
        title="Markprompt | AI for customer support"
        exludePostfixFromTitle
      />
      {/* <div className="z-40 bg-fuchsia-700 py-1.5 px-6 sm:px-8">
        <Link
          href="/blog/markprompt-qa"
          className="mx-auto block max-w-screen-xl text-center text-xs font-medium transition hover:opacity-80"
        >
          Read our Q&A with Tom Johnson on the future of docs and how Markprompt
          fits in →
        </Link>
      </div> */}
      <div className="relative z-0 mx-auto max-w-screen-xl px-6 sm:min-h-screen sm:px-8">
        <Pattern />
        <LandingNavbar />
        <div className="animate-slide-up">
          <div className="grid grid-cols-1 gap-8 sm:min-h-[calc(100vh-200px)] sm:grid-cols-5">
            <div className="col-span-3 mt-4 flex flex-col justify-center sm:mt-4 2xl:mt-0">
              {/* <Link href="/blog/feedback-flows">
                <Tag size="base" color="sky">
                  Introducing ticket hand-off →
                </Tag>
              </Link> */}
              <h1 className="gradient-heading z-10 mt-6 text-left text-[2.5rem] leading-[2.5rem] tracking-[-0.6px] sm:text-6xl sm:leading-[64px] md:text-7xl">
                <Balancer>
                  AI for
                  <br />
                  customer support
                </Balancer>
              </h1>
              <p className="z-20 mt-8 mr-[40px] max-w-screen-md text-left text-base text-neutral-500 sm:mt-4 sm:text-2xl">
                <Balancer ratio={0.5}>
                  Automate customer support, scale without increasing headcount,
                  and deliver exceptional user experiences.
                </Balancer>
              </p>
              <div className="flex flex-col items-start justify-start gap-4 pt-8 sm:flex-row sm:items-center">
                <Button
                  variant="cta"
                  buttonSize="lg"
                  target="_blank"
                  rel="noreferrer"
                  href="https://meetings.hubspot.com/markprompt/demo"
                >
                  Book a demo
                </Button>
              </div>
              <p className="pt-16 text-left text-sm text-neutral-700 sm:text-base">
                Live with
              </p>
              <div className="flex flex-row flex-wrap items-center justify-start gap-y-2 gap-x-8 overflow-x-auto overflow-y-hidden sm:items-center">
                <div className="flex h-10 items-center justify-center sm:h-12">
                  <AngelListIcon className="mt-1 w-[84px] text-neutral-500 sm:w-[92px]" />
                </div>
                <div className="flex h-10 items-center justify-center sm:h-12">
                  <PlotlyIcon className="w-[96px] text-neutral-500 sm:w-[110px]" />
                </div>
                <div className="flex h-10 items-center justify-center sm:h-12">
                  <CalIcon className="w-[80px] text-neutral-500 sm:w-[90px]" />
                </div>
                <div className="flex h-10 items-center justify-center sm:h-12">
                  <SemgrepIcon className="mt-1 w-[115px] text-neutral-500 sm:w-[130px]" />
                </div>
                <div className="flex h-10 items-center justify-center sm:h-12">
                  <SkeduloIcon className="w-[96px] text-neutral-500 sm:w-[110px]" />
                </div>
              </div>
              {/* <p className="pt-6 text-left text-sm text-neutral-700 sm:text-base">
                Backed by
              </p>
              <div className="mt-3 flex flex-row items-center gap-2">
                <YCIcon className="h-7 w-7" />
                <span className="bg-gradient-to-br from-white to-neutral-100/50 bg-clip-text text-base font-medium leading-[1.6] text-transparent">
                  Combinator
                </span>
              </div> */}
            </div>
            <div className="z-0 col-span-2 hidden h-full sm:block">
              <div className="animate-scale-bounce ml-[-100px] mt-[5%] block h-[90%] w-[calc(100%+200px)] transform-gpu">
                <Spline scene="https://prod.spline.design/JjuAUS8iM07Bemju/scene.splinecode" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mx-auto max-w-screen-lg px-6 pt-32 sm:px-8 sm:pt-0">
        <h2 className="gradient-heading mt-12 mb-12 text-3xl sm:mb-24 sm:text-center sm:text-4xl">
          <Balancer>
            Scale your mighty customer support team, without additional
            headcount
          </Balancer>
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <FeatureCard
            Icon={BookmarkCheck}
            title="Ticket deflection"
            description={
              <>
                <p>
                  Answer your customers&apos; questions before they reach a
                  human agent.
                </p>
                <p>
                  Generate expert answers based on all your knowledge sources,
                  including <S>Salesforce Knowledge</S>, <S>Notion</S>,{' '}
                  <S>Zendesk</S>, <S>GitHub Discussions</S>, and more.
                </p>
              </>
            }
          />
          <FeatureCard
            Icon={PenSquare}
            title="AI draft responses"
            description={
              <>
                <p>
                  Quickly generate responses to support tickets, with instant
                  access to your team&apos;s expertise.
                </p>
                <p>
                  It is trained on past resolved cases, and integrates with your
                  existing tools, like <S>Zendesk</S> and <S>Salesforce Case</S>
                  .
                </p>
              </>
            }
          />
          <FeatureCard
            Icon={Lightbulb}
            title="Customer insights"
            description={
              <>
                <p>
                  Cluster questions thematically, generate summaries, filter by
                  audience, and more to get the big picture.
                </p>
                <p>
                  Take informed decisions on where your product or resources
                  lack, and quickly address them.
                </p>
              </>
            }
          />
        </div>
        <GoalList>
          <Goal>Deflect more tickets</Goal>
          <Goal>Resolve cases faster</Goal>
          <Goal>Understand your customer</Goal>
        </GoalList>
      </div>

      <div className="relative z-0 mx-auto mt-40 max-w-screen-lg px-6 sm:px-8">
        <h2 className="gradient-heading mt-12 mb-12 text-3xl sm:mb-24 sm:text-center sm:text-4xl">
          <Balancer>Deliver exceptional customer experiences</Balancer>
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <FeatureCard
            Icon={MessagesSquare}
            title="Bespoke AI chat"
            description={
              <>
                <p>
                  Markprompt employs the state-of-the-art language model used in
                  the latest version of ChatGPT (GPT-4), tuned to your
                  company&apos;s content and brand.
                </p>
              </>
            }
          />
          <FeatureCard
            Icon={Timer}
            title="Instant responses"
            description={
              <>
                <p>
                  Never leave your customers waiting. Assist them in the moment,
                  when they most need it.
                </p>
              </>
            }
          />
          <FeatureCard
            Icon={Sparkles}
            title="Domain experts"
            description={
              <>
                <p>
                  Every customer support agent becomes a domain expert,
                  instantly.
                </p>
              </>
            }
          />
        </div>
        <GoalList>
          <Goal>Onboard faster</Goal>
          <Goal>Educate better</Goal>
          <Goal>Increase NPS and CSAT</Goal>
        </GoalList>
      </div>
      {/* <VideoSection /> */}
      <div className="relative z-0 mx-auto mt-32 max-w-screen-xl px-6 sm:px-8 sm:pt-0">
        {/* <div className="rounded-lg border border-dashed border-neutral-900 bg-neutral-1000/60 px-4 py-12 sm:px-8"> */}
        <div className="px-4 py-12 sm:px-8">
          <h2 className="gradient-heading mb-4 text-center text-3xl sm:text-4xl">
            <Balancer>Integrations</Balancer>
          </h2>
          <p className="text-center text-lg text-neutral-500">
            Integrate natively with Salesforce, Zendesk, Notion, Slack, Discord
            and more.
          </p>
          <div className="relative mx-auto mt-12 grid max-w-screen-lg grid-cols-4 place-items-center items-center justify-center gap-4 sm:grid-cols-8">
            <SalesforceIcon className="h-8 w-8 text-neutral-500 sm:h-11 sm:w-11" />
            <ZendeskIcon className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" />
            <GitHubIcon className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" />
            <NotionIcon className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" />
            <HubSpotIcon className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" />
            <SlackIcon className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" />
            <DiscordIcon className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" />
            <AlgoliaIcon className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" />
          </div>
          <div className="flex items-center justify-center pt-20">
            <Button variant="cta" href="/integrations" buttonSize="lg">
              Explore integrations
            </Button>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0">
          <Blurs />
        </div>
        <h2 className="gradient-heading relative mt-36 text-center text-3xl sm:mt-56 sm:text-5xl">
          Customer support reimagined.
          <br />
          Get started now.
        </h2>
        <div className="mt-12">
          <Button
            variant="cta"
            buttonSize="lg"
            target="_blank"
            rel="noreferrer"
            href="https://meetings.hubspot.com/markprompt/demo"
          >
            Book a demo
          </Button>
        </div>
      </div>
      <Footer stars={stars} status={status} />
    </>
  );
};

export default LandingPage;

import { ChevronsUpDown, SearchIcon } from 'lucide-react';
import Image from 'next/image';
import Balancer from 'react-wrap-balancer';

import { InsightsExample } from '@/components/examples/insights';
import { MarkpromptIcon } from '@/components/icons/Markprompt';
import { Slash } from '@/components/ui/Slash';

const InsightsSection = () => {
  return (
    <div className="relative flex flex-col items-center">
      <h2 className="gradient-heading mt-32 text-center text-4xl sm:mt-64">
        <Balancer>Track usage, get feedback, improve content</Balancer>
      </h2>
      <p className="mx-auto mt-4 max-w-screen-sm text-center text-lg text-neutral-500">
        Your users will be asking lots of questions, and will be expecting
        quality answers. Use Markprompt&apos;s privacy-enabled feedback and
        insights features to pinpoint shortcomings in your content, and improve
        it.
      </p>
      <div className="relative mt-20 flex w-full flex-col overflow-hidden rounded-lg border border-neutral-900 bg-neutral-1000 sm:h-[660px]">
        <div className="flex flex-none flex-row items-center justify-start gap-2 border-b border-neutral-900 px-2 py-3 sm:gap-4 sm:px-4">
          <MarkpromptIcon className="ml-1 h-7 w-7 flex-none text-neutral-300 sm:h-8 sm:w-8" />
          <Slash size="md" />
          <p className="text-sm text-neutral-300">Acme</p>
          <ChevronsUpDown className="h-3 w-3 flex-none text-neutral-500 sm:-ml-2" />
          <Slash size="md" />
          <p className="text-sm text-neutral-300">Knowledge Base</p>
          <ChevronsUpDown className="h-3 w-3 flex-none text-neutral-500 sm:-ml-2" />
          <div className="flex-grow" />
          <p className="hidden text-sm text-neutral-300 sm:block">Help</p>
          <p className="ml-2 hidden text-sm text-neutral-300 sm:block">Docs</p>
          <SearchIcon className="ml-2 hidden h-4 w-4 text-neutral-300 sm:block" />
          <Image
            alt="Profile"
            className="ml-2 h-6 w-6 rounded-full"
            width={20}
            height={20}
            src="/static/images/marie.png"
          />
        </div>
        <div className="flex flex-none flex-row items-center justify-start gap-4 border-b border-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-500">
          <p>Data</p>
          <p>Playground</p>
          <p className="text-neutral-100">Insights</p>
          <p>Settings</p>
        </div>
        <div className="z-0 w-full flex-grow">
          <div className="flex flex-col gap-6 p-4 sm:p-8">
            <InsightsExample />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsSection;

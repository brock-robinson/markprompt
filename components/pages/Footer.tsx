import Link from 'next/link';

import { DiscordIcon } from '@/components/icons/Discord';
import { GitHubIcon } from '@/components/icons/GitHub';
import { XIcon } from '@/components/icons/X';
import Button from '@/components/ui/Button';
import { SystemStatus } from '@/types/types';

import { SystemStatusButton } from '../ui/SystemStatusButton';

const formatNumStars = (stars: number) => {
  if (stars > 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars;
};

const Footer = ({ stars, status }: { stars: number; status: SystemStatus }) => {
  return (
    <div className="relative z-0 mx-auto max-w-screen-xl px-6 pt-8 sm:px-8 sm:pt-16">
      <div className="mt-20 grid grid-cols-1 items-center gap-8 border-t border-neutral-900/50 px-6 pt-12 pb-20 sm:mt-36 sm:py-12 sm:px-8 lg:grid-cols-3">
        <div className="flex flex-row items-center justify-center gap-6 text-sm text-neutral-500 lg:justify-start">
          <SystemStatusButton status={status} />
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <a
            href="https://github.com/orgs/motifland/projects/3/views/3"
            rel="noreferrer"
            target="_blank"
          >
            Roadmap
          </a>
        </div>
        <div className="hidden flex-row items-baseline justify-center gap-1 text-center text-sm text-neutral-500 lg:flex"></div>
        <div className="mr-0 flex flex-row items-center justify-center gap-4 text-neutral-700 lg:justify-end">
          <Button
            variant="plain"
            buttonSize="sm"
            href="https://github.com/motifland/markprompt"
            Icon={GitHubIcon}
          >
            Star on GitHub
            <span className="ml-2 text-neutral-600">
              {formatNumStars(stars)}
            </span>
          </Button>
          <a
            className="transition hover:text-neutral-500"
            href="https://x.com/markprompt"
            aria-label="Markprompt on X"
          >
            <XIcon className="h-5 w-5" />
          </a>
          <a
            className="transition hover:text-neutral-500"
            href="https://discord.gg/MBMh4apz6X"
            aria-label="Markprompt on Discord"
          >
            <DiscordIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;

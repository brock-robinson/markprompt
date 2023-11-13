import { useSession } from '@supabase/auth-helpers-react';
import cn from 'classnames';
import Link from 'next/link';

import { DiscordIcon } from '../icons/Discord';
import { GitHubIcon } from '../icons/GitHub';
import { MarkpromptIcon } from '../icons/Markprompt';
import { ContactWindow } from '../user/ChatWindow';

export default function LandingNavbar({
  noAnimation,
}: {
  noAnimation?: boolean;
}) {
  const session = useSession();

  return (
    <div
      className={cn('flex h-24 flex-row items-center gap-6 py-8', {
        'animate-slide-down-delayed': !noAnimation,
      })}
    >
      <Link href="/">
        <div className="flex flex-none flex-row items-center gap-4 text-white">
          <MarkpromptIcon className="mx-auto h-10 w-10 text-white" />
          <div className="hidden text-lg font-semibold transition hover:opacity-80 lg:block">
            Markprompt
          </div>
        </div>
      </Link>{' '}
      <div className="flex-grow" />
      <Link
        className="hidden transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100 sm:block"
        href="/about"
      >
        About
      </Link>
      <Link
        className="hidden transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100 md:block"
        href="/resources/overview"
      >
        Why Markprompt
      </Link>
      {/* <Link
        className="hidden transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100 md:block"
        href="/#pricing"
      >
        Pricing
      </Link> */}
      <Link
        className="block transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100"
        href="/integrations"
      >
        Integrations
      </Link>
      <Link
        className="block transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100"
        href="/blog"
      >
        Blog
      </Link>
      <Link
        className="block transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100"
        href="/docs"
      >
        Docs
      </Link>
      <ContactWindow
        closeOnClickOutside
        Component={
          <button
            className="hidden transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100 sm:block"
            aria-label="Contact sales"
          >
            Contact us
          </button>
        }
      />
      {session ? (
        <Link
          className="hidden flex-row items-center gap-3 whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300 sm:flex"
          href="/"
        >
          Go to app
        </Link>
      ) : (
        <>
          <Link
            className="hidden transform whitespace-nowrap text-sm font-medium text-white opacity-60 hover:opacity-100 sm:block"
            href="/login"
          >
            Sign in
          </Link>
          <a
            className="button-glow hidden flex-row items-center gap-3 whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300 sm:flex"
            target="_blank"
            rel="noreferrer"
            href="https://meetings.hubspot.com/markprompt/demo"
          >
            Book a demo
          </a>
        </>
      )}
      <a
        className="hidden transform text-sm font-medium text-white opacity-60 hover:opacity-100 lg:block"
        href="https://github.com/motifland/markprompt"
        aria-label="Markprompt on GitHub"
      >
        <GitHubIcon className="h-5 w-5" />
      </a>
      <a
        className="hidden transform text-sm font-medium text-white opacity-60 hover:opacity-100 lg:block"
        href="https://discord.gg/MBMh4apz6X"
        aria-label="Markprompt on Discord"
      >
        <DiscordIcon className="h-5 w-5" />
      </a>
    </div>
  );
}

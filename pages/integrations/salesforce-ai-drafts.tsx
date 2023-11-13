import { ChevronLeft, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Balancer from 'react-wrap-balancer';

import LandingNavbar from '@/components/layouts/LandingNavbar';
import { SharedHead } from '@/components/pages/SharedHead';
import Button from '@/components/ui/Button';
import { Pattern } from '@/components/ui/Pattern';

const Page = () => {
  return (
    <>
      <SharedHead
        title="Salesforce Case AI Drafts"
        ogImage="https://markprompt.com/static/cover-integrations.png"
      />
      <div className="relative mx-auto min-h-screen w-full">
        <Pattern />
        <div className="fixed top-0 left-0 right-0 z-30 h-24 bg-black/30 backdrop-blur">
          <div className="mx-auto max-w-screen-xl px-6 sm:px-8">
            <LandingNavbar noAnimation />
          </div>
        </div>
        <div className="relative mx-auto min-h-screen w-full max-w-screen-xl px-6 pb-48 sm:px-8">
          <div className="flex flex-row items-center gap-2 pt-32 text-left text-sm text-neutral-500 transition hover:text-neutral-400">
            <ChevronLeft className="h-4 w-4" />
            <Link href="/integrations">Back to integrations</Link>
          </div>
          <h1 className="gradient-heading mb-4 pt-16 text-center text-2xl sm:text-4xl">
            AI Draft Assistant for Salesforce Case
          </h1>
          <p className="mx-auto mt-4 max-w-screen-sm text-center text-neutral-500 sm:text-lg">
            <Balancer>
              Automatically draft replies in Salesforce Case, based on the
              current conversation and connected data sources.
            </Balancer>
          </p>
          <div className="not-prose mt-12 mb-12 flex justify-center">
            <Button
              variant="cta"
              buttonSize="lg"
              aria-label="Install app"
              Icon={Download}
              href="https://login.salesforce.com/packaging/installPackage.apexp?p0=04tHn000000uNmAIAU"
              target="_blank"
              rel="noreferrer"
            >
              Install app
            </Button>
          </div>
          <Image
            className="mx-auto w-full max-w-screen-lg rounded-lg"
            src="/static/images/guides/salesforce-draft-composer/screenshot.png"
            alt="Salesforce Draft Composer"
            width={1512}
            height={770}
          />
          <div className="prose prose-invert mx-auto mt-16 max-w-screen-sm">
            <h2>Installation</h2>
            <h3>Salesforce</h3>
            <ol>
              <li>
                Click on the{' '}
                <a
                  href="https://login.salesforce.com/packaging/installPackage.apexp?p0=04tHn000000uNmAIAU"
                  target="_blank"
                  rel="noreferrer"
                >
                  package installation link.
                </a>
              </li>
              <li>
                Sign into the organization in which you want to install the
                package.
              </li>
              <li>Select &ldquo;install for all users&rdquo;.</li>
              <li>Click install.</li>
              <li>
                Tick &ldquo;Yes, grant access to these third-party web
                sites&rdquo; and hit Continue.
              </li>
              <li>
                Go to Setup → Object Manager → Case → Lightning Record Pages and
                edit &ldquo;Default Case Page&rdquo;.
              </li>
              <li>
                Click on Activation → Assign as Org Default → Desktop and phone.
              </li>
              <li>Hit Next.</li>
              <li>Hit Save.</li>
              <li>
                Go to Setup → Custom Metadata Types. Find &ldquo;Markprompt
                Setting&rdquo; and click Manage Records.
              </li>
              <li>Find &ldquo;Markprompt Setting&rdquo; and click Edit.</li>
            </ol>
            <h3>Markprompt</h3>
            <ol>
              <li>Navigate to your Markprompt project settings.</li>
              <li>
                Find the &ldquo;Token&rdquo; section and copy the token, or
                generate a new one.
              </li>
            </ol>
            <h3>Salesforce</h3>
            <ol>
              <li>
                Back in Salesforce, paste the token to the &ldquo;Token&rdquo;
                settings field.
              </li>
              <li>Hit Save.</li>
              <li>Open a case, and select the Markprompt tab.</li>
              <li>Hit Generate Draft, then Copy to clipboard.</li>
              <li>Your AI generated draft is ready to be pasted!</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;

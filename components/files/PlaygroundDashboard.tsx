import * as Tabs from '@radix-ui/react-tabs';
import cn from 'classnames';
import { backOff } from 'exponential-backoff';
import { Code, Share as ShareIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/lib/context/config';
import useProject from '@/lib/hooks/use-project';
import { getApiUrl } from '@/lib/utils.nodeps';

import GetCode from '../dialogs/project/GetCode';
import Share from '../dialogs/project/Share';
import Button from '../ui/Button';

const UIConfigurator = dynamic(() => import('../files/UIConfigurator'));

const ModelConfigurator = dynamic(() => import('../files/ModelConfigurator'));

const PlaygroundDashboard = () => {
  const { project } = useProject();
  const { markpromptOptions, theme, isDark } = useConfigContext();
  const [isPlaygroundLoaded, setPlaygroundLoaded] = useState(false);
  const playgroundRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!playgroundRef.current) {
      return;
    }

    const handler = () => {
      setPlaygroundLoaded(true);
    };

    const playground = playgroundRef.current;

    playground.addEventListener('load', handler, false);

    return () => {
      playground.removeEventListener('load', handler);
    };
  }, []);

  useEffect(() => {
    if (!project) {
      return;
    }

    const serializedProps = {
      ...markpromptOptions,
      projectKey: project.private_dev_api_key,
      showBranding: markpromptOptions.showBranding,
      trigger: { floating: true },
      prompt: {
        ...markpromptOptions.prompt,
        apiUrl: getApiUrl('chat', false),
      },
      chat: {
        ...markpromptOptions.chat,
        apiUrl: getApiUrl('chat', false),
      },
      search: {
        ...markpromptOptions.search,
        apiUrl: getApiUrl('search', false),
        getHref: undefined,
      },
      feedback: {
        ...markpromptOptions.feedback,
        apiUrl: getApiUrl('feedback', false),
      },
      references: {
        ...markpromptOptions.references,
        getHref: undefined,
        getLabel: undefined,
        transformReferenceId: undefined,
      },
    };

    const colors = isDark ? theme.colors.dark : theme.colors.light;

    // Setting an onLoad callback on the iframe does not seem reliable.
    backOff(
      async () => {
        if (!playgroundRef.current?.contentWindow) {
          throw new Error('Iframe not loaded');
        }

        playgroundRef.current?.contentWindow?.postMessage(
          {
            serializedProps,
            colors,
            size: theme.size,
            dimensions: theme.dimensions,
            isDark,
          },
          '*',
        );
      },
      {
        startingDelay: 1000,
        numOfAttempts: 5,
      },
    );
  }, [isPlaygroundLoaded, project, theme, isDark, markpromptOptions]);

  return (
    <div className="absolute inset-0 grid flex-grow grid-cols-1 sm:grid-cols-3">
      <div className="relative col-span-1 h-full sm:col-span-2">
        <div className="h-full w-full overflow-hidden">
          <div className={cn('h-full border-r border-neutral-900')}>
            <div className="relative flex h-full flex-col gap-4">
              {/* <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  backgroundColor: isDark
                    ? theme.colors.dark.overlay
                    : theme.colors.light.overlay,
                }}
              /> */}
              <div className="absolute inset-0">
                <iframe
                  tabIndex={-1}
                  ref={playgroundRef}
                  src="/static/html/chatbot-playground.html"
                  className="absolute inset-0 h-full w-full bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative h-full flex-col items-stretch overflow-hidden transition">
        <div className="grid flex-none grid-cols-1 flex-row items-center justify-end gap-2 border-b border-neutral-900 px-6 py-2 sm:grid-cols-2">
          <Share>
            <Button buttonSize="sm" variant="plain" Icon={ShareIcon}>
              Share
            </Button>
          </Share>
          <GetCode>
            <Button buttonSize="sm" variant="plain" Icon={Code}>
              Get code
            </Button>
          </GetCode>
        </div>
        <div className="flex h-full flex-grow flex-col overflow-y-auto pb-12">
          <Tabs.Root
            className="TabsRoot mt-4 flex-grow px-6 pb-12"
            defaultValue="model"
          >
            <Tabs.List
              className="TabsListSegmented"
              aria-label="Configure model"
            >
              <Tabs.Trigger className="TabsTrigger" value="model">
                Model
              </Tabs.Trigger>
              <Tabs.Trigger className="TabsTrigger" value="ui">
                UI
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content className="TabsContent flex-grow pt-4" value="model">
              <ModelConfigurator />
            </Tabs.Content>
            <Tabs.Content className="TabsContent flex-grow pt-4" value="ui">
              <UIConfigurator />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundDashboard;

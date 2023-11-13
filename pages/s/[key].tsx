import cn from 'classnames';
import { Moon } from 'lucide-react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { FC, useEffect, useRef, useState } from 'react';

import { SharedHead } from '@/components/pages/SharedHead';
import { useLocalStorage } from '@/lib/hooks/utils/use-localstorage';
import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { Theme } from '@/lib/themes';
import { getApiUrl } from '@/lib/utils.nodeps';
import { SerializableMarkpromptOptions } from '@/types/types';

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createServiceRoleSupabaseClient();

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const shareKey = params?.key;

  const { data, error } = await supabaseAdmin
    .from('prompt_configs')
    .select('project_id,config,projects(public_api_key)')
    .eq('share_key', shareKey)
    .limit(1)
    .maybeSingle();

  const projectKey = (data?.projects as any)?.public_api_key;

  if (error || !data?.config || !projectKey) {
    throw new Error('Failed to fetch config');
  }

  return {
    props: {
      projectKey,
      // Note that old version may contain a different payload, of the
      // shape
      // promptConfig: {
      //   theme: Theme;
      //   placeholder: string;
      //   modelConfig: SubmitChatOptions;
      //   iDontKnowMessage: string;
      //   referencesHeading: string;
      //   loadingHeading: string;
      //   includeBranding: boolean;
      // };
      // We handle this in the parsing below.
      promptConfig: data.config as any as {
        theme: Theme;
        options?: SerializableMarkpromptOptions;
      },
    },
    revalidate: 10,
  };
};

const SharePage: FC<InferGetStaticPropsType<typeof getStaticProps>> & {
  hideChat: boolean;
} = ({ projectKey, promptConfig }) => {
  const playgroundRef = useRef<HTMLIFrameElement>(null);
  const [isPlaygroundLoaded, setPlaygroundLoaded] = useState(false);
  const [isDark, setDark] = useLocalStorage<boolean>(
    'public:share:isDark',
    true,
  );
  const theme = promptConfig?.theme;

  useEffect(() => {
    if (
      !isPlaygroundLoaded ||
      !playgroundRef.current?.contentWindow ||
      !projectKey ||
      !promptConfig
    ) {
      return;
    }

    let serializedProps: any;
    if (promptConfig.options) {
      const isProd = process.env.NODE_ENV === 'production';
      // New configs just store the MarkpromptConfig object
      serializedProps = {
        projectKey,
        ...promptConfig.options,
        ...(!isProd && {
          prompt: {
            ...promptConfig.options.prompt,
            apiUrl: getApiUrl('chat', false),
          },
          chat: {
            ...promptConfig.options.chat,
            apiUrl: getApiUrl('chat', false),
          },
        }),
      };
    } else {
      // Legacy configs
      const {
        modelConfig,
        placeholder,
        iDontKnowMessage,
        loadingHeading,
        referencesHeading,
        includeBranding,
        ...rest
      } = promptConfig;

      const { promptTemplate, ...restModelConfig } = modelConfig;

      serializedProps = {
        ...rest,
        projectKey,
        showBranding: promptConfig.showBranding || includeBranding,
        prompt: {
          ...restModelConfig,
          apiUrl: getApiUrl('chat', false),
          iDontKnowMessage,
          placeholder: restModelConfig?.prompt?.placeholder || placeholder,
          systemPrompt: restModelConfig?.systemPrompt || promptTemplate,
        },
        chat: {
          ...restModelConfig,
          apiUrl: getApiUrl('chat', false),
          // Legacy
          iDontKnowMessage,
          placeholder: restModelConfig?.chat?.placeholder || placeholder,
          systemPrompt: restModelConfig?.systemPrompt || promptTemplate,
        },
        trigger: { floating: true },
        search: {
          apiUrl: getApiUrl('search', false),
          getHref: undefined,
        },
        references: {
          getHref: undefined,
          getLabel: undefined,
          transformReferenceId: undefined,
          heading: referencesHeading,
          loadingText: loadingHeading,
        },
      };
    }

    const colors = isDark ? theme.colors.dark : theme.colors.light;

    playgroundRef.current.contentWindow.postMessage(
      {
        serializedProps,
        colors,
        size: theme.size,
        dimensions: theme.dimensions,
        isDark,
      },
      '*',
    );
  }, [isPlaygroundLoaded, projectKey, theme, isDark, promptConfig]);

  if (!promptConfig) {
    return <></>;
  }

  return (
    <>
      <SharedHead title="Playground" />
      <div
        className={cn('grid-background relative h-screen w-screen', {
          'grid-background-dark bg-neutral-900': !!isDark,
          'grid-background-light bg-neutral-100': !isDark,
        })}
      >
        <div className="absolute top-4 right-4 z-20">
          <div
            className={cn('cursor-pointer rounded p-2 transition', {
              'text-neutral-300 hover:bg-white/5': !!isDark,
              'text-neutral-900 hover:bg-black/5': !isDark,
            })}
            onClick={() => {
              setDark(!isDark);
            }}
          >
            <Moon className="h-5 w-5" />
          </div>
        </div>
        <div className="relative flex h-full w-full items-center justify-center">
          <iframe
            ref={playgroundRef}
            src="/static/html/chatbot-playground.html"
            className="absolute inset-0 h-full w-full bg-transparent"
            onLoad={() => {
              setTimeout(() => {
                setPlaygroundLoaded(true);
              }, 100);
            }}
          />
        </div>
      </div>
    </>
  );
};

SharePage.hideChat = true;

export default SharePage;

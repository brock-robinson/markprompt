import '@/styles/globals.css';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Analytics } from '@vercel/analytics/react';
import { NextComponentType, NextPageContext } from 'next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ReactNode, useState } from 'react';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';

import { ManagedAppContext } from '@/lib/context/app';
import { ManagedConfigContext } from '@/lib/context/config';
import { ManagedTrainingContext } from '@/lib/context/training';

const inter = Inter({ subsets: ['latin'] });

interface CustomAppProps<P = any> extends AppProps<P> {
  Component: NextComponentType<NextPageContext, any, P> & {
    getLayout?: (page: ReactNode) => JSX.Element;
    title?: string;
  };
}

export default function App({ Component, pageProps }: CustomAppProps) {
  const [supabase] = useState(() => createBrowserSupabaseClient());

  return (
    <main className={inter.className}>
      <SWRConfig
        value={{
          dedupingInterval: 10000,
        }}
      >
        <ThemeProvider defaultTheme="dark" attribute="class">
          <SessionContextProvider
            supabaseClient={supabase}
            initialSession={(pageProps as any).initialSession}
          >
            <ManagedAppContext>
              <ManagedTrainingContext>
                <ManagedConfigContext>
                  <Component {...pageProps}></Component>
                  <Toaster />
                </ManagedConfigContext>
              </ManagedTrainingContext>
            </ManagedAppContext>
          </SessionContextProvider>
        </ThemeProvider>
        <Analytics />
      </SWRConfig>
    </main>
  );
}

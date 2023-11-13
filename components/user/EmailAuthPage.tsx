import { useSession } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FC } from 'react';

import { MarkpromptIcon } from '@/components/icons/Markprompt';
import Button from '@/components/ui/Button';
import useUser from '@/lib/hooks/use-user';
import { getPublicAnonSupabase } from '@/lib/supabase';
import { getAppOrigin } from '@/lib/utils.nodeps';

import { ContactWindow } from './ChatWindow';

const supabase = getPublicAnonSupabase();

const EmailAuthPage: FC = () => {
  const session = useSession();
  const { signOut } = useUser();

  return (
    <div className="px-6 sm:px-8">
      <div className="mx-auto w-min">
        <Link href="/" className="outline-none">
          <MarkpromptIcon className="mx-auto mt-16 h-16 w-16 text-white outline-none" />
        </Link>
      </div>
      {!session ? (
        <>
          <div className="mx-auto mt-16 max-w-sm">
            <Auth
              view="magic_link"
              redirectTo={getAppOrigin() + '/'}
              magicLink
              providers={[]}
              showLinks={false}
              otpType="magiclink"
              supabaseClient={supabase}
              appearance={{ theme: ThemeMinimal }}
              theme="default"
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                  },
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Password',
                  },
                },
              }}
            />
            <Link
              className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-neutral-300"
              href="/login"
            >
              <ArrowLeft className="h-4 w-4" /> Other login options
            </Link>
          </div>

          <p className="mt-12 text-center text-sm text-neutral-500">
            By signing in, you agree to our{' '}
            <Link className="subtle-underline" href="/legal/terms">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link className="subtle-underline" href="/legal/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ) : (
        <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-2 p-8 pt-20 text-neutral-300">
          <p className="mb-4">You are already signed in.</p>
          <Button asLink className="w-full" variant="plain" href="/">
            Go to app
          </Button>
          <Button className="w-full" variant="bordered" onClick={signOut}>
            Sign out
          </Button>
        </div>
      )}
      <ContactWindow closeOnClickOutside />
    </div>
  );
};

export default EmailAuthPage;

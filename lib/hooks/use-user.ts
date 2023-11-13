import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Router from 'next/router';
import { useCallback } from 'react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';

import { DbUser } from '@/types/types';

import { fetcher } from '../utils';

export default function useUser() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const { mutate } = useSWRConfig();
  const {
    data: user,
    mutate: mutateUser,
    error,
  } = useSWR(session?.user ? '/api/user' : null, fetcher<DbUser>);

  const loading = session?.user ? !user && !error : false;
  const loggedOut = error && error.status === 403;

  const signOut = useCallback(async () => {
    if (!supabase?.auth) {
      Router.push('/');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Error signing out: ${error.message}`);
      return;
    }

    await mutate('/api/user');
    setTimeout(() => {
      Router.push('/');
    }, 500);
  }, [supabase.auth, mutate]);

  return { loading, loggedOut, user, mutate: mutateUser, signOut };
}

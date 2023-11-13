import { useSession } from '@supabase/auth-helpers-react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { FC, memo } from 'react';

import AppPage from '@/components/pages/App';
import LandingPage from '@/components/pages/Landing';
import { getIndexPageStaticProps } from '@/lib/pages';

export interface RawDomainStats {
  timestamp: number;
}

export const getStaticProps: GetStaticProps = getIndexPageStaticProps;

const Index: FC<InferGetStaticPropsType<typeof getIndexPageStaticProps>> = ({
  stars,
  status,
}) => {
  const session = useSession();

  if (!session) {
    return <LandingPage stars={stars} status={status} />;
  } else {
    return <AppPage />;
  }
};

export default memo(Index);

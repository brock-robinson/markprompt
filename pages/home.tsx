import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { FC } from 'react';

import LandingPage from '@/components/pages/Landing';
import { getIndexPageStaticProps } from '@/lib/pages';

export const getStaticProps: GetStaticProps = getIndexPageStaticProps;

const Home: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  stars,
  status,
}) => {
  return <LandingPage stars={stars} status={status} />;
};

export default Home;

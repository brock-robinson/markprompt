import dynamic from 'next/dynamic';
import { FC, ReactNode } from 'react';

import { AppNavbar } from '@/components/layouts/AppNavbar';

const PlanPickerDialog = dynamic(() => import('../team/PlanPickerDialog'), {
  loading: () => <></>,
});

type NavLayoutProps = {
  animated?: boolean;
  children?: ReactNode;
};

export const NavLayout: FC<NavLayoutProps> = ({ animated, children }) => {
  return (
    <div className="relative min-h-screen w-full">
      <AppNavbar animated={animated} />
      <div className="pb-12">{children}</div>
      <PlanPickerDialog />
    </div>
  );
};

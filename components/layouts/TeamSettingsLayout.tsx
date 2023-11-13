import { useRouter } from 'next/router';
import { FC, useMemo } from 'react';

import useTeam from '@/lib/hooks/use-team';

import { NavSubtabsLayout, NavSubtabsLayoutProps } from './NavSubtabsLayout';

export const TeamSettingsLayout: FC<NavSubtabsLayoutProps> = (props) => {
  const router = useRouter();
  const { team } = useTeam();

  const subTabItems = useMemo(() => {
    if (!router.query?.team) {
      return undefined;
    }
    const basePath = `/${router.query.team || ''}`;
    return [
      { label: 'Home', href: basePath },
      ...(!team?.is_personal
        ? [{ label: 'Team', href: `/settings${basePath}/team` }]
        : []),
      { label: 'Usage', href: `/settings${basePath}/usage` },
      { label: 'Plans', href: `/settings${basePath}/plans` },
      { label: 'Settings', href: `/settings${basePath}` },
    ];
  }, [router.query?.team, team?.is_personal]);

  return <NavSubtabsLayout {...props} subTabItems={subTabItems} />;
};

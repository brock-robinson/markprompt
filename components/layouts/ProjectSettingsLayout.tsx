import { useRouter } from 'next/router';
import { FC, useMemo } from 'react';

import { NavSubtabsLayout, NavSubtabsLayoutProps } from './NavSubtabsLayout';

export const ProjectSettingsLayout: FC<NavSubtabsLayoutProps> = (props) => {
  const router = useRouter();

  const subTabItems = useMemo(() => {
    if (!router.query?.team || !router.query?.project) {
      return undefined;
    }
    const basePath = `/${router.query.team}/${router.query.project}`;
    return [
      { label: 'Data', href: `${basePath}` },
      { label: 'Playground', href: `${basePath}/playground` },
      { label: 'Insights', href: `${basePath}/insights`, tag: 'Beta' },
      { label: 'Settings', href: `${basePath}/settings` },
    ];
  }, [router.query?.team, router.query?.project]);

  return <NavSubtabsLayout {...props} subTabItems={subTabItems} />;
};

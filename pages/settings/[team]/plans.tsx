import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';

import { TeamSettingsLayout } from '@/components/layouts/TeamSettingsLayout';
import PlanPicker from '@/components/team/PlanPicker';
import Button from '@/components/ui/Button';
import useTeam from '@/lib/hooks/use-team';
import { getTier, getTierName } from '@/lib/stripe/tiers';
import { DbTeam } from '@/types/types';

const StripeManageButton = ({ team }: { team: DbTeam }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="plain"
      buttonSize="sm"
      loading={loading}
      onClick={async () => {
        if (!team) {
          return;
        }
        setLoading(true);
        const res = await fetch(`/api/team/${team.id}/subscription/manage`, {
          method: 'POST',
        });
        if (!res.ok) {
          toast.error('Error fetching customer data');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setLoading(false);
        router.push(data.url);
      }}
    >
      Manage
    </Button>
  );
};

const Team = () => {
  const { team } = useTeam();

  return (
    <TeamSettingsLayout
      title="Plans"
      width="xl"
      SubHeading={
        !team ? (
          <></>
        ) : (
          <p className="mb-6 text-sm text-neutral-500">
            You are currently on the{' '}
            <span className="font-semibold text-neutral-400">
              {getTierName(getTier(team))}
            </span>{' '}
            plan.
          </p>
        )
      }
      RightHeading={
        // Only show if active Stripe customer
        team?.stripe_customer_id && (
          <div className="flex w-full items-center gap-4">
            <div className="flex-grow" />
            <StripeManageButton team={team} />
          </div>
        )
      }
    >
      <PlanPicker />
    </TeamSettingsLayout>
  );
};

export default Team;

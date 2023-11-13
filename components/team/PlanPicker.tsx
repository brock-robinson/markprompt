import cn from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import { ListItem } from '@/components/ui/ListItem';
import { Segment } from '@/components/ui/Segment';
import { cancelSubscription } from '@/lib/api';
import emitter, { EVENT_OPEN_CONTACT } from '@/lib/events';
import useTeam from '@/lib/hooks/use-team';
import { getStripe } from '@/lib/stripe/client';
import {
  DEFAULT_TIERS,
  PLACEHOLDER_ENTERPRISE_TIER,
  Tier,
  getOfferedCustomTiers,
  getTier,
  getTierName,
} from '@/lib/stripe/tiers';

const HOBBY_TIER = DEFAULT_TIERS.find((t) => t.id === 'hobby')!;

const isMonthlySubscription = (tier: Tier, stripePriceId: string | null) => {
  return stripePriceId && tier.price?.monthly?.priceId === stripePriceId;
};

const PricingCard = ({
  tier,
  priceLabel,
  onCtaClick,
}: {
  tier: Tier;
  priceLabel?: string;
  onCtaClick?: () => void;
}) => {
  const router = useRouter();
  const { team, mutate: mutateTeam } = useTeam();
  const [loading, setLoading] = useState(false);
  const [showAnnual, setShowAnnual] = useState<boolean | undefined>(undefined);
  const hasMonthlyYearlyOption = !!tier.price?.monthly && !!tier.price?.yearly;
  const currentTeamTier = team ? getTier(team) : HOBBY_TIER;
  const currentTeamTierIsMonthlySubscription = !!(
    team && isMonthlySubscription(currentTeamTier, team.stripe_price_id)
  );
  const isCurrentTeamTier = currentTeamTier.id === tier.id;
  const amount = tier.price?.[showAnnual ? 'yearly' : 'monthly']?.amount || 0;

  useEffect(() => {
    if (!isCurrentTeamTier) {
      if (tier.price?.yearly) {
        // If this is not the current team's tier, show yearly pricing
        // by default if the tier has a yearly option.
        setShowAnnual(true);
      } else {
        setShowAnnual(false);
      }
      return;
    } else {
      if (currentTeamTierIsMonthlySubscription) {
        setShowAnnual(false);
      } else {
        setShowAnnual(true);
      }
    }
  }, [
    currentTeamTierIsMonthlySubscription,
    isCurrentTeamTier,
    tier.price?.yearly,
  ]);

  useEffect(() => {
    // Refresh the team, e.g. when redirected back from a Stripe
    // checkout session
    mutateTeam();
  }, [mutateTeam]);

  const buttonLabel = (() => {
    if (isCurrentTeamTier) {
      if (currentTeamTierIsMonthlySubscription === !showAnnual) {
        return 'Current plan';
      } else if (showAnnual) {
        return 'Switch to yearly';
      } else {
        return 'Switch to monthly';
      }
    }
    if (tier.id === 'hobby') {
      return 'Downgrade to free';
    }
    if (tier.id === 'placeholder-enterprise') {
      return 'Contact sales';
    }
    return 'Subscribe';
  })();

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-lg border px-6 pb-8 pt-12',
        {
          'border-neutral-900 bg-neutral-1000': isCurrentTeamTier,
          'border-neutral-900': !isCurrentTeamTier,
        },
      )}
    >
      <p
        className={cn(
          '-mt-4 w-min whitespace-nowrap rounded-full bg-sky-600/20 px-2 py-0.5 text-xs font-medium text-sky-500 transition duration-300',
          {
            'opacity-0': !isCurrentTeamTier,
          },
        )}
      >
        Current plan
      </p>
      <div className="flex flex-col items-start gap-4">
        <h2 className="flex-none flex-grow truncate text-xl font-semibold text-neutral-300">
          {getTierName(tier)}
        </h2>
        <div className="h-8">
          {hasMonthlyYearlyOption && typeof showAnnual !== 'undefined' && (
            <div className="flex-none">
              <Segment
                size="sm"
                items={['Monthly', 'Yearly']}
                selected={showAnnual ? 1 : 0}
                id="billing-period"
                onChange={(i) => setShowAnnual(i === 1)}
              />
            </div>
          )}
          {tier.id === 'placeholder-enterprise' && (
            <p className="flex-none rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-medium text-neutral-300">
              Billed yearly
            </p>
          )}
        </div>
      </div>
      <div className="flex h-16 w-full">
        <div className="relative flex w-full flex-col">
          <p className="text-3xl font-semibold text-neutral-300">
            {amount ? (
              <>
                ${amount}
                <span className="text-base font-normal text-neutral-500">
                  /month
                </span>
              </>
            ) : (
              priceLabel
            )}
          </p>
        </div>
      </div>
      <ul className="mb-4 flex w-full flex-grow flex-col gap-1">
        {tier.items?.map((item, i) => {
          return (
            <ListItem
              variant="discreet"
              size="sm"
              key={`pricing-${getTierName(tier)}-item-${i}`}
            >
              {item}
            </ListItem>
          );
        })}
      </ul>
      <div className="w-full">
        <Button
          loading={loading}
          disabled={
            isCurrentTeamTier &&
            currentTeamTierIsMonthlySubscription === !showAnnual
          }
          buttonSize="sm"
          className="w-full"
          variant="plain"
          onClick={async () => {
            if (onCtaClick) {
              onCtaClick();
              return;
            }

            if (!team) {
              return;
            }

            try {
              setLoading(true);
              // Cancel any existing subscription
              await cancelSubscription(team.id);

              if (tier.id === 'hobby') {
                // If it's a downgrade to Hobby, stop here.
                toast.success('Downgraded to Hobby.');
                await mutateTeam();
              } else {
                const priceId =
                  tier.price?.[showAnnual ? 'yearly' : 'monthly']?.priceId;
                if (!priceId) {
                  toast.error('No plan associated to this option.');
                }
                const { sessionId } = await fetch(
                  '/api/subscriptions/create-checkout-session',
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      redirect: router.asPath,
                      teamId: team.id,
                      priceId,
                    }),
                    headers: {
                      'Content-Type': 'application/json',
                      accept: 'application/json',
                    },
                  },
                ).then((res) => res.json());
                const stripe = await getStripe();
                stripe?.redirectToCheckout({ sessionId });
                await mutateTeam();
              }
            } catch (e) {
              toast.error((e as Error)?.message);
              return console.error((e as Error)?.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
};

const PlanPicker = () => {
  const { team } = useTeam();

  const tiers = (team && getOfferedCustomTiers(team)) || [];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PricingCard
          tier={DEFAULT_TIERS.find((t) => t.id === 'hobby')!}
          priceLabel="Free"
        />
        {/* <PricingCard tier={DEFAULT_TIERS.find((t) => t.id === 'starter')!} /> */}
        <PricingCard tier={DEFAULT_TIERS.find((t) => t.id === 'pro')!} />
        {tiers.length === 0 && (
          <PricingCard
            tier={PLACEHOLDER_ENTERPRISE_TIER}
            priceLabel="Custom"
            onCtaClick={() => {
              emitter.emit(EVENT_OPEN_CONTACT);
            }}
          />
        )}
        {tiers?.map((tier, i) => {
          return <PricingCard key={`${tier.name}-${i}`} tier={tier} />;
        })}
      </div>
      <div className="flex justify-center">
        <p className="mt-12 rounded-lg border border-neutral-900 px-6 py-4 text-center text-sm text-neutral-500">
          * 1 token ≈ ¾ words. 1 document ≈ 1200 tokens.{' '}
          <Link className="subtle-underline" href="/docs#what-are-tokens">
            Learn more
          </Link>
          .
        </p>
      </div>
    </>
  );
};

export default PlanPicker;

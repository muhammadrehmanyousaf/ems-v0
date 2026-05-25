/**
 * Tier entitlements (§17.1, D6). Maps premium features → the minimum
 * subscription tier that unlocks them, and exposes a hook + helper so
 * surfaces can show an upgrade nudge.
 *
 * IMPORTANT (live-system safety): entitlements here drive SOFT nudges
 * only — we never hard-lock a feature a vendor already uses. The
 * `useEntitlement` result is for showing/hiding an UpgradeNudge, not
 * for blocking functionality. Hard gating (if ever) must be a
 * deliberate, separately-reviewed change.
 */

import { useUser } from "@/context/UserContext";

export type SubscriptionTier = "free" | "pro" | "premium";

export const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

// Feature → minimum tier that includes it (per §17.1 tier table).
export const FEATURE_MIN_TIER = {
  // Pro "Business"
  analytics: "pro",
  cheque_ledger: "pro",
  contracts_esign: "pro",
  wa_templates: "pro",
  staff: "pro",
  remove_branding: "pro",
  // Premium "Growth"
  fbr_invoicing: "premium",
  multi_business: "premium",
  client_portal: "premium",
  automations: "premium",
  forecasting: "premium",
} as const satisfies Record<string, SubscriptionTier>;

export type EntitlementFeature = keyof typeof FEATURE_MIN_TIER;

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Business",
  premium: "Growth",
};

/** Minimum tier required for a feature + its display label. */
export function requiredTierFor(feature: EntitlementFeature): {
  tier: SubscriptionTier;
  label: string;
} {
  const tier = FEATURE_MIN_TIER[feature];
  return { tier, label: TIER_LABEL[tier] };
}

function tierSatisfies(current: SubscriptionTier, feature: EntitlementFeature): boolean {
  return TIER_RANK[current] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

/**
 * Does the current user's tier include `feature`?
 * Returns true when the billing system is OFF (NEXT_PUBLIC_BILLING != '1')
 * so nudges never appear until monetization is live.
 */
export function useEntitlement(feature: EntitlementFeature): {
  allowed: boolean;
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  requiredLabel: string;
  /** Show an upgrade nudge? (billing on AND tier insufficient) */
  showNudge: boolean;
} {
  const { user } = useUser();
  const billingOn = process.env.NEXT_PUBLIC_BILLING === "1";
  const currentTier = ((user as { subscriptionTier?: SubscriptionTier } | null)?.subscriptionTier
    || "free") as SubscriptionTier;
  const allowed = tierSatisfies(currentTier, feature);
  const { tier: requiredTier, label: requiredLabel } = requiredTierFor(feature);
  return {
    allowed,
    currentTier,
    requiredTier,
    requiredLabel,
    showNudge: billingOn && !allowed,
  };
}

/**
 * Entitlements, for components that ask "does this vendor's plan include X?".
 *
 * There is NO feature map here any more. This file used to keep its own copy of "feature -> minimum tier", which
 * had already drifted from the server's (it knew three tiers, not four, and called them Free / Business / Growth).
 * The rules live once, on the server (src/utils/planEntitlements.js); the portal reads the resolved answer from
 * GET /subscriptions/status via the PlanProvider (context/plan-context.tsx) and this is a thin adapter over it.
 *
 * Soft by default: while enforcement is off, while the answer is still loading, or if it ever fails, everything
 * reads as allowed. The SERVER is what refuses; the screen only reflects.
 */

import { usePlan } from "@/context/plan-context"
import type { FeatureKey } from "@/lib/plan-gate"

export type EntitlementFeature = FeatureKey

export function useEntitlement(feature: EntitlementFeature): {
  /** The vendor may use it right now (true while enforcement is off or unknown). */
  allowed: boolean
  /** The vendor's plan, by its public name. */
  currentPlan: string
  /** The plan that includes it, by its public name. */
  requiredLabel: string
  /** Show an upgrade nudge? (enforcement applies AND the plan lacks the feature) */
  showNudge: boolean
} {
  const plan = usePlan()
  const f = plan.feature(feature)
  const locked = !!f?.locked
  return {
    allowed: !locked,
    currentPlan: plan.planName,
    requiredLabel: f?.requiredPlan ?? "a higher plan",
    showNudge: locked,
  }
}

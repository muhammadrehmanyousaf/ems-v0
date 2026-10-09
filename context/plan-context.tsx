"use client"

/**
 * PlanProvider: the ONE place the portal learns what the vendor's plan includes and how much of it is used.
 *
 * It reads `entitlements` from GET /subscriptions/status (the query BillingGate already runs, so no extra request) and
 * hands every screen the same small API:
 *
 *   const plan = usePlan()
 *   plan.can("automations")        // false only when the server would refuse it
 *   plan.feature("forecasting")    // { locked, requiredPlan, label, ... } or null
 *   plan.limit("spaces")           // { max, used (for the active business), reached, nextPlan, ... } or null
 *   plan.planName                  // "Basic" / "Pro" / "Premium" / "No plan"  (from the server)
 *
 * Rules the screens can lean on:
 *   - While enforcement is off (entitlements.enforced === false), while loading, or if the lookup failed, EVERYTHING is
 *     allowed and NO limit is reached. The server is the one that refuses; the portal never locks on a guess.
 *   - A request that hits a plan gate anywhere (axios layer -> onPlanGate) makes this refetch, so a screen that was
 *     stale flips to its locked state by itself.
 *   - The upgrade dialog for any user-initiated refusal is mounted here (PlanGateHost), once, for the whole portal.
 */

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/context/UserContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { BILLING_STATUS_KEY, useBillingStatus } from "@/hooks/use-billing-status"
import {
  onPlanGate, parseEntitlements, planNameOf,
  type Entitlements, type FeatureEntitlement, type FeatureKey, type LimitEntitlement, type LimitKey,
} from "@/lib/plan-gate"
import { PlanGateHost } from "@/components/dashboard/plans/plan-gate-host"

/** A limit as one screen sees it: for per-business limits, the ACTIVE business's own number. */
export interface LimitView extends LimitEntitlement {
  /** Enforcement applies to this vendor (when false, show a plain count, never "x of y"). */
  enforced: boolean
}

export interface PlanApi {
  /** The first answer has arrived (or the lookup failed: then everything stays open). */
  ready: boolean
  enforced: boolean
  tier: Entitlements["tier"]
  /** Public plan name, from the server. "No plan" when there is none. */
  planName: string
  endsAt: string | null
  /** True unless the server would refuse this feature. */
  can: (feature: FeatureKey) => boolean
  feature: (feature: FeatureKey) => FeatureEntitlement | null
  limit: (key: LimitKey, businessId?: number | null) => LimitView | null
  /** Ask the server again (after creating a business, uploading photos, adding staff...). */
  refresh: () => void
}

const OPEN: PlanApi = {
  ready: false, enforced: false, tier: "free", planName: planNameOf("free"), endsAt: null,
  can: () => true, feature: () => null, limit: () => null, refresh: () => {},
}
const PlanContext = React.createContext<PlanApi>(OPEN)

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const qc = useQueryClient()
  const u = user as { isVendor?: boolean; isSuperAdmin?: boolean; roles?: { name?: string }[] } | null
  const isAdmin = !!u?.isSuperAdmin || !!u?.roles?.some((r) => /admin/i.test(r?.name || ""))
  const isVendor = !!u?.isVendor && !isAdmin
  const q = useBillingStatus(isVendor)
  const activeBusinessId = useActiveBusinessId()

  const ent = React.useMemo(() => parseEntitlements(q.data?.entitlements), [q.data])

  const refresh = React.useCallback(() => { qc.invalidateQueries({ queryKey: BILLING_STATUS_KEY }) }, [qc])

  // A refused request anywhere means our picture of the plan may be stale: ask again (at most once a second).
  React.useEffect(() => {
    if (!isVendor) return
    let t: ReturnType<typeof setTimeout> | null = null
    const off = onPlanGate(() => {
      if (t) return
      t = setTimeout(() => { t = null; refresh() }, 1000)
    })
    return () => { off(); if (t) clearTimeout(t) }
  }, [isVendor, refresh])

  const api = React.useMemo<PlanApi>(() => {
    if (!isVendor || !ent) return { ...OPEN, ready: !isVendor || q.isError || q.isSuccess, refresh }
    return {
      ready: true,
      enforced: ent.enforced,
      tier: ent.tier,
      planName: ent.planName,
      endsAt: ent.endsAt,
      can: (f) => !ent.features[f]?.locked,
      feature: (f) => ent.features[f] ?? null,
      limit: (k, businessId) => {
        const l = ent.limits[k]
        if (!l) return null
        // A per-business limit shows the number for the business in focus (or the one asked for); with "All venues" in
        // focus it shows the fullest business, which is the one that will hit the limit first.
        const bid = businessId ?? activeBusinessId
        const per = l.scope === "business" && bid != null ? l.perBusiness?.[String(bid)] : undefined
        const used = per !== undefined ? per : l.used
        const reached = ent.enforced && l.max !== null && used !== null && used >= l.max
        return { ...l, used, reached, enforced: ent.enforced }
      },
      refresh,
    }
  }, [isVendor, ent, activeBusinessId, refresh, q.isError, q.isSuccess])

  return (
    <PlanContext.Provider value={api}>
      {children}
      {isVendor ? <PlanGateHost /> : null}
    </PlanContext.Provider>
  )
}

export const usePlan = (): PlanApi => React.useContext(PlanContext)

/** `useFeature("forecasting")` -> { locked, requiredPlan, label } (locked false when open/unknown). */
export function useFeature(feature: FeatureKey): { locked: boolean; requiredPlan: string; label: string; planName: string; ready: boolean } {
  const p = usePlan()
  const f = p.feature(feature)
  return { locked: !!f?.locked, requiredPlan: f?.requiredPlan ?? "a higher plan", label: f?.label ?? feature, planName: p.planName, ready: p.ready }
}

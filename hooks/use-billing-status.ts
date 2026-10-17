"use client"

/**
 * THE query for GET /subscriptions/status, shared by everything that needs the vendor's plan:
 * the portal paywall (BillingGate), the plan provider (locks and usage meters), and the business-limit hook.
 * One key, one request; it carries the access state AND the resolved `entitlements`.
 */

import { useQuery } from "@tanstack/react-query"
import { SubscriptionAPI } from "@/lib/api/subscription"
import { accessFromStatus, isWalled } from "@/lib/plans/access"

export const BILLING_STATUS_KEY = ["billing-status"] as const

/** Ask the server for the plan and usage again (after something that changes a count: a business, staff, hall, photo). */
export function refreshPlanUsage(qc: { invalidateQueries: (o: { queryKey: readonly unknown[] }) => unknown }): void {
  qc.invalidateQueries({ queryKey: BILLING_STATUS_KEY })
}

export function useBillingStatus(enabled: boolean) {
  return useQuery({
    queryKey: BILLING_STATUS_KEY,
    queryFn: () => SubscriptionAPI.getBillingStatus(),
    enabled,
    // Poll while a checkout is in flight; while the dashboard is locked, look again every 20 s so a payment (or an admin
    // approval of a manual one) opens it without a refresh; otherwise this is cheap to keep warm.
    refetchInterval: (q) => (q.state.data?.access === "pending" ? 5000 : isWalled(accessFromStatus(q.state.data)) ? 20_000 : false),
    staleTime: 30_000,
  })
}

"use client"

/**
 * The portal paywall.
 *
 * Reads /subscriptions/status. When the server says billing is enforced and
 * this vendor has no active (or grace-period) plan, every dashboard route
 * except Billing renders the plan wall instead of its content — the same
 * cards and the same Safepay checkout the billing page uses, so there is one
 * payment path, not two. Admin accounts and customers never see it.
 *
 * Nothing here decides access on its own: the state comes from the server,
 * which only ever changes it on a verified Safepay webhook.
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import { useBillingStatus } from "@/hooks/use-billing-status"
import { useUser } from "@/context/UserContext"
import { PlanWall } from "./plan-wall"

export function BillingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const { user } = useUser()
  const u = user as { isVendor?: boolean; isSuperAdmin?: boolean; roles?: { name?: string }[] } | null
  const isAdmin = !!u?.isSuperAdmin || !!u?.roles?.some((r) => /admin/i.test(r?.name || ""))
  const isVendor = !!u?.isVendor && !isAdmin

  const { data, isLoading, isError } = useBillingStatus(isVendor)

  if (!isVendor) return <>{children}</>
  // The billing page itself must always be reachable — it is where the wall is lifted.
  if (pathname.startsWith("/dashboard/billing")) return <>{children}</>
  // A failed or in-flight status check never locks anyone out.
  if (isLoading || isError || !data) return <>{children}</>
  if (!data.enforced) return <>{children}</>
  if (data.access === "active" || data.access === "past_due") return <>{children}</>

  return <PlanWall status={data} />
}

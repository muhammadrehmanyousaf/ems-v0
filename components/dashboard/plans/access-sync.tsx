"use client"

/**
 * Feeds the access store from GET /subscriptions/status for the signed-in vendor. (Staff have no /status: they learn they
 * are locked from the 402 the axios layer feeds into the same store.) Renders nothing.
 */

import * as React from "react"
import { useUser } from "@/context/UserContext"
import { useBillingStatus } from "@/hooks/use-billing-status"
import { accessFromStatus, isLockedState } from "@/lib/plans/access"
import { useAccessStore } from "@/lib/plans/access-store"

export function useIsVendorViewer(): boolean {
  const { user } = useUser()
  const u = user as { isVendor?: boolean; isSuperAdmin?: boolean; roles?: { name?: string }[] } | null
  const isAdmin = !!u?.isSuperAdmin || !!u?.roles?.some((r) => /admin/i.test(r?.name || ""))
  return !!u?.isVendor && !isAdmin
}

export function AccessSync() {
  const { user } = useUser()
  const isVendor = useIsVendorViewer()
  const q = useBillingStatus(isVendor)
  const userId = (user as { id?: number | string } | null)?.id ?? null

  // A different person (or nobody) in this browser: forget what was known about the last one.
  const lastUser = React.useRef<unknown>(userId)
  React.useEffect(() => {
    if (lastUser.current !== userId) { useAccessStore.getState().reset(); lastUser.current = userId }
  }, [userId])

  const loggedShadow = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!q.data) return
    const a = accessFromStatus(q.data)
    useAccessStore.getState().applyStatus(a)
    // Shadow mode (BILLING_ENFORCE=shadow): the server computed that this account WOULD be locked; nothing changes for the
    // vendor, we only leave a trace for the rollout review.
    if (a && isLockedState(a.state) && a.enforced === false && loggedShadow.current !== a.state) {
      loggedShadow.current = a.state
      console.info(`[plans] shadow: this account would be locked (${a.state}, ${a.lockReason ?? "no reason"}); not enforced`)
    }
  }, [q.data, q.dataUpdatedAt])

  return null
}

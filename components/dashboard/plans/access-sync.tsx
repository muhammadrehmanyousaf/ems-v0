"use client"

/**
 * Feeds the access store from GET /subscriptions/status for the signed-in vendor. (Staff have no /status: they learn they
 * are locked from the 402 the axios layer feeds into the same store.) Renders nothing.
 */

import * as React from "react"
import { useUser } from "@/context/UserContext"
import { useBillingStatus } from "@/hooks/use-billing-status"
import { accessFromStatus } from "@/lib/plans/access"
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

  React.useEffect(() => {
    if (!q.data) return
    useAccessStore.getState().applyStatus(accessFromStatus(q.data))
  }, [q.data, q.dataUpdatedAt])

  return null
}

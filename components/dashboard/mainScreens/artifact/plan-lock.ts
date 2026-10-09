"use client"

import * as React from "react"
import { usePlan } from "@/context/plan-context"
import { escHtml, planLockedHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import type { FeatureKey } from "@/lib/plan-gate"

/**
 * For an artifact screen that needs a feature as a whole (Cheque ledger, Reports): is the vendor locked out of it, and
 * the HTML to show instead. The answer is the server's (usePlan); while enforcement is off, while it loads, or if it
 * failed, `locked` is false and the screen runs exactly as before.
 *
 *   const lock = useScreenLock("cheque_ledger", "Cheque ledger", "The cheque ledger")
 *   useQuery({ ..., enabled: !lock.locked })              // a locked screen never calls the refused endpoint
 *   if (lock.locked) { wwc.innerHTML = lock.html; return } // ...and says so, with the way forward
 */
export function useScreenLock(feature: FeatureKey, title: string, what: string): { locked: boolean; html: string } {
  const plan = usePlan()
  const f = plan.feature(feature)
  const locked = !!f?.locked
  const html = React.useMemo(
    () => (locked && f
      ? `<div class="head"><div><h1>${escHtml(title)}</h1></div></div>${planLockedHtml({ requiredPlan: f.requiredPlan, planName: plan.planName, what, feature })}`
      : ""),
    [locked, f, plan.planName, title, what, feature],
  )
  return { locked, html }
}

"use client"

/**
 * Cap warning (plan sheet rule 4): at 80% of a monthly/daily cap the vendor is told "8 of 10 bookings used", and at the
 * cap, that the next one needs an upgrade. Reads the server's numbers (usePlan); renders nothing while enforcement is off.
 */

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, Gauge } from "lucide-react"
import { usePlan } from "@/context/plan-context"
import { LIMIT_NOUNS, type LimitKey } from "@/lib/plan-gate"

const WATCHED: LimitKey[] = ["bookings", "leads", "quoteRequests"]

export function LimitBanner() {
  const plan = usePlan()
  const rows = WATCHED.map((k) => ({ k, l: plan.limit(k) }))
    .filter(({ l }) => !!l && l.enforced && l.max !== null && l.used !== null && (l.reached || l.nearing))
  if (!rows.length) return null
  return (
    <div className="space-y-1 px-3 pt-2" data-testid="limit-banner">
      {rows.map(({ k, l }) => {
        const noun = LIMIT_NOUNS[k][1]
        const hit = !!l!.reached
        return (
          <div key={k} role={hit ? "alert" : "status"} data-limit={k}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${hit ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"}`}>
            {hit ? <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden /> : <Gauge className="h-4 w-4 shrink-0" aria-hidden />}
            <span className="min-w-0 flex-1">
              {hit
                ? `${l!.used} of ${l!.max} ${noun} used: your ${plan.planName} plan is full. Upgrade${l!.nextPlan ? ` to ${l!.nextPlan}` : ""} to add more.`
                : `${l!.used} of ${l!.max} ${noun} used on your ${plan.planName} plan.`}
            </span>
            <Link href="/dashboard/billing" className="shrink-0 font-semibold underline underline-offset-2">Upgrade</Link>
          </div>
        )
      })}
    </div>
  )
}

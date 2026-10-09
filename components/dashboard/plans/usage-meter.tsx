"use client"

/**
 * "1 of 1 business", "24 of 25 photos": where a limit matters, the vendor sees how much of it they have used.
 *
 * Rules
 *   - Enforcement ON and the limit applies: the count against the limit, a bar, and when the limit is reached the
 *     plan that raises it with one upgrade action. Above the limit (a downgrade) it says what is true ("6 businesses,
 *     your plan allows 1"), never "6 of 1".
 *   - Enforcement OFF (or no answer yet): the meter is only a plain count with no limit and no upgrade prompt. A limit
 *     the server is not applying is never shown as if it were.
 *   - Per-business limits (halls and spaces, photos) show the ACTIVE business's own number.
 */

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePlan } from "@/context/plan-context"
import { describeUsage, LIMIT_NOUNS, type LimitKey } from "@/lib/plan-gate"
import { BILLING_HREF } from "./plan-locked"

export function UsageMeter({
  limit, businessId, className, hideUpgrade = false,
}: {
  limit: LimitKey
  /** For per-business limits: which business (default: the one in focus). */
  businessId?: number | null
  className?: string
  hideUpgrade?: boolean
}) {
  const plan = usePlan()
  const l = plan.limit(limit, businessId)
  if (!l || l.used === null) return null
  const nouns = LIMIT_NOUNS[limit]
  const scopeNote = l.scope === "business" ? " in this business" : ""

  if (!l.enforced || l.max === null) {
    return (
      <p data-testid={`usage-${limit}`} data-enforced="false" className={cn("text-xs text-muted-foreground", className)}>
        {l.used} {l.used === 1 ? nouns[0] : nouns[1]}{scopeNote}
      </p>
    )
  }
  const pct = l.max === 0 ? 100 : Math.min(100, Math.round((l.used / l.max) * 100))
  const reached = l.reached
  return (
    <div data-testid={`usage-${limit}`} data-enforced="true" data-reached={reached ? "true" : "false"} className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className={cn("font-medium", reached ? "text-foreground" : "text-muted-foreground")}>{describeUsage(l, nouns)}{scopeNote}</span>
        {reached && !hideUpgrade && (
          <Link href={BILLING_HREF} className="shrink-0 font-semibold text-primary hover:underline">
            {l.nextPlan ? `Upgrade to ${l.nextPlan}` : "Ask about a custom plan"}
          </Link>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={l.max} aria-valuenow={Math.min(l.used, l.max)} aria-label={`${l.label} used`}>
        <div className={cn("h-full rounded-full", reached ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

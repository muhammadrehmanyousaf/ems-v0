"use client"

/**
 * The one way the portal says "this is part of a higher plan".
 *
 *   <PlanGuard feature="forecasting">...the real thing...</PlanGuard>   renders it, or the locked card
 *   <PlanLockedCard feature="automations" what="Custom rules" />        the card on its own
 *   <PlanLockChip feature="cheque_ledger" />                            a small "Basic" chip beside a control
 *
 * Every one of them answers to the server's entitlements (context/plan-context.tsx) and to nothing else: while
 * enforcement is off, while the answer is loading, or if it failed, they render NOTHING of their own and the real
 * content shows. A locked feature is shown as locked (lock + the plan that includes it + one upgrade action), never as
 * something that is mysteriously missing, and nothing the vendor already has is hidden or removed.
 */

import * as React from "react"
import Link from "next/link"
import { Lock, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFeature } from "@/context/plan-context"
import type { FeatureKey } from "@/lib/plan-gate"

export const BILLING_HREF = "/dashboard/billing"

/** "Available on Pro" card with the single upgrade action. */
export function PlanLockedCard({
  feature, what, className, compact = false,
}: {
  feature: FeatureKey
  /** What is locked, in the vendor's words (defaults to the server's label for the feature). */
  what?: string
  className?: string
  compact?: boolean
}) {
  const f = useFeature(feature)
  const noPlan = f.planName === "No plan"
  const title = `Available on ${f.requiredPlan}`
  const subject = what || f.label
  return (
    <section
      role="status"
      data-testid="plan-locked"
      data-feature={feature}
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground",
        compact ? "flex items-center gap-3 p-3" : "flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6",
        className,
      )}
    >
      <span className={cn("grid shrink-0 place-items-center rounded-full bg-primary/10 text-primary", compact ? "h-8 w-8" : "h-10 w-10")} aria-hidden="true">
        <Lock className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{title}</h2>
        <p className={cn("mt-1 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {noPlan
            ? `${subject} needs a plan: ${f.requiredPlan} or higher. Choose one to unlock it.`
            : `${subject} is part of the ${f.requiredPlan} plan. You are on ${f.planName}.`}
          {compact ? "" : " Everything you already have stays exactly as it is."}
        </p>
        {!compact && (
          <div className="mt-3">
            <Button asChild size="sm">
              <Link href={BILLING_HREF}>
                <ArrowUpRight className="mr-1.5 h-4 w-4" /> See plans and upgrade
              </Link>
            </Button>
          </div>
        )}
      </div>
      {compact && (
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={BILLING_HREF}>Upgrade</Link>
        </Button>
      )}
    </section>
  )
}

/** Render children when the plan allows `feature`; otherwise the locked card. Open while enforcement is off. */
export function PlanGuard({
  feature, what, children, fallback, compact,
}: {
  feature: FeatureKey
  what?: string
  children: React.ReactNode
  /** Replaces the default locked card. */
  fallback?: React.ReactNode
  compact?: boolean
}) {
  const f = useFeature(feature)
  if (!f.locked) return <>{children}</>
  return <>{fallback ?? <PlanLockedCard feature={feature} what={what} compact={compact} />}</>
}

/** A small lock chip naming the plan that includes the feature. Renders nothing unless the feature is locked. */
export function PlanLockChip({ feature, className }: { feature: FeatureKey; className?: string }) {
  const f = useFeature(feature)
  if (!f.locked) return null
  return (
    <span
      data-testid="plan-lock-chip"
      title={`Available on ${f.requiredPlan}`}
      className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground", className)}
    >
      <Lock className="h-3 w-3" aria-hidden="true" /> {f.requiredPlan}
    </span>
  )
}

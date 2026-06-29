"use client"

/**
 * Billing — redesigned (Track C, bespoke). Plan pricing cards wired to
 * SubscriptionAPI.getMyPlan(); current tier highlighted. Read-only presentation;
 * original screen untouched. Route /dashboard/billing-new. Token-only (themes).
 */

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SubscriptionAPI, type SubscriptionTier } from "@/lib/api/subscription"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { cn } from "@/lib/utils"

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 }

const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "—")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

export function BillingRedesignedView() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["billing-redesigned"],
    queryFn: () => SubscriptionAPI.getMyPlan(),
  })

  const upgrade = useMutation({
    mutationFn: (tier: SubscriptionTier) => SubscriptionAPI.requestUpgrade(tier),
    onSuccess: () => {
      showSuccessToast("Upgrade requested — we'll review it and notify you when it's active")
      qc.invalidateQueries({ queryKey: ["billing-redesigned"] })
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Could not request upgrade")
    },
  })

  const current = data?.currentTier
  const pending = data?.pendingUpgradeTier
  const plans = data?.plans ?? []

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Billing & plan"
        description="Your subscription and what each tier unlocks — redesigned, wired to live data."
      />

      {/* Current plan summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Current plan</div>
          <div className="mt-0.5 flex items-center gap-2 text-lg font-semibold capitalize">
            {isLoading ? "…" : (current ?? "Free")}
            {pending && <StatusPill tone="warning">{cap(pending)} requested</StatusPill>}
          </div>
        </div>
        {data?.subscriptionEndsAt && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Renews / ends</div>
            <div className="mt-0.5 text-sm tabular-nums">{fmtDate(data.subscriptionEndsAt)}</div>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Icon name="ShieldCheck" size={16} />
          We never take a cut of your bookings
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(isLoading ? Array.from({ length: 3 }) : plans).map((p: any, i: number) => {
          const isCurrent = p && p.tier === current
          const isPending = p && p.tier === pending
          const isDowngrade =
            p && current ? TIER_RANK[p.tier as SubscriptionTier] < TIER_RANK[current] : false
          if (!p) return <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-muted" />
          return (
            <div
              key={p.tier}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-colors",
                isCurrent ? "border-primary ring-1 ring-primary/40" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold capitalize">{p.name || p.tier}</h3>
                {isCurrent && <StatusPill tone="success">Current</StatusPill>}
                {isPending && !isCurrent && <StatusPill tone="warning">Requested</StatusPill>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  {p.pricePkrMonthly > 0 ? formatPkr(p.pricePkrMonthly) : "Free"}
                </span>
                {p.pricePkrMonthly > 0 && <span className="text-sm text-muted-foreground">/ mo</span>}
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                {(p.highlights ?? []).map((h: string, j: number) => (
                  <li key={j} className="flex items-start gap-2">
                    <Icon name="CheckCircle2" size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              {(p.caps ?? []).length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  {p.caps.map((c: string, j: number) => (
                    <li key={j} className="flex items-start gap-1.5">
                      <Icon name="Minus" size={12} className="mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 pt-1">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Current plan</Button>
                ) : isDowngrade ? (
                  <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                    Included below your plan
                  </Button>
                ) : isPending ? (
                  <Button variant="outline" className="w-full" disabled>Upgrade requested</Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={upgrade.isPending}
                    onClick={() => upgrade.mutate(p.tier as SubscriptionTier)}
                  >
                    {upgrade.isPending && upgrade.variables === p.tier && (
                      <Spinner size={14} className="mr-2" />
                    )}
                    {p.pricePkrMonthly > 0 ? "Upgrade" : "Switch"}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BillingRedesignedView

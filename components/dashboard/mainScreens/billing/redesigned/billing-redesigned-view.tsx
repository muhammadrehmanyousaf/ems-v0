"use client"

/**
 * Plan & billing. The vendor's current tier, the catalog, and the one write
 * this screen can make: registering an upgrade INTENT.
 *
 * It is not read-only and it never was — the header used to say so (WWL-447)
 * while the page filed Rs 2,500/mo requests. Nothing here charges anything:
 * settlement is offline and the prices are placeholders, which the page now
 * says out loud instead of only in a controller comment (WWL-434).
 *
 * Route /dashboard/billing. Token-only (themes).
 */

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  SubscriptionAPI,
  type MyPlanData,
  type PlanCatalogEntry,
  type SubscriptionTier,
} from "@/lib/api/subscription"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { errorMessage } from "@/lib/utils/api-error"
import { cn } from "@/lib/utils"
import { DangerousAction } from "@/components/dashboard/primitives/dangerous-action"

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 }

/**
 * The caps are derived from the whole entitlement map now, so the free tier
 * honestly has eleven of them. Eleven on a card buries the five highlights
 * above it; the full set lives in the comparison table instead.
 */
const CAPS_ON_CARD = 4

const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "—")

const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

/** "today" / "yesterday" / "6 days ago" — how long a request has been waiting. */
function sinceLabel(s?: string | null): string | null {
  if (!s) return null
  const then = new Date(s).getTime()
  if (isNaN(then)) return null
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 31) return `${days} days ago`
  return null
}

/**
 * WWL-437 — the pending pill rendered `cap(pendingUpgradeTier)`, i.e. the raw
 * enum key: a vendor who requested **Growth** saw a pill reading *"Premium
 * requested"* three inches from a card titled **Growth**. The payload has
 * carried the display name all along; the summary line beside it already used
 * it. Everything on this screen resolves the name the same way now.
 */
function tierName(data: MyPlanData | undefined, tier?: string | null): string {
  if (!tier) return "—"
  return (
    data?.plans?.find((p) => p.tier === tier)?.name ??
    data?.tierNames?.[tier] ??
    cap(tier)
  )
}

export function BillingRedesignedView() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["billing-redesigned"],
    queryFn: () => SubscriptionAPI.getMyPlan(),
  })

  const upgrade = useMutation({
    mutationFn: (v: { tier: SubscriptionTier; replacePending: boolean }) =>
      SubscriptionAPI.requestUpgrade(v.tier, v.replacePending),
    onSuccess: () => {
      showSuccessToast("Upgrade requested — we'll review it and contact you before anything starts")
      qc.invalidateQueries({ queryKey: ["billing-redesigned"] })
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e, "Could not send that request. Nothing was changed."))
    },
  })

  const current = data?.currentTier
  const pending = data?.pendingUpgradeTier
  const plans: PlanCatalogEntry[] = data?.plans ?? []
  const comparison = data?.comparison ?? []
  const pricing = data?.pricing
  const lastDecline = data?.lastDecline
  const topTier = plans.length
    ? plans.reduce((a, b) => (TIER_RANK[b.tier] > TIER_RANK[a.tier] ? b : a)).tier
    : null
  const waiting = sinceLabel(data?.upgradeRequestedAt)

  /**
   * WWL-443 — `getMyPlan` used to swallow every failure and return null, so the
   * view rendered `plans = []`: a billing page with no plans on it, a current
   * plan of "—", no error, no retry and no toast. A fault looked exactly like a
   * product decision. It surfaces as a fault now.
   */
  if (isError) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PageHeader eyebrow="Money" title="Plan & billing" description="Your subscription and what each tier unlocks." />
        <EmptyState
          icon="AlertTriangle"
          title="We couldn't load your plan"
          description={
            <>
              {errorMessage(error, "The plan catalog didn't come back.")} Nothing has changed about
              your subscription — this is only the page failing to read it.
            </>
          }
          action={
            <Button onClick={() => refetch()} disabled={isFetching} className="h-11">
              {isFetching && <Spinner size={14} className="mr-2" />}
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Plan & billing"
        description="Your subscription and what each tier unlocks."
      />

      {/* Current plan summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Current plan</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-lg font-semibold">
            {isLoading ? "…" : tierName(data, current)}
            {pending && (
              <StatusPill tone="warning">{tierName(data, pending)} requested</StatusPill>
            )}
          </div>
        </div>

        {/* WWL-438 — subscriptionStartsAt and upgradeRequestedAt both arrive on
            every load and neither had anywhere to appear, so a vendor could not
            see when their paid plan began or how long a request had been
            waiting, on the page that is meant to be their billing record. */}
        {data?.subscriptionStartsAt && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Started</div>
            <div className="mt-0.5 text-sm tabular-nums">{fmtDate(data.subscriptionStartsAt)}</div>
          </div>
        )}
        {data?.subscriptionEndsAt && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              {data?.subscriptionExpired ? "Ended" : "Renews / ends"}
            </div>
            <div className="mt-0.5 text-sm tabular-nums">{fmtDate(data.subscriptionEndsAt)}</div>
          </div>
        )}
        {pending && data?.upgradeRequestedAt && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Requested</div>
            <div className="mt-0.5 text-sm tabular-nums">
              {fmtDate(data.upgradeRequestedAt)}
              {waiting && <span className="text-muted-foreground"> · {waiting}</span>}
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Icon name="ShieldCheck" size={16} />
          We never take a cut of your bookings
        </div>
      </div>

      {/* WWL-439 — a decline used to clear pendingUpgradeTier and store nothing,
          so a vendor returning after being turned down saw a screen identical to
          one where they had never asked. The only record was a `system`
          notification wearing the same grey pill as 52 other rows. */}
      {!pending && lastDecline && (
        <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="font-medium">
                Your request for {lastDecline.tierName} wasn&apos;t processed
                {lastDecline.declinedAt && (
                  <span className="font-normal text-muted-foreground"> · {fmtDate(lastDecline.declinedAt)}</span>
                )}
              </div>
              {lastDecline.reason ? (
                <p className="mt-1 text-muted-foreground">{lastDecline.reason}</p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  No reason was recorded. You can ask again below, or contact us.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WWL-434 / WWL-448 — the controller says "prices are D7 placeholders"
          and the API module says "no payment integration yet". Neither sentence
          was anywhere a vendor could read it: the live page showed Rs 2,500/mo
          in 3xl semibold with an Upgrade button under it, and *indicative*,
          *placeholder* and *coming soon* appeared nowhere in the DOM. */}
      {pricing?.indicative && (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Indicative pricing.</span> {pricing.disclosure}{" "}
          {pricing.taxNote}
        </p>
      )}

      {/**
        * WWL-436 — "Plan & billing" contains no billing. Checked against the
        * live screen: no invoice list, no receipt or link to Receipts, no
        * payment method, no billing history, no amount due, no NTN or tax
        * details, and no way to actually pay. A vendor who decides right now to
        * pay Rs 2,500 has, from this page, a button that tells someone else to
        * contact them — and there was no support link either, on a screen whose
        * entire settlement model is "our team will reach out".
        *
        * The billing half needs a payment rail, which is a product decision and
        * not a QA fix (D7: no payment integration). What this page can stop
        * doing is presenting itself as a billing page while holding none of it,
        * and it can hand the vendor the two things that do exist: the way to
        * reach us, and the receipts ledger where their own money lives.
        */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm">
        <p className="font-medium">There are no invoices or payment methods here yet.</p>
        <p className="mt-1 text-muted-foreground">
          Subscriptions are settled with our team directly — there is nothing to pay from this page,
          and no card or bank details are stored against your account. When that changes, your
          invoices will appear here.
        </p>
        <p className="mt-2 text-muted-foreground">
          Looking for money you have taken from couples? That is in{" "}
          <a href="/dashboard/receipts" className="underline underline-offset-2">Receipts</a>. Need to
          talk to us about your plan?{" "}
          <a href="/contact" className="underline underline-offset-2">Contact us</a>.
        </p>
      </div>

      {/* Plan cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(isLoading ? Array.from({ length: 3 }) : plans).map((p: any, i: number) => {
            if (!p) return <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-muted" />
            const isCurrent = p.tier === current
            const isPending = p.tier === pending
            const isDowngrade = current ? TIER_RANK[p.tier as SubscriptionTier] < TIER_RANK[current] : false
            const priceSentence =
              p.pricePkrMonthly > 0
                ? `${formatPkr(p.pricePkrMonthly)} per month, indicative, before tax`
                : "Free"
            /* WWL-440 — only the pending tier's card was disabled, so with a
               Business request outstanding the Growth card stayed live and a
               click replaced the first request with no confirmation and no
               record that it existed. The admin queue only ever showed the
               latest. The replacement is now stated before it happens, and the
               server refuses it outright without this explicit flag. */
            const replaces = pending && !isPending ? tierName(data, pending) : null

            return (
              <div
                key={p.tier}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-colors",
                  isCurrent ? "border-primary ring-1 ring-primary/40" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{p.name || p.tier}</h3>
                  {isCurrent && <StatusPill tone="success">Current</StatusPill>}
                  {isPending && !isCurrent && <StatusPill tone="warning">Requested</StatusPill>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="sr-only">{priceSentence}</span>
                  <span aria-hidden="true" className="text-3xl font-semibold tracking-tight tabular-nums">
                    {p.pricePkrMonthly > 0 ? formatPkr(p.pricePkrMonthly) : "Free"}
                  </span>
                  {p.pricePkrMonthly > 0 && (
                    <span aria-hidden="true" className="text-sm text-muted-foreground">/ mo</span>
                  )}
                </div>

                <ul className="mt-4 space-y-2 text-sm">
                  {(p.highlights ?? []).map((h: string, j: number) => (
                    <li key={j} className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                {/* WWL-441 — an unlabelled cap list under a button reading
                    "Included below your plan" read as a contradiction: a Growth
                    vendor was told the free tier was included in theirs while
                    the same card listed three things their tier explicitly has.
                    The caps describe THIS plan's limits; saying so fixes it.
                    WWL-444 — they are derived from the entitlement map now, so
                    the two paid tiers state boundaries instead of nothing. */}
                {(p.caps ?? []).length > 0 ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Not on {p.name}:</p>
                    <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                      {p.caps.slice(0, CAPS_ON_CARD).map((c: string, j: number) => (
                        <li key={j} className="flex items-start gap-1.5">
                          <Icon name="Minus" size={12} className="mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                      {p.caps.length > CAPS_ON_CARD && (
                        <li className="pl-[18px]">
                          and {p.caps.length - CAPS_ON_CARD} more — see the comparison below
                        </li>
                      )}
                    </ul>
                  </div>
                ) : p.tier === topTier ? (
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    Every feature is included on {p.name}.
                  </p>
                ) : null}

                <div className="mt-auto pt-5">
                  {isCurrent ? (
                    <Button variant="outline" className="h-11 w-full" disabled>Current plan</Button>
                  ) : isDowngrade ? (
                    /* WWL-442 — the other branch here rendered "Switch", which
                       could only appear on the free card for a vendor not on
                       free; but that card is always a downgrade for them, so
                       this branch won first and "Switch" was unreachable. */
                    <Button variant="ghost" className="h-11 w-full text-muted-foreground" disabled>
                      Below your plan
                    </Button>
                  ) : isPending ? (
                    <Button variant="outline" className="h-11 w-full" disabled>Requested</Button>
                  ) : (
                    /* WWL-432 — the button said "Upgrade", the toast said
                       "Upgrade requested", and the server said "our team will
                       reach out to set it up". Three descriptions of the same
                       act, and only the two that appear AFTER the click say it
                       is a request. */
                    <DangerousAction
                      title={replaces ? `Ask for ${p.name} instead?` : `Request the ${p.name} plan?`}
                      consequence={
                        <>
                          {replaces && (
                            <p className="mb-2 font-medium text-foreground">
                              This replaces your outstanding request for {replaces}. Only one request
                              can be open at a time, and the old one will not be kept.
                            </p>
                          )}
                          <p>
                            {p.pricePkrMonthly > 0
                              ? `This asks us to switch you to ${p.name} at an indicative Rs ${p.pricePkrMonthly.toLocaleString()}/month before tax.`
                              : `This asks us to switch you to ${p.name}.`}{" "}
                            Nothing is charged now and this is not an agreement to pay — we review it
                            and contact you to confirm before anything starts.
                          </p>
                        </>
                      }
                      confirmLabel={replaces ? "Replace request" : "Send request"}
                      confirmVariant="default"
                      disabled={upgrade.isPending}
                      onConfirm={() =>
                        upgrade.mutate({ tier: p.tier as SubscriptionTier, replacePending: !!pending })
                      }
                    >
                      <Button className="h-11 w-full" disabled={upgrade.isPending}>
                        {upgrade.isPending && upgrade.variables?.tier === p.tier && (
                          <Spinner size={14} className="mr-2" />
                        )}
                        {replaces ? "Request instead" : "Request upgrade"}
                      </Button>
                    </DangerousAction>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* WWL-449 — measured at 360×740 the page was 1,524px tall: comparing the
          cheapest and dearest tier meant scrolling 777px past the whole middle
          card, with no comparison table and no sticky header. One table, one
          screen, and it scrolls sideways rather than making the page do it. */}
      {comparison.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Compare plans</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[520px] text-sm">
              <caption className="sr-only">
                What each plan includes. A tick means the feature is part of that plan.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Feature
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.tier}
                      scope="col"
                      className={cn(
                        "px-4 py-3 text-center font-semibold",
                        p.tier === current && "text-primary",
                      )}
                    >
                      {p.name}
                      <span className="block text-xs font-normal tabular-nums text-muted-foreground">
                        {p.pricePkrMonthly > 0 ? `${formatPkr(p.pricePkrMonthly)} / mo` : "Free"}
                      </span>
                      {p.tier === current && (
                        <span className="block text-[11px] font-normal text-primary">Your plan</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.key} className="border-b border-border last:border-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      {row.label}
                    </th>
                    {plans.map((p) => {
                      const on = Boolean((row as any)[p.tier])
                      return (
                        <td key={p.tier} className="px-4 py-2.5 text-center">
                          <span className="sr-only">{on ? "included" : "not included"}</span>
                          <Icon
                            name={on ? "CheckCircle2" : "Minus"}
                            size={16}
                            className={cn(
                              "inline-block",
                              on ? "text-emerald-500" : "text-muted-foreground/50",
                            )}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default BillingRedesignedView

"use client"

/**
 * Pay for the portal: the plan cards and the one button that starts a
 * Safepay hosted checkout. Used by the paywall (BillingGate) and by the
 * billing page, so there is exactly one payment path.
 *
 * The browser never sees an amount it can change: it sends a tier name, the
 * server answers with the hosted checkout URL for that tier's plan, and the
 * browser goes there. Coming back is not proof of payment — the return
 * banner waits for the server, which waits for Safepay's webhook.
 */

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/dashboard/shared/icon"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { errorMessage } from "@/lib/utils/api-error"
import { cn } from "@/lib/utils"
import { SubscriptionAPI, type BillingStatus, type PlanCatalogEntry } from "@/lib/api/subscription"

/* ───────────────────────── Subscribe button ───────────────────────── */

export function SubscribeButton({
  tier,
  name,
  pricePkrMonthly,
  className,
  variant = "default",
  isCurrent = false,
}: {
  tier: string
  name: string
  pricePkrMonthly: number
  className?: string
  variant?: "default" | "outline"
  /** Already paid and active on this tier — the button becomes a quiet label. */
  isCurrent?: boolean
}) {
  const start = useMutation({
    mutationFn: () => SubscriptionAPI.startCheckout(tier),
    onSuccess: (d) => {
      // Leave the app for Safepay's hosted page. Nothing is charged until
      // the customer approves there, and nothing is activated until Safepay
      // tells our server.
      window.location.assign(d.checkoutUrl)
    },
    onError: (e: unknown) => {
      const code = (e as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data?.code
      if (code === "PAYMENTS_NOT_CONFIGURED") {
        toast.error("Online payment isn't switched on yet. Please contact us and we'll activate your plan.")
        return
      }
      toast.error(errorMessage(e, "Could not start the payment. Nothing was charged."))
    },
  })

  if (isCurrent) {
    return (
      <Button variant="outline" className={cn("h-11 w-full", className)} disabled>
        Your current plan
      </Button>
    )
  }
  return (
    <Button
      variant={variant}
      className={cn("h-11 w-full", className)}
      disabled={start.isPending}
      onClick={() => start.mutate()}
      aria-label={`Subscribe to ${name} for ${formatPkr(pricePkrMonthly)} a month with Safepay`}
    >
      {start.isPending ? <Spinner size={14} className="mr-2" /> : null}
      {start.isPending ? "Opening Safepay…" : `Subscribe · ${formatPkr(pricePkrMonthly)} / month`}
    </Button>
  )
}

/* ───────────────────────── Return from checkout ───────────────────────── */

/**
 * After Safepay sends the vendor back. `?checkout=return` means "they came
 * back", not "they paid": this polls the server until the webhook has
 * activated the plan (or gives up after ~2 minutes and says so honestly).
 */
export function CheckoutReturnBanner() {
  const params = useSearchParams()
  const router = useRouter()
  const qc = useQueryClient()
  const mode = params?.get("checkout") ?? null
  const [elapsed, setElapsed] = React.useState(0)

  const { data } = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => SubscriptionAPI.getBillingStatus(),
    enabled: mode === "return",
    refetchInterval: (q) => {
      const a = q.state.data?.access
      if (a === "active") return false
      return elapsed < 120 ? 3000 : false
    },
  })

  React.useEffect(() => {
    if (mode !== "return") return
    const t = setInterval(() => setElapsed((s) => s + 3), 3000)
    return () => clearInterval(t)
  }, [mode])

  React.useEffect(() => {
    if (data?.access === "active") qc.invalidateQueries({ queryKey: ["billing-redesigned"] })
  }, [data?.access, qc])

  if (!mode) return null

  const clear = () => router.replace("/dashboard/billing")

  if (mode === "cancel") {
    return (
      <div role="status" className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
        <p className="font-medium">Checkout cancelled</p>
        <p className="mt-1 text-muted-foreground">Nothing was charged. Pick a plan whenever you're ready.</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={clear}>Dismiss</Button>
      </div>
    )
  }

  if (data?.access === "active") {
    return (
      <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
        <p className="font-medium">Payment received — your plan is active</p>
        <p className="mt-1 text-muted-foreground">
          Safepay confirmed the payment. Your portal is open{data.subscriptionEndsAt ? ` until ${new Date(data.subscriptionEndsAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}` : ""}, and it renews every month automatically.
        </p>
        <Button size="sm" className="mt-3" onClick={() => router.replace("/dashboard")}>Open the portal</Button>
      </div>
    )
  }

  if (elapsed >= 120) {
    return (
      <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm shadow-sm dark:border-amber-800 dark:bg-amber-950/40">
        <p className="font-medium">We haven't heard from Safepay yet</p>
        <p className="mt-1 text-muted-foreground">
          If you completed the payment, it will show here as soon as Safepay confirms it — usually within a minute, occasionally longer. You don't need to pay again. If it was declined, you can try another card below.
        </p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={clear}>Dismiss</Button>
      </div>
    )
  }

  return (
    <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
      <Spinner size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Confirming your payment with Safepay…</p>
        <p className="mt-1 text-muted-foreground">This takes a few seconds. Please don't pay again — we'll update this the moment Safepay confirms.</p>
      </div>
    </div>
  )
}

/* ───────────────────────── Status card ───────────────────────── */

const ACCESS_TONE: Record<string, StatusTone> = {
  active: "success",
  past_due: "warning",
  pending: "neutral",
  none: "error",
}
const ACCESS_LABEL: Record<string, string> = {
  active: "Active",
  past_due: "Payment failed — retrying",
  pending: "Awaiting payment",
  none: "No active plan",
}

export function BillingStatusCard({ status }: { status: BillingStatus }) {
  const s = status.subscription
  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Subscription</div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <span className="capitalize">{status.tier === "free" ? "No plan" : status.tier}</span>
            <StatusPill tone={ACCESS_TONE[status.access] || "neutral"}>{ACCESS_LABEL[status.access] || status.access}</StatusPill>
            {status.environment === "sandbox" && <StatusPill tone="neutral">Sandbox</StatusPill>}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Paid until</dt>
            <dd className="tabular-nums">{fmt(s?.currentPeriodEndsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Portal open until</dt>
            <dd className="tabular-nums">{fmt(status.subscriptionEndsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Billing</dt>
            <dd>Monthly · Safepay</dd>
          </div>
        </dl>
      </div>
      {status.access === "past_due" && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          This month's payment didn't go through. Safepay will retry; your portal stays open until {fmt(status.subscriptionEndsAt)}. Check your card or account, or subscribe again below.
        </p>
      )}
      {s?.status === "cancelled" && (
        <p className="mt-3 text-sm text-muted-foreground">
          Your subscription was cancelled. You keep access until {fmt(status.subscriptionEndsAt)}; subscribe again any time.
        </p>
      )}
    </div>
  )
}

/* ───────────────────────── The wall ───────────────────────── */

export function PlanWall({ status }: { status: BillingStatus }) {
  const { data, isLoading } = useQuery({ queryKey: ["billing-redesigned"], queryFn: () => SubscriptionAPI.getMyPlan() })
  const plans: PlanCatalogEntry[] = (data?.plans ?? []).filter((p) => p.pricePkrMonthly > 0)
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Your portal</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {status.access === "past_due" ? "Your payment needs attention" : status.subscription ? "Choose a plan to open your portal" : "Choose a plan to get started"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Wedding Wala charges a monthly subscription and nothing else — no commission on your bookings. You pay securely through Safepay, it renews every month automatically, and you can cancel any time.
        </p>
      </div>

      {status.subscription && <div className="mb-6"><BillingStatusCard status={status} /></div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {((isLoading ? Array.from({ length: 3 }, () => undefined) : plans) as (PlanCatalogEntry | undefined)[]).map((p, i) => {
          if (!p) return <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-muted" />
          const popular = i === 1
          return (
            <div key={p.tier} className={cn("flex flex-col rounded-xl border bg-card p-5 shadow-sm", popular ? "border-primary ring-1 ring-primary/40" : "border-border")}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{p.name}</h2>
                {popular && <StatusPill tone="success">Most chosen</StatusPill>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-4 text-2xl font-semibold tabular-nums">
                {formatPkr(p.pricePkrMonthly)} <span className="text-sm font-normal text-muted-foreground">/ month</span>
              </p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2"><span aria-hidden className="text-primary">✓</span><span>{h}</span></li>
                ))}
              </ul>
              <div className="mt-5">
                <SubscribeButton tier={p.tier} name={p.name} pricePkrMonthly={p.pricePkrMonthly} variant={popular ? "default" : "outline"} />
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {data?.pricing?.taxNote || "Prices are in PKR."} Payment is taken by Safepay; we never see or store your card details.{" "}
        <button type="button" className="underline" onClick={() => router.push("/dashboard/billing")}>Billing details</button>
      </p>
    </div>
  )
}

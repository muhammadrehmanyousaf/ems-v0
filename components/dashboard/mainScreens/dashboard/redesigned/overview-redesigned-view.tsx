"use client"

/**
 * Dashboard home (Overview) — redesigned (Track C, flagship landing surface).
 * Wired to AnalyticsAPI.getDashboardKpis() + getRecentBookings(); rendered
 * through the primitives. Read-only; original /dashboard home untouched.
 * Route /dashboard.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsAPI } from "@/lib/api/analytics"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { useUser } from "@/context/UserContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { HealthPanel } from "@/components/dashboard/primitives/health-panel"
import { useBusinessHealth } from "@/hooks/use-business-health"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { FamiliarityPrompt } from "@/components/dashboard/layout/familiarity-prompt"
import { ActionOverviewView } from "@/components/dashboard/mainScreens/dashboard/v2/action-overview-view"
import { TodayBoard } from "@/components/dashboard/mainScreens/venue-os/today-board"
import { EventProfitBoard } from "@/components/dashboard/mainScreens/venue-os/event-profit-board"
import dynamic from "next/dynamic"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"
import { NoBusinessFirstRun } from "@/components/dashboard/mainScreens/dashboard/redesigned/no-business-first-run"
import { ProfileCompletionCard } from "@/components/dashboard/mainScreens/dashboard/redesigned/profile-completion-card"
import { FirstBookingJourney } from "@/components/dashboard/mainScreens/dashboard/redesigned/first-booking-journey"

// Admin overview is vendor-console-free and only ever renders for admin-like
// roles, so keep it out of the vendor bundle. Mirrors dashboard-view.tsx.
const AdminDashboardView = dynamic(
  () => import("@/components/dashboard/mainScreens/dashboard/admin-dashboard-view"),
  { ssr: false },
)

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" })
}

const bookingTone = (s?: string): StatusTone => {
  const v = (s || "").toLowerCase()
  if (v.includes("confirm")) return "success"
  if (v.includes("complete")) return "info"
  if (v.includes("cancel")) return "error"
  return "warning"
}
const payTone = (s?: string): StatusTone => {
  const v = (s || "").toLowerCase()
  if (v.includes("partial")) return "warning"
  if (v.includes("refund")) return "neutral"
  if (v.includes("paid")) return "success"
  return "error"
}

interface RecentRow {
  id: number
  customerName: string
  eventType?: string
  bookingDate: string
  totalAmount: number | string
  status: string
  paymentStatus: string
}

/**
 * Dashboard home. Super admins and admins get the platform overview; everyone
 * else gets the vendor console below.
 *
 * The redesign originally rendered the vendor console for EVERY role, so an
 * admin — who owns no business — saw a "Vendor console" breadcrumb, an "Add
 * booking" CTA, and vendor-scoped widgets reading 0 next to platform-wide
 * totals reading Rs 18.8M. This restores the fork the legacy path has always
 * had (dashboard-view.tsx). Kept as a thin wrapper on purpose: the vendor view
 * below calls many hooks, so forking inside it would change hook count between
 * renders once `isLoading` flips.
 */
export function OverviewRedesignedView() {
  const { user, isLoading } = useUser()
  if (isLoading) return null
  if (isAdminLike(getDashboardRole(user))) return <AdminDashboardView />
  return <VendorOverviewRedesignedView />
}

function VendorOverviewRedesignedView() {
  const { user } = useUser()
  const firstName = (user?.fullName || "there").split(/\s+/)[0]
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
  // Per-venue scope: null = All venues (combined). Included in the query key so
  // switching venue refetches, and forwarded to the API as ?businessId=.
  const activeBusinessId = useActiveBusinessId()

  const kpisQ = useQuery({
    queryKey: ["overview-kpis-redesigned", activeBusinessId],
    queryFn: () => AnalyticsAPI.getDashboardKpis("this_year", undefined, undefined, activeBusinessId),
  })
  const recentQ = useQuery({
    queryKey: ["overview-recent-redesigned", activeBusinessId],
    queryFn: () => AnalyticsAPI.getRecentBookings(8, undefined, undefined, undefined, activeBusinessId),
  })
  // Owner cockpit: which hall earns the most? Always across ALL the owner's
  // venues (independent of the switcher) so a multi-hall owner can compare.
  const breakdownsQ = useQuery({
    queryKey: ["overview-hall-league"],
    queryFn: () => AnalyticsAPI.getRevenueBreakdowns("this_year"),
  })

  // Does this vendor own a business at all? Everything on this screen assumes
  // one exists. Only trust the answer once the request has actually resolved —
  // rendering the first-run banner during load would flash it at every vendor
  // on every hard refresh.
  const businessesQ = useQuery({
    queryKey: ["my-businesses"],
    queryFn: () => BusinessesAPI.getUserBusinesses(),
  })
  const hasNoBusiness = businessesQ.isSuccess && (businessesQ.data ?? []).length === 0

  const k = kpisQ.data
  const recent = (recentQ.data?.bookings ?? []) as RecentRow[]

  // WWL-018 — any of the three money reads failing means the figures on this
  // page are missing rather than zero, and the vendor has to be told so.
  const moneyFailed = kpisQ.isError || recentQ.isError || breakdownsQ.isError
  const retryMoney = () => {
    if (kpisQ.isError) kpisQ.refetch()
    if (recentQ.isError) recentQ.refetch()
    if (breakdownsQ.isError) breakdownsQ.refetch()
  }

  const halls = React.useMemo(
    () => [...(breakdownsQ.data?.byBusiness ?? [])].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)),
    [breakdownsQ.data],
  )
  const maxHallRev = halls.reduce((m, h) => Math.max(m, h.totalRevenue || 0), 0)
  const showHallLeague = halls.length > 1

  const columns: Column<RecentRow>[] = [
    { key: "customer", header: "Customer", render: (b) => <span className="font-medium">{b.customerName || "—"}</span> },
    { key: "event", header: "Event", cellClassName: "text-muted-foreground", render: (b) => cap(b.eventType) },
    { key: "date", header: "Date", cellClassName: "text-muted-foreground", render: (b) => fmtDate(b.bookingDate) },
    { key: "amount", header: "Amount", align: "right", render: (b) => <MoneyCell amount={num(b.totalAmount)} /> },
    { key: "status", header: "Status", render: (b) => <StatusPill tone={bookingTone(b.status)}>{b.status}</StatusPill> },
    { key: "payment", header: "Payment", render: (b) => <StatusPill tone={payTone(b.paymentStatus)} variant="icon">{b.paymentStatus || "—"}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Vendor console · Overview"
        title={`Welcome back, ${firstName}`}
        description={`${today} — at-a-glance signal for your business: bookings, revenue and what needs you.`}
        actions={
          // "Add booking" is impossible without a business, so it must not be
          // offered to someone who has none. No replacement here either — the
          // first-run panel directly below owns that call to action, and two
          // identical primary buttons a hundred pixels apart reads as an
          // oversight rather than emphasis.
          hasNoBusiness ? undefined : (
            <Button asChild><Link href="/dashboard/bookings"><Icon name="Plus" size={16} className="mr-1.5" /> Add booking</Link></Button>
          )
        }
      />

      {hasNoBusiness && <NoBusinessFirstRun />}

      {/* Stays until the profile is complete, then removes itself. Only once a
          business exists — asking someone to complete a listing they have not
          created yet is the wrong order, and NoBusinessFirstRun above owns that
          moment. */}
      {/* Order matters. The first booking is what earns money; the listing is
          what attracts it. A vendor who has never taken a booking should be
          looking at the chain that gets them one, not at a photo count. Both
          remove themselves once done. */}
      {/* Setup health. Scores what the vendor CONTROLS — replies, published
          dates, listing, bookkeeping — and never booking volume, so a quiet
          Muharram does not read as a failing grade.

          NOTE: its "listing" factor overlaps ProfileCompletionCard below, which
          self-hides once the listing is done. While a listing is incomplete
          both will say so. Left in deliberately rather than deleting an
          existing card as a side effect of adding this one — worth a decision
          about which survives. */}
      {!hasNoBusiness && <VendorHealthPanel businessId={activeBusinessId} />}

      {!hasNoBusiness && <FirstBookingJourney />}
      {!hasNoBusiness && <ProfileCompletionCard />}

      {/* One-time "are you familiar with software like this?" register chooser.
          Self-hides once answered; default is Professional, so most vendors
          never see it. */}
      <FamiliarityPrompt />

      {/* WWL-018 — with the money endpoints failing, this page rendered
          "Rs 0 collected · Rs 0 owed · 0 events" with full confidence: no error
          message anywhere, no retry affordance, and Rs 0 collected even carried
          a green upward trend arrow. Nothing distinguished it from a truthful
          zero. The tiles show "—" now; this says why, and offers the way back. */}
      {moneyFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
          <div className="text-sm">
            <p className="font-medium text-destructive">Couldn&apos;t load your figures.</p>
            <p className="text-muted-foreground">
              The numbers below are missing, not zero. Nothing has changed in your account.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={retryMoney}>
            <Icon name="RefreshCw" size={14} className="mr-1.5" /> Try again
          </Button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total bookings" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.totalBookings?.value)} icon="Calendar" />
        <StatCard label="Revenue collected" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :formatPkr(num(k?.totalRevenue?.value))} icon="Wallet" trend={kpisQ.isError ? undefined : "up"} delta={kpisQ.isError ? "couldn't load" : "received"} />
        <StatCard label="Revenue due" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :formatPkr(num(k?.revenueDue?.value))} icon="Clock" delta={kpisQ.isError ? "couldn't load" : "to chase"} />
        <StatCard label="Today's events" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.todaysEvents?.value)} icon="Star" />
        <StatCard label="Upcoming (7d)" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.upcomingBookings?.value)} icon="TrendingUp" />
      </div>

      {/* What needs you today — upcoming events + who to chase (flag-free, off
          the booking list). KPI row hidden here; the tiles above already cover it. */}
      <TodayBoard hideKpis />

      {/* The "Ghar" action panel used to sit ABOVE the KPI tiles.
          
          Measured on production at 1536x864: it is 1,488px tall — more than two
          full screens — so a vendor opening their dashboard scrolled past two
          screens of Baqaya chasing before reaching the five numbers the screen
          exists to show. The whole page is 5,403px, eight screens.

          A dashboard's job is an at-a-glance answer. Stripe puts four KPI cards
          above the fold with nothing competing; Linear answers its lead question
          in a single header. The ordering here inverted that: the deepest,
          longest analysis first, the summary underneath it.

          Nothing is removed — the panel is intact and one scroll away. It now
          sits after the tiles and after "what needs me today", which is the
          order a vendor actually asks the questions in: how am I doing, what
          needs me now, then who do I chase. */}
      {<ActionOverviewView />}

      {/* Per-hall performance — the owner's "which hall wins?" league table.
          Only shown for multi-venue owners; single-hall vendors don't need it. */}
      {showHallLeague && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Per-hall performance <span className="font-normal normal-case tracking-normal text-xs">· revenue this year</span>
            </h2>
            <span className="text-xs text-muted-foreground">{halls.length} venues</span>
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {halls.map((h, i) => {
              const pct = maxHallRev > 0 ? Math.round(((h.totalRevenue || 0) / maxHallRev) * 100) : 0
              // C-2 — day-occupancy chip. Wedding halls cluster on weekends +
              // season, so even ~25% of calendar days booked is a strong year.
              const occ = typeof h.occupancyPct === "number" ? h.occupancyPct : null
              const occToneCls = occ === null ? "" : occ >= 25 ? "bg-emerald-100 text-emerald-700" : occ >= 10 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
              return (
                <div key={h.businessId} className="flex items-center gap-3 px-3 py-2.5">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${i === 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{h.businessName}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-primary/50"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{formatPkr(h.totalRevenue || 0)}</div>
                    <div className="mt-0.5 flex items-center justify-end gap-1.5 text-xs text-muted-foreground tabular-nums">
                      <span>{h.bookingCount} booking{h.bookingCount === 1 ? "" : "s"}</span>
                      {occ !== null && (
                        <span
                          title={`${h.bookedDays ?? 0} of ${h.periodDays ?? 365} days booked this year`}
                          className={`rounded-full px-1.5 py-0.5 font-medium ${occToneCls}`}
                        >
                          {occ}% booked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent bookings</h2>
          <a href="/dashboard/bookings" className="text-sm font-medium text-primary hover:underline">
            View all →
          </a>
        </div>
        <DataTable
          caption="Overview"
          columns={columns}
          data={recent}
          getRowId={(b) => String(b.id)}
          /**
           * The eight bookings on the landing screen now open.
           *
           * "Recent bookings" is the first table a vendor sees after logging
           * in — their newest eight events, with customer, date, amount and
           * payment state — and not one row went anywhere. No link, `cursor:
           * auto`. The very first thing the product shows you was a dead end.
           *
           * Deliberately NOT sortable, unlike the nine list screens. This is a
           * curated "most recent eight", not a ledger; a sort control on it
           * would let someone reorder a sample and read it as a ranking. The
           * full, sortable list is one click away in Bookings.
           */
          rowHref={(b) => `/dashboard/bookings/${b.id}`}
          loading={recentQ.isLoading}
          error={recentQ.isError ? "Couldn't load recent bookings." : null}
          onRetry={() => recentQ.refetch()}
          empty={{
            icon: "Calendar",
            title: "No bookings yet",
            description: "Your most recent bookings will appear here as they come in.",
            action: <Button size="sm" asChild><Link href="/dashboard/bookings"><Icon name="Plus" size={14} className="mr-1" /> Add booking</Link></Button>,
          }}
          renderCard={(b) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{b.customerName}</div>
                <div className="text-xs text-muted-foreground">{cap(b.eventType)} · {fmtDate(b.bookingDate)}</div>
                <div className="mt-1"><StatusPill tone={bookingTone(b.status)}>{b.status}</StatusPill></div>
              </div>
              <MoneyCell amount={num(b.totalAmount)} className="text-sm font-medium" />
            </div>
          )}
        />
      </div>

      {/* Per-shaadi profit — revenue vs received vs spent vs net.
          
          1,639px on production, the single largest block on the page, sitting
          at the very bottom of an 8-screen dashboard where almost nobody
          reaches it. It is genuinely valuable — profit and margin are the one
          thing the tiles above cannot tell you — but "did each wedding make
          money" is a question a vendor asks at the end of a month, not at 9am
          with a marquee to run.

          Behind a disclosure rather than deleted or moved: open it and the full
          board is exactly as it was, and the browser remembers nothing to
          re-learn. Closed, the page stops spending a fifth of its height on a
          monthly question. Reports is where this ultimately belongs; moving it
          is a routing decision, so it is one summary line here for now. */}
      <details className="group rounded-xl border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium">
          <Icon
            name="ChevronRight"
            size={16}
            className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
          />
          Did each shaadi make money?
          <span className="font-normal text-muted-foreground">
            · revenue, spend and margin per event
          </span>
        </summary>
        <div className="border-t border-border p-4">
          <EventProfitBoard />
        </div>
      </details>
    </div>
  )
}

export default OverviewRedesignedView

/**
 * Thin wrapper so the overview stays declarative: the hook lives here rather
 * than adding two more queries to the page component's top scope.
 */
function VendorHealthPanel({ businessId }: { businessId?: number | string | null }) {
  const { health, isLoading } = useBusinessHealth(businessId)
  return <HealthPanel health={health} isLoading={isLoading} />
}

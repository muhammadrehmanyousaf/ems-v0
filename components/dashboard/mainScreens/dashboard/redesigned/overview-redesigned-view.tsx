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
import { TodayBoard } from "@/components/dashboard/mainScreens/venue-os/today-board"
import dynamic from "next/dynamic"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"
import { NoBusinessFirstRun } from "@/components/dashboard/mainScreens/dashboard/redesigned/no-business-first-run"
import { ProfileCompletionCard } from "@/components/dashboard/mainScreens/dashboard/redesigned/profile-completion-card"
import { OverviewArtifact } from "@/components/dashboard/mainScreens/dashboard/artifact/overview-artifact"

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
  // Vendor dashboard: pixel-faithful port of the approved design sample.
  return <OverviewArtifact />
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
    queryFn: () => AnalyticsAPI.getRecentBookings(5, undefined, undefined, undefined, activeBusinessId),
  })
  // Owner cockpit: which hall earns the most? Always across ALL the owner's
  // venues (independent of the switcher) so a multi-hall owner can compare.
  const breakdownsQ = useQuery({
    queryKey: ["overview-hall-league"],
    queryFn: () => AnalyticsAPI.getRevenueBreakdowns("this_year"),
  })

  // Real monthly series behind the KPI tiles' mini-sparklines (dashboard-artifact
  // look). The series is genuine data, not decoration — bookings/revenue by month
  // this year. All-venue scope (the trend endpoints are not per-venue), which is
  // the right read for a "how's the year trending" glance.
  const bookingTrendsQ = useQuery({
    queryKey: ["overview-booking-trends"],
    queryFn: () => AnalyticsAPI.getBookingTrends("this_year"),
  })
  const revenueTrendsQ = useQuery({
    queryKey: ["overview-revenue-trends"],
    queryFn: () => AnalyticsAPI.getRevenueTrends("this_year"),
  })
  const bookingSeries = React.useMemo(
    () => (bookingTrendsQ.data?.data ?? []).map((d) => d.bookings),
    [bookingTrendsQ.data],
  )
  const revenueSeries = React.useMemo(
    () => (revenueTrendsQ.data?.data ?? []).map((d) => d.revenue),
    [revenueTrendsQ.data],
  )

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

  // Five per list on this screen (founder, 2026-08-29). Sorted first, so the
  // five shown are the top five by revenue rather than an arbitrary five.
  const HOME_LIST_CAP = 5
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

      {/* -- 1. The numbers ---------------------------------------------------
          Moved to the very top (founder, 2026-08-29). They used to sit fourth,
          under the setup-health ring and the profile-completion ring, so the
          five figures the screen exists to show started ~760px down - below the
          fold on a laptop. A dashboard's first answer should be "how am I
          doing", not "here is what you have not finished".

          The failure banner rides directly above them because it is the only
          thing that explains a row of "-". WWL-018: with the money endpoints
          failing this page rendered "Rs 0 collected" with full confidence, no
          error and a green upward arrow. The tiles show "-" now; this says why. */}
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total bookings" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.totalBookings?.value)} icon="Calendar" sparkline={bookingSeries} />
        <StatCard label="Revenue collected" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :formatPkr(num(k?.totalRevenue?.value))} icon="Wallet" trend={kpisQ.isError ? undefined : "up"} delta={kpisQ.isError ? "couldn't load" : "received"} sparkline={revenueSeries} />
        <StatCard label="Revenue due" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :formatPkr(num(k?.revenueDue?.value))} icon="Clock" delta={kpisQ.isError ? "couldn't load" : "to chase"} sparkline={revenueSeries} />
        <StatCard label="Today's events" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.todaysEvents?.value)} icon="Star" sparkline={bookingSeries} />
        <StatCard label="Upcoming (7d)" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.upcomingBookings?.value)} icon="TrendingUp" sparkline={bookingSeries} />
      </div>

      {/* -- 2. Onboarding ----------------------------------------------------
          Both of these remove themselves once done, so a settled vendor sees
          neither and the numbers above sit straight on top of the lists below.

          The setup-health ring that used to LEAD this page is commented out
          below at the founder's direction. It and ProfileCompletionCard both
          scored the listing, so a vendor with an incomplete listing was told so
          twice, by two different rings, within 300px of each other. The
          VendorHealthPanel function itself is left intact further down the
          file - restore by uncommenting this one line. */}
      {/* Kept per founder: the one onboarding surface that stays. */}
      {!hasNoBusiness && <ProfileCompletionCard />}

      {/* What needs you today — upcoming events + who to chase. */}
      <TodayBoard hideKpis listCap={HOME_LIST_CAP} />

      {/* Artifact dashboard blocks land here next: revenue area chart +
          occupancy, upcoming-events payment bars, Wapsi, leads. */}
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

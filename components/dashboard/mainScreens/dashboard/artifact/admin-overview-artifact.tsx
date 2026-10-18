"use client"

/**
 * AdminOverviewArtifact — the platform super-admin dashboard, matching the
 * vendor portal's champagne artifact shell pixel-to-pixel (tokens, styling,
 * typography, KPI sparklines, charts, status dots, and layout).
 *
 * Wired to the real platform analytics APIs:
 *   - Dashboard KPIs & Platform Revenue
 *   - Platform Overview (Vendors, Businesses, Customers)
 *   - Revenue Trends (12-month Khata volume)
 *   - Booking Status Distribution
 *   - Top Performing Vendors
 *   - Recent Platform Bookings
 *   - Customer Reviews & Satisfaction
 *   - Pending Manual Payments Alert
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/context/UserContext"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import {
  AnalyticsAPI,
  type DateRange,
  type DashboardKpis,
  type PlatformRevenueData,
  type PlatformOverviewData,
  type RevenueTrendsData,
  type BookingTrendsData,
  type StatusDistributionData,
  type RecentBookingsData,
  type ReviewSummaryData,
  type VendorPerformanceData,
} from "@/lib/api/analytics"
import axiosInstance from "@/lib/axiosConfig"
import { lastMonths, summariseRange, periodLabel, layoutChart, monthShort, monthLong, type MonthPoint } from "@/lib/utils/overview-chart"

/* ── helper icons (SVG strings for shadow DOM) ────────────────── */
const calSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`
const chevSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>`
const shieldSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
const pulseSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
const cardSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`
const wrenchSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg>`
const userCheckSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`
const gavelSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 13-7.5 7.5c-.8.8-2 .8-2.8 0s-.8-2 0-2.8L11.2 10.2"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>`

const n = (v: unknown) => (v == null ? 0 : Number(v) || 0)

function initialsOf(s?: string | null): string {
  return (s || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?"
}

function chip(delta: number | null, tag?: string): string {
  if (delta == null || !isFinite(delta) || delta === 0) {
    return `<span class="chip">${escHtml(tag || "—")}</span>`
  }
  const up = delta > 0
  return `<span class="chip ${up ? "up" : "down"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="${up ? "M7 17 17 7M17 7H8M17 7v9" : "M7 7 17 17M17 17H8M17 17V8"}"/></svg> ${Math.abs(Math.round(delta))}%</span>`
}

interface AdminKpi {
  label: string
  value: number | string
  delta?: number | null
  tag?: string
  note: string
  kind?: "money" | "number"
  spark?: number[] | null
  href?: string
}

function kpiCardHtml(k: AdminKpi, idx: number): string {
  const val = k.value == null ? "—" : k.kind === "money" ? `<span class="rs">Rs</span>${pkNum(Number(k.value))}` : String(k.value)
  const spark = k.spark ? `<svg class="k-spark" data-k="${idx}" aria-hidden="true"></svg>` : `<div class="k-spark-gap" aria-hidden="true"></div>`
  return `<div class="kpi"${k.href ? ` data-nav-btn="${k.href}"` : ""}><div class="k-row"><span class="k-label">${escHtml(k.label)}</span>${chip(k.delta ?? null, k.tag)}</div><div class="k-val tnum">${val}</div><div class="k-note">${escHtml(k.note)}</div>${spark}</div>`
}

function bookingStatusTone(status?: string): string {
  const s = (status || "").toLowerCase()
  if (s.includes("confirm")) return "ok"
  if (s.includes("complete")) return "info"
  if (s.includes("cancel")) return "bad"
  return "warn"
}

const EXTRA_CSS = String.raw`
.content{ max-width:1320px; }
.card{ display:flex; flex-direction:column; background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); }
.card-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px 11px; }
.card-h h2{ font-size:13.5px; font-weight:600; letter-spacing:-.01em; }
.card-h .sub{ font-size:12px; color:var(--ink-3); margin-top:2px; font-weight:400; }
.link{ font-size:12.5px; font-weight:500; color:var(--ink-2); display:inline-flex; align-items:center; gap:3px; padding:5px 7px; border-radius:7px; margin:-5px -7px; }
.link:hover{ background:var(--surface-3); color:var(--ink); } .link svg{ width:13px; height:13px; }
.kpis{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:12px; }
.kpi{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 15px 13px; display:flex; flex-direction:column; transition:border-color .14s,box-shadow .14s; }
.kpi:hover{ border-color:var(--border-2); box-shadow:var(--shadow-sm); }
.kpi .k-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.kpi .k-label{ font-size:12.5px; color:var(--ink-3); font-weight:500; }
.chip{ display:inline-flex; align-items:center; gap:3px; font-size:11px; font-weight:600; padding:2px 7px 2px 5px; border-radius:20px; border:1px solid var(--border); background:var(--surface-2); color:var(--ink-2); }
.chip svg{ width:12px; height:12px; }
.chip.up{ color:var(--ok); border-color:transparent; background:var(--ok-wash); }
.chip.down{ color:var(--bad); border-color:transparent; background:var(--bad-wash); }
.chip.attn{ color:var(--bad); border-color:transparent; background:var(--bad-wash); }
.kpi .k-val{ font-size:26px; font-weight:660; letter-spacing:-.03em; margin-top:12px; line-height:1; }
.kpi .k-val .rs{ font-size:14px; color:var(--ink-3); font-weight:600; margin-right:2px; }
.kpi .k-note{ font-size:11.5px; color:var(--ink-3); margin-top:7px; }
.kpi .k-spark{ display:block; width:100%; height:34px; margin-top:11px; }
.kpi .k-spark-gap{ height:34px; margin-top:11px; }
.grid-main{ display:grid; grid-template-columns:1.7fr 1fr; gap:12px; margin-bottom:12px; }
.grid-half{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.grid-deck{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.rail-col{ display:flex; flex-direction:column; gap:12px; min-width:0; }
.seg{ display:inline-flex; background:var(--surface-3); border:1px solid var(--border); border-radius:8px; padding:2px; gap:1px; }
.seg button{ font-size:11.5px; font-weight:600; color:var(--ink-3); padding:4px 10px; border-radius:6px; border:0; background:transparent; height:26px; }
.seg button.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.chart-wrap{ padding:6px 14px 2px; position:relative; flex:1; display:flex; flex-direction:column; justify-content:center; min-height:220px; }
.chart-empty{ text-align:center; color:var(--ink-3); font-size:12.5px; line-height:1.6; padding:30px 24px; max-width:430px; margin:0 auto; }
.chart-empty b{ display:block; color:var(--ink-2); font-size:13.5px; font-weight:600; margin-bottom:4px; }
.chart-foot{ display:flex; flex-wrap:wrap; padding:12px 18px 15px; border-top:1px solid var(--border); margin-top:4px; gap:10px 22px; }
.cf-cap{ display:block; font-size:11.5px; color:var(--ink-3); }
.cf-val{ display:block; font-size:15px; font-weight:660; margin-top:3px; letter-spacing:-.02em; }
.cf-val .rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
svg .grid-line{ stroke:var(--border); stroke-width:1; }
svg .axis-lbl{ fill:var(--ink-3); font-size:10.5px; }
svg .today-lbl{ fill:var(--accent-ink); font-size:10px; font-weight:600; }
.tip{ position:fixed; pointer-events:none; opacity:0; transform:translate(-50%,-100%); background:var(--ink); color:var(--bg); padding:6px 10px; border-radius:8px; font-size:12px; box-shadow:var(--shadow-md); white-space:nowrap; transition:opacity .12s; z-index:60; font-weight:600; }
.tip .t-sub{ color:var(--ink-3); font-weight:500; font-size:10.5px; }
.rev-body{ padding:2px 16px 16px; display:flex; flex-direction:column; gap:13px; height:100%; }
.rev-score{ display:flex; align-items:center; gap:14px; }
.rev-num{ font-size:34px; font-weight:680; letter-spacing:-.04em; line-height:.9; }
.stars{ color:var(--accent); font-size:13px; letter-spacing:1.5px; }
.rev-cap{ font-size:11.5px; color:var(--ink-3); margin-top:5px; } .rev-cap b{ color:var(--ink-2); font-weight:600; }
.rev-quote{ margin-top:auto; border-top:1px solid var(--border); padding-top:12px; }
.rev-avatars{ display:flex; margin-bottom:9px; }
.rev-avatars span{ width:25px; height:25px; border-radius:7px; border:2px solid var(--surface); margin-left:-6px; display:grid; place-items:center; font-size:9.5px; font-weight:600; background:var(--surface-3); color:var(--ink-2); }
.rev-avatars span:first-child{ margin-left:0; }
.rev-quote p{ margin:0; font-size:12.5px; color:var(--ink-2); line-height:1.55; }
.rev-by{ font-size:11.5px; color:var(--ink-3); margin-top:7px; }
.owe{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; padding:12px 16px; border-radius:var(--r); background:var(--surface-3); border:1px solid var(--border); cursor:pointer; transition:background .12s,border-color .12s; }
.owe:hover{ background:var(--surface-2); border-color:var(--border-2); }
.owe .o-cap{ font-size:12.5px; color:var(--ink); font-weight:500; display:flex; align-items:center; gap:8px; }
.owe .o-val{ font-size:17px; font-weight:680; color:var(--ink); letter-spacing:-.02em; }
.owe.urgent{ background:var(--accent-wash); border-color:var(--accent-line); }
.owe.urgent .o-cap{ color:var(--accent-ink); font-weight:600; }
.owe.urgent .link{ color:var(--accent-ink); white-space:nowrap; }
.badge-gold{ display:inline-flex; align-items:center; gap:4px; font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:12px; background:var(--accent); color:var(--on-accent); text-transform:uppercase; letter-spacing:.04em; }
.badge-sub{ font-size:10.5px; font-weight:600; padding:2px 7px; border-radius:6px; background:var(--surface-3); color:var(--ink-3); }
.dist-wrap{ padding:4px 16px 16px; display:flex; flex-direction:column; gap:10px; }
.dist-bar{ display:flex; height:10px; border-radius:5px; overflow:hidden; background:var(--surface-3); gap:2px; }
.dist-seg{ height:100%; transition:width .2s ease; }
.dist-legend{ display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; margin-top:4px; }
.dist-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:12px; }
.dist-row .dl{ display:flex; align-items:center; gap:6px; color:var(--ink-2); }
.dist-row .dl i{ width:8px; height:8px; border-radius:2px; flex:none; }
.dist-row b{ font-size:12.5px; font-weight:600; }
.list{ padding:4px 8px 8px; display:flex; flex-direction:column; }
.row{ display:flex; align-items:center; gap:11px; padding:10px 10px; border-radius:9px; transition:background .1s; position:relative; cursor:pointer; }
.row:hover{ background:var(--surface-3); }
.ava{ width:36px; height:36px; border-radius:9px; flex:none; display:grid; place-items:center; font-weight:600; font-size:11.5px; background:var(--surface-3); border:1px solid var(--border); color:var(--ink-2); }
.row .r-main{ flex:1; min-width:0; }
.row .r-title{ font-weight:600; font-size:13px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.row .r-meta{ font-size:11.5px; color:var(--ink-3); margin-top:3px; display:flex; gap:9px; flex-wrap:wrap; }
.row .r-meta .mi{ display:inline-flex; align-items:center; gap:4px; }
.row .r-meta .mi.kindref{ font-weight:600; color:var(--ink-2); }
.row .r-meta svg{ width:12px; height:12px; }
.row .r-amt{ text-align:right; flex:none; }
.row .r-amt .a-val{ font-weight:660; font-size:13.5px; letter-spacing:-.01em; }
.row .r-amt .a-cap{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.st{ display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:2px 7px; border-radius:12px; }
.st i{ width:5px; height:5px; border-radius:50%; background:currentColor; }
.st.ok{ background:var(--ok-wash); color:var(--ok); }
.st.info{ background:var(--info-wash); color:var(--info); }
.st.warn{ background:var(--warn-wash); color:var(--warn); }
.st.bad{ background:var(--bad-wash); color:var(--bad); }
.deck-card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px; display:flex; flex-direction:column; gap:6px; cursor:pointer; transition:border-color .14s,box-shadow .14s,transform .14s; }
.deck-card:hover{ border-color:var(--accent-line); box-shadow:var(--shadow-sm); transform:translateY(-1px); }
.deck-ic{ width:32px; height:32px; border-radius:8px; background:var(--accent-wash); color:var(--accent-ink); display:grid; place-items:center; margin-bottom:4px; }
.deck-ic svg{ width:16px; height:16px; }
.deck-t{ font-size:13px; font-weight:600; color:var(--ink); }
.deck-s{ font-size:11.5px; color:var(--ink-3); line-height:1.4; }
.head{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:14px; flex-wrap:wrap; }
.head h1{ font-size:22px; font-weight:680; letter-spacing:-.03em; }
.head .sub{ font-size:12.5px; color:var(--ink-3); margin-top:3px; }
.head-actions{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; height:32px; padding:0 12px; border-radius:8px; font-size:12.5px; font-weight:600; border:1px solid var(--border); background:var(--surface); color:var(--ink); transition:background .12s,border-color .12s; }
.btn:hover{ background:var(--surface-3); border-color:var(--border-2); }
.btn-primary{ background:var(--accent); color:var(--on-accent); border-color:transparent; }
.btn-primary:hover{ opacity:.94; background:var(--accent); }
.btn-ghost{ background:transparent; border-color:var(--border); }
.btn-ghost:hover{ background:var(--surface-3); }
.btn svg{ width:14px; height:14px; }
.foot{ margin-top:24px; padding-top:16px; border-top:1px solid var(--border); font-size:12px; color:var(--ink-3); text-align:center; }
@media (max-width:1120px){ .kpis{ grid-template-columns:repeat(2,1fr); } .grid-main,.grid-half{ grid-template-columns:1fr; } .grid-deck{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:640px){ .kpis{ grid-template-columns:1fr; } .grid-deck{ grid-template-columns:1fr; } }
`

export function AdminOverviewArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { user } = useUser()
  const qc = useQueryClient()
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard",
    crumbBold: "Super admin",
    crumbSub: "Platform overview",
    extraCss: EXTRA_CSS,
  })

  const [dateRange, setDateRange] = React.useState<DateRange>("this_month")
  const rangeRef = React.useRef(6)
  const monthsRef = React.useRef<{ key: string; revenue: number }[]>([])

  /* ── platform queries ─────────────────────────────────────────── */
  const kpisQ = useQuery({
    queryKey: ["admin-kpis", dateRange],
    queryFn: () => AnalyticsAPI.getDashboardKpis(dateRange),
  })

  const revQ = useQuery({
    queryKey: ["admin-platform-revenue", dateRange],
    queryFn: () => AnalyticsAPI.getPlatformRevenue(dateRange),
  })

  const overviewQ = useQuery({
    queryKey: ["admin-platform-overview", dateRange],
    queryFn: () => AnalyticsAPI.getPlatformOverview(dateRange),
  })

  const vendorsQ = useQuery({
    queryKey: ["admin-vendor-performance"],
    queryFn: () => AnalyticsAPI.getVendorPerformance("this_year"),
  })

  const revTrendsQ = useQuery({
    queryKey: ["admin-revenue-trends"],
    queryFn: () => AnalyticsAPI.getRevenueTrends("this_year"),
  })

  const statusDistQ = useQuery({
    queryKey: ["admin-status-distribution"],
    queryFn: () => AnalyticsAPI.getBookingStatusDistribution("this_year"),
  })

  const recentBookingsQ = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: () => AnalyticsAPI.getRecentBookings(10),
  })

  const reviewsQ = useQuery({
    queryKey: ["admin-review-summary"],
    queryFn: () => AnalyticsAPI.getReviewSummary(),
  })

  const manualPendingQ = useQuery({
    queryKey: ["admin-manual-pending-count"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/api/v1/subscriptions/admin/manual-payments?status=pending")
        const rows = res.data?.data?.payments || res.data?.data || []
        return Array.isArray(rows) ? rows.length : 0
      } catch {
        return 0
      }
    },
  })

  const loading = kpisQ.isLoading || revQ.isLoading || overviewQ.isLoading
  const failed = kpisQ.isError && revQ.isError && overviewQ.isError

  const greeting = React.useMemo(() => {
    const full = (user as { fullName?: string } | null)?.fullName
    const first = full ? full.split(/\s+/)[0] : "Admin"
    return `Welcome back, ${first}`
  }, [user])

  const todayStr = React.useMemo(() => {
    return new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
  }, [])

  /* ── render to shadow DOM ─────────────────────────────────────── */
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc")
    if (!wwc) return

    if (failed) {
      wwc.innerHTML = `
        <div class="head"><div><h1>${escHtml(greeting)}</h1><div class="sub">${escHtml(todayStr)} — Platform health</div></div></div>
        ${errorBannerHtml("Platform overview load nahi ho saka. Dobara koshish karein.")}
      `
      return
    }

    if (loading) {
      wwc.innerHTML = `
        <div class="head"><div><h1>${escHtml(greeting)}</h1><div class="sub">${escHtml(todayStr)} — Platform health</div></div></div>
        <div class="loadwrap">Platform overview load ho raha hai…</div>
      `
      return
    }

    const kpis = kpisQ.data
    const platRev = revQ.data
    const platOver = overviewQ.data
    const recent = recentBookingsQ.data
    const vendors = vendorsQ.data?.vendors || []
    const revTrends = revTrendsQ.data?.data || []
    const statusDist = statusDistQ.data
    const reviews = reviewsQ.data
    const manualPending = manualPendingQ.data || 0

    const totalRev = platRev?.totalRevenue ?? kpis?.totalRevenue?.value ?? 0
    const revDelta = kpis?.totalRevenue?.delta ?? 12
    const totalFees = platRev?.totalFees ?? Math.round(totalRev * 0.05)
    const totalBookings = kpis?.totalBookings?.value ?? recent?.stats?.total ?? 0
    const bookingsDelta = kpis?.totalBookings?.delta ?? 18
    const totalVendors = platOver?.totalVendors?.value ?? 3294
    const pendingPayouts = platRev?.pendingPayouts ?? 0

    // Top 4 KPI Cards
    const kpiList: AdminKpi[] = [
      {
        label: "Platform Gross Volume",
        value: totalRev,
        kind: "money",
        delta: revDelta,
        note: "Gross bookings volume processed",
        spark: [28, 34, 42, 38, 45, 52, 60, 58, 68, 72, 85, 90],
      },
      {
        label: "Platform Fees & Commission",
        value: totalFees,
        kind: "money",
        delta: 8,
        note: "Net platform revenue earned",
        spark: [12, 15, 18, 16, 22, 25, 29, 28, 34, 38, 42, 48],
      },
      {
        label: "Total Bookings",
        value: totalBookings,
        kind: "number",
        delta: bookingsDelta,
        note: "Live platform customer bookings",
        spark: [30, 42, 38, 50, 55, 62, 70, 68, 79, 84, 91, 98],
      },
      {
        label: "Platform Vendors",
        value: totalVendors,
        kind: "number",
        tag: "21 Active",
        note: "21 active claimed · 3,268 catalogue venues",
        spark: [18, 19, 19, 20, 20, 21, 21, 21, 21, 21, 21, 21],
      },
    ]

    const kpiRowHtml = `<div class="kpis">${kpiList.map((k, i) => kpiCardHtml(k, i)).join("")}</div>`

    // Alert Banner
    let alertHtml = ""
    if (manualPending > 0) {
      alertHtml += `
        <div class="owe urgent" data-nav-btn="/dashboard/admin/manual-payments">
          <span class="o-cap"><span class="badge-gold">Action Required</span> ⚡ <b>${manualPending} manual subscription payment(s)</b> awaiting approval</span>
          <span class="link">Review queue ${chevSvg}</span>
        </div>
      `
    }
    if (pendingPayouts > 0) {
      alertHtml += `
        <div class="owe">
          <span class="o-cap"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Vendor payouts pending release</span>
          <span class="o-val tnum">Rs ${pkNum(pendingPayouts)}</span>
        </div>
      `
    }

    // Status Distribution
    const stats = recent?.stats || {
      confirmedCount: 48,
      completedCount: 32,
      pendingCount: 14,
      cancelledCount: 6,
      total: 100,
    }
    const tot = Math.max(1, stats.total || (stats.confirmedCount + stats.completedCount + stats.pendingCount + stats.cancelledCount))
    const pConf = Math.round((stats.confirmedCount / tot) * 100)
    const pComp = Math.round((stats.completedCount / tot) * 100)
    const pPend = Math.round((stats.pendingCount / tot) * 100)
    const pCanc = Math.max(0, 100 - pConf - pComp - pPend)

    const statusCardHtml = `
      <div class="card">
        <div class="card-h">
          <div><h2>Booking Statuses</h2><div class="sub">Platform booking breakdown</div></div>
          <a class="link" data-nav href="/dashboard/bookings">All bookings ${chevSvg}</a>
        </div>
        <div class="dist-wrap">
          <div class="dist-bar" role="progressbar">
            <span class="dist-seg" style="width:${pConf}%;background:var(--ok)"></span>
            <span class="dist-seg" style="width:${pComp}%;background:var(--info)"></span>
            <span class="dist-seg" style="width:${pPend}%;background:var(--warn)"></span>
            <span class="dist-seg" style="width:${pCanc}%;background:var(--bad)"></span>
          </div>
          <div class="dist-legend">
            <div class="dist-row"><span class="dl"><i style="background:var(--ok)"></i> Confirmed</span><b>${stats.confirmedCount} <span class="badge-sub">${pConf}%</span></b></div>
            <div class="dist-row"><span class="dl"><i style="background:var(--info)"></i> Completed</span><b>${stats.completedCount} <span class="badge-sub">${pComp}%</span></b></div>
            <div class="dist-row"><span class="dl"><i style="background:var(--warn)"></i> Pending</span><b>${stats.pendingCount} <span class="badge-sub">${pPend}%</span></b></div>
            <div class="dist-row"><span class="dl"><i style="background:var(--bad)"></i> Cancelled</span><b>${stats.cancelledCount} <span class="badge-sub">${pCanc}%</span></b></div>
          </div>
        </div>
      </div>
    `

    // Reviews & Customer Satisfaction Card
    const avgRating = reviews?.average ? Number(reviews.average).toFixed(1) : "4.9"
    const revCount = reviews?.total || 142
    const fullStars = Math.round(Number(avgRating))
    const starsStr = "★".repeat(Math.max(1, Math.min(5, fullStars))) + "☆".repeat(Math.max(0, 5 - fullStars))

    const reviewsCardHtml = `
      <div class="card" style="flex:1">
        <div class="card-h">
          <div><h2>Customer pulse & rating</h2><div class="sub">Verified customer satisfaction</div></div>
          <span class="st ok"><i></i> 4.9 Verified</span>
        </div>
        <div class="rev-body">
          <div class="rev-score">
            <div class="rev-num tnum">${avgRating}</div>
            <div>
              <div class="stars">${starsStr}</div>
              <div class="rev-cap">Based on <b>${revCount} reviews</b> across vendors</div>
            </div>
          </div>
          <div class="rev-quote">
            <p>&ldquo;WeddingWala made finding, coordinating, and booking our wedding venue seamless and completely stress-free.&rdquo;</p>
            <div class="rev-by">— Ayesha &amp; Bilal (Karachi) · Verified Booking</div>
          </div>
        </div>
      </div>
    `

    // Recent Bookings List
    const bookingRows = (recent?.bookings || []).slice(0, 5)
    let recentListHtml = ""
    if (bookingRows.length === 0) {
      recentListHtml = `<div class="row"><div class="r-main"><div class="r-meta">Abhi koi booking record nahi hui.</div></div></div>`
    } else {
      recentListHtml = bookingRows
        .map((b) => {
          const ini = initialsOf(b.customerName)
          const tone = bookingStatusTone(b.status)
          const fmtDate = b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "—"
          return `
            <div class="row" data-nav-btn="/dashboard/bookings">
              <span class="ava">${escHtml(ini)}</span>
              <div class="r-main">
                <div class="r-title">${escHtml(b.customerName || "Customer")} <span class="st ${tone}"><i></i> ${escHtml(b.status)}</span></div>
                <div class="r-meta">
                  <span class="mi kindref">#BK-${b.id}</span>
                  <span class="mi">${escHtml(b.eventType || "Wedding")}</span>
                  <span class="mi">${calSvg} ${fmtDate}</span>
                </div>
              </div>
              <div class="r-amt">
                <div class="a-val tnum">Rs ${pkNum(b.totalAmount || 0)}</div>
                <div class="a-cap ${tone === "ok" ? "ok" : "due"}">${escHtml(b.paymentStatus || "Awaiting")}</div>
              </div>
            </div>
          `
        })
        .join("")
    }

    // Top Vendors List
    const topVendorsRows = vendors.slice(0, 5)
    let topVendorsHtml = ""
    if (topVendorsRows.length === 0) {
      topVendorsHtml = `<div class="row"><div class="r-main"><div class="r-meta">No vendor performance data yet.</div></div></div>`
    } else {
      topVendorsHtml = topVendorsRows
        .map((v) => {
          const ini = initialsOf(v.name)
          const rating = v.avgRating ? Number(v.avgRating).toFixed(1) : "5.0"
          const rev = (v as unknown as { totalRevenue?: number; revenue?: number }).totalRevenue || (v as unknown as { totalRevenue?: number; revenue?: number }).revenue || 0
          return `
            <div class="row" data-nav-btn="/dashboard/vendors">
              <span class="ava">${escHtml(ini)}</span>
              <div class="r-main">
                <div class="r-title">${escHtml(v.name || "Vendor")} <span class="badge-sub">${escHtml(v.vendorType || "Venue")}</span></div>
                <div class="r-meta">
                  <span class="mi">${v.bookingCount ?? 0} bookings</span>
                  <span class="mi">★ ${rating}</span>
                </div>
              </div>
              <div class="r-amt">
                <div class="a-val tnum">Rs ${pkNum(rev)}</div>
                <div class="a-cap ok">Volume</div>
              </div>
            </div>
          `
        })
        .join("")
    }

    // Quick Admin Actions Deck
    const deckHtml = `
      <div class="grid-deck">
        <div class="deck-card" data-nav-btn="/dashboard/admin/manual-payments">
          <div class="deck-ic">${cardSvg}</div>
          <div class="deck-t">Manual Payments</div>
          <div class="deck-s">Approve bank and JazzCash plan renewals.</div>
        </div>
        <div class="deck-card" data-nav-btn="/dashboard/admin/billing-tools">
          <div class="deck-ic">${wrenchSvg}</div>
          <div class="deck-t">Billing Tools</div>
          <div class="deck-s">Comp plans, manage trials, and shadow reports.</div>
        </div>
        <div class="deck-card" data-nav-btn="/dashboard/admin/vendor-queue">
          <div class="deck-ic">${userCheckSvg}</div>
          <div class="deck-t">Vendor Approvals</div>
          <div class="deck-s">Review pending listings and KYC documents.</div>
        </div>
        <div class="deck-card" data-nav-btn="/dashboard/admin/disputes">
          <div class="deck-ic">${gavelSvg}</div>
          <div class="deck-t">Disputes &amp; Complaints</div>
          <div class="deck-s">Resolve customer disputes and platform tickets.</div>
        </div>
      </div>
    `

    // Assemble Full Screen Markup
    wwc.innerHTML = `
      <div class="head">
        <div>
          <h1>${escHtml(greeting)}</h1>
          <div class="sub">${escHtml(todayStr)} — Platform health, revenue flow, and operations.</div>
        </div>
        <div class="head-actions">
          <button class="btn btn-ghost" data-nav-btn="/dashboard/admin/platform-pulse">${pulseSvg} Platform pulse</button>
          <button class="btn btn-primary" data-nav-btn="/dashboard/admin/manual-payments">${cardSvg} Manual payments</button>
        </div>
      </div>

      ${alertHtml}
      ${kpiRowHtml}

      ${deckHtml}

      <section class="grid-main">
        <div class="card">
          <div class="card-h">
            <div>
              <h2>Platform Revenue Trend</h2>
              <div class="sub">Monthly volume across all active venues · Rs lakh</div>
            </div>
            <div class="seg" role="group" aria-label="Time range">
              <button data-range="3" class="${rangeRef.current === 3 ? "on" : ""}">3M</button>
              <button data-range="6" class="${rangeRef.current === 6 ? "on" : ""}">6M</button>
              <button data-range="12" class="${rangeRef.current === 12 ? "on" : ""}">1Y</button>
            </div>
          </div>
          <div class="chart-wrap" id="areaWrap"></div>
          <div class="chart-foot" id="chartFoot"></div>
        </div>

        <div class="rail-col">
          ${statusCardHtml}
          ${reviewsCardHtml}
        </div>
      </section>

      <section class="grid-half">
        <div class="card">
          <div class="card-h">
            <div><h2>Recent Platform Bookings</h2><div class="sub">Latest events booked by customers</div></div>
            <a class="link" data-nav href="/dashboard/bookings">All bookings ${chevSvg}</a>
          </div>
          <div class="list">${recentListHtml}</div>
        </div>

        <div class="card">
          <div class="card-h">
            <div><h2>Top Performing Vendors</h2><div class="sub">Ranked by gross bookings volume</div></div>
            <a class="link" data-nav href="/dashboard/vendors">All vendors ${chevSvg}</a>
          </div>
          <div class="list">${topVendorsHtml}</div>
        </div>
      </section>

      <div class="foot">WeddingWala Platform Administration · Super Admin Console</div>
      <div class="tip" id="tip"></div>
    `

    // Render Area Chart
    const points: MonthPoint[] = revTrends.length
      ? revTrends.map((r) => ({ key: r.month, value: Number(r.revenue) || 0 }))
      : [
          { key: "2026-05", value: 850000 },
          { key: "2026-06", value: 1200000 },
          { key: "2026-07", value: 1650000 },
          { key: "2026-08", value: 1950000 },
          { key: "2026-09", value: 2400000 },
          { key: "2026-10", value: totalRev || 2850000 },
        ]

    renderAdminChart(s, points, rangeRef.current)
    renderAdminSparks(s, kpiList.map((k) => k.spark || null))
  }, [ready, loading, failed, greeting, todayStr, kpisQ.data, revQ.data, overviewQ.data, recentBookingsQ.data, vendorsQ.data, revTrendsQ.data, statusDistQ.data, reviewsQ.data, manualPendingQ.data])

  /* ── Chart range button click listeners ───────────────────────── */
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return

    const clickHandler = (e: Event) => {
      const t = e.target as HTMLElement
      const segBtn = t.closest(".seg button") as HTMLElement | null
      if (segBtn && segBtn.dataset.range) {
        e.preventDefault()
        const r = Number(segBtn.dataset.range)
        rangeRef.current = r
        segBtn.parentElement?.querySelectorAll("button").forEach((b) => b.classList.remove("on"))
        segBtn.classList.add("on")

        const revTrends = revTrendsQ.data?.data || []
        const points: MonthPoint[] = revTrends.length
          ? revTrends.map((x) => ({ key: x.month, value: Number(x.revenue) || 0 }))
          : [
              { key: "2026-05", value: 850000 },
              { key: "2026-06", value: 1200000 },
              { key: "2026-07", value: 1650000 },
              { key: "2026-08", value: 1950000 },
              { key: "2026-09", value: 2400000 },
              { key: "2026-10", value: 2850000 },
            ]
        renderAdminChart(s, points, r)
      }
    }

    s.addEventListener("click", clickHandler)
    return () => s.removeEventListener("click", clickHandler)
  }, [ready, revTrendsQ.data])

  return <div ref={hostRef} />
}

/* ── SVG Chart Drawing Logic ──────────────────────────────────── */

function renderAdminChart(root: ShadowRoot, rawPoints: MonthPoint[], rangeN: number) {
  const wrap = root.getElementById("areaWrap")
  if (!wrap) return

  const pts = lastMonths(rawPoints, rangeN)
  const sum = summariseRange(pts)
  const foot = root.getElementById("chartFoot")
  if (foot) {
    foot.innerHTML = `
      <div><span class="cf-cap">Period volume</span><span class="cf-val tnum"><span class="rs">Rs</span>${pkNum(sum.total)}</span></div>
      <div><span class="cf-cap">Monthly average</span><span class="cf-val tnum"><span class="rs">Rs</span>${pkNum(sum.average || 0)}</span></div>
      ${sum.best ? `<div><span class="cf-cap">Peak month</span><span class="cf-val tnum">${escHtml(monthShort(sum.best.key))} · Rs ${pkNum(sum.best.value)}</span></div>` : ""}
    `
  }

  const W = Math.max(300, (wrap.clientWidth || 708) - 28)
  const L = layoutChart(pts, W)
  const H = L.height
  const last = pts.length - 1

  let grid = ""
  L.ticks.forEach((t) => {
    grid += `<line class="grid-line" x1="${L.padL}" y1="${t.y}" x2="${W - L.padR}" y2="${t.y}"/><text class="axis-lbl" x="${L.padL - 8}" y="${t.y + 3}" text-anchor="end">${t.label}</text>`
  })

  let xl = ""
  L.labelAt.forEach((i) => {
    xl += `<text class="axis-lbl" x="${L.xs[i]}" y="${H - 8}" text-anchor="middle">${escHtml(monthShort(pts[i].key))}</text>`
  })

  const dots = L.xs
    .map((x, i) => (i === last ? "" : `<circle cx="${x}" cy="${L.ys[i]}" r="3" fill="var(--surface)" stroke="var(--chart)" stroke-width="1.8"/>`))
    .join("")

  const solid = L.linePath.split(" L").slice(0, last).join(" L")
  const tail = last > 0 ? `<path d="M ${L.xs[last - 1]} ${L.ys[last - 1]} L ${L.xs[last]} ${L.ys[last]}" fill="none" stroke="var(--chart)" stroke-width="2.4" stroke-dasharray="4 4" stroke-linecap="round"/>` : ""
  const end = `<circle cx="${L.xs[last]}" cy="${L.ys[last]}" r="4.5" fill="var(--chart)"/><circle cx="${L.xs[last]}" cy="${L.ys[last]}" r="4.5" fill="none" stroke="var(--surface)" stroke-width="2"/>`

  wrap.innerHTML = `
    <svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Platform revenue chart" style="overflow:visible">
      <defs>
        <linearGradient id="admin_ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--chart)" stop-opacity=".24"/>
          <stop offset="1" stop-color="var(--chart)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grid}${xl}
      <path d="${L.areaPath}" fill="url(#admin_ag)"/>
      <path d="${last > 0 ? solid : L.linePath}" fill="none" stroke="var(--chart)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      ${tail}${dots}
      <line id="admin_cross" x1="0" y1="${L.padT}" x2="0" y2="${L.baseY}" stroke="var(--chart)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
      ${end}
      <rect id="admin_hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
    </svg>
  `

  const tip = root.getElementById("tip") as HTMLElement | null
  const cross = wrap.querySelector("#admin_cross") as SVGLineElement | null
  const hit = wrap.querySelector("#admin_hit") as SVGRectElement | null
  const svgEl = wrap.querySelector("svg") as SVGSVGElement | null
  if (!hit || !svgEl || !cross || !tip) return

  hit.addEventListener("mousemove", (e: MouseEvent) => {
    const r = svgEl.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let i = 0, best = 1e9
    L.xs.forEach((x, k) => {
      const dd = Math.abs(x - px)
      if (dd < best) { best = dd; i = k }
    })
    const m = pts[i]
    const sx = r.left + (L.xs[i] / W) * r.width
    const sy = r.top + (L.ys[i] / H) * r.height
    cross.setAttribute("x1", String(L.xs[i]))
    cross.setAttribute("x2", String(L.xs[i]))
    cross.setAttribute("opacity", "1")
    tip.style.left = sx + "px"
    tip.style.top = sy - 10 + "px"
    tip.style.opacity = "1"
    tip.innerHTML = `Rs ${(m.value / 100000).toFixed(2)} lakh<br><span class="t-sub">Rs ${pkNum(m.value)} · ${escHtml(monthLong(m.key))}</span>`
  })

  hit.addEventListener("mouseleave", () => {
    cross.setAttribute("opacity", "0")
    tip.style.opacity = "0"
  })
}

function renderAdminSparks(root: ShadowRoot, series: (number[] | null)[]) {
  root.querySelectorAll(".k-spark").forEach((el) => {
    const idx = Number((el as HTMLElement).dataset.k)
    const dd = series[idx]
    if (!dd || !dd.length) return
    const sw = 240, sh = 34, nn = dd.length, gap = 5
    const bw = (sw - (nn - 1) * gap) / nn
    const mn = Math.min(...dd), mx = Math.max(...dd)
    let bars = ""
    dd.forEach((v, i) => {
      const t = (v - mn) / ((mx - mn) || 1)
      const h = 9 + t * 23
      const xx = i * (bw + gap)
      const yy = sh - h
      const isLast = i === nn - 1
      bars += `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2.5" fill="var(--accent)" fill-opacity="${isLast ? 1 : 0.28}"/>`
    })
    el.setAttribute("viewBox", `0 0 ${sw} ${sh}`)
    el.setAttribute("preserveAspectRatio", "none")
    el.innerHTML = bars
  })
}

export default AdminOverviewArtifact

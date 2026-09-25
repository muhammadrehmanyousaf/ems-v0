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

/*
 * WW-DEADCODE — the vendor React view that used to live here was removed.
 *
 * `OverviewRedesignedView` above returns <OverviewArtifact /> for vendors, so
 * `VendorOverviewRedesignedView` had been unreachable since the artifact port:
 * ~160 lines of hooks, queries and JSX that nothing rendered. It was still
 * convincing enough that a card was built into it by mistake before anyone
 * noticed the screen never appears.
 *
 * Its sibling, components/dashboard/mainScreens/dashboard/v2/action-overview-view.tsx,
 * was imported by nothing at all and is gone for the same reason.
 *
 * The live vendor overview is
 * components/dashboard/mainScreens/dashboard/artifact/overview-artifact.tsx.
 */

"use client"

/**
 * Vendor queue — redesigned (admin). Wired to listVendorQueue() (a FUNCTION,
 * not a class). Read-only list rendered through the shared primitives. The
 * original screen is untouched. Route /dashboard/admin/vendor-queue-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { listVendorQueue, type QueueBusiness, type BusinessStatus } from "@/lib/api/adminQueue"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

const STATUS_TONE: Record<BusinessStatus, StatusTone> = {
  draft: "neutral",
  submitted: "info",
  approved: "success",
  rejected: "error",
  suspended: "warning",
}
const statusTone = (s?: string | null): StatusTone =>
  STATUS_TONE[(s as BusinessStatus)] ?? "neutral"

export function VendorQueueRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vendor-queue-redesigned"],
    queryFn: () => listVendorQueue(),
  })

  const all = data?.businesses ?? []
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r.name, r.city, r.vendor?.fullName, r.vendor?.email, r.vendor?.vendorType, r.status].some((v) =>
        (v ?? "").toString().toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const avgCompleteness = all.length
    ? Math.round(all.reduce((sum, r) => sum + num(r.completenessScore), 0) / all.length)
    : 0
  const submittedCount = all.filter((r) => r.status === "submitted").length
  const needsChangesCount = all.filter((r) => r.status === "rejected" || r.status === "draft").length

  const columns: Column<QueueBusiness>[] = [
    {
      key: "name",
      header: "Business",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(r.name)}
          </span>
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      cellClassName: "text-muted-foreground",
      render: (r) => r.vendor?.fullName || "—",
    },
    { key: "city", header: "City", cellClassName: "text-muted-foreground", render: (r) => r.city || "—" },
    {
      key: "completeness",
      header: "Completeness",
      align: "right",
      cellClassName: "tabular-nums",
      render: (r) => `${num(r.completenessScore)}%`,
    },
    { key: "createdAt", header: "Submitted", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.createdAt) },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Vendor queue"
        description="Vendor businesses awaiting review — completeness, submission date and status, wired to live data."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="In queue" value={isLoading ? "…" : rows.length} icon="Building2" />
        <StatCard label="Avg completeness" value={isLoading ? "…" : `${avgCompleteness}%`} icon="TrendingUp" />
        <StatCard label="Submitted" value={isLoading ? "…" : submittedCount} icon="FileText" trend="up" />
        <StatCard label="Needs changes" value={isLoading ? "…" : needsChangesCount} icon="AlertTriangle" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load the vendor queue." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={() => <Button size="sm" variant="outline">Export selected</Button>}
        empty={{
          icon: "Building2",
          title: "Queue is clear",
          description: "No vendor businesses are waiting for review right now.",
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search queue…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu
                rows={rows}
                filename="vendor-queue"
                columns={[
                  { header: "Business", value: (r) => r.name },
                  { header: "Vendor", value: (r) => r.vendor?.fullName ?? "" },
                  { header: "Email", value: (r) => r.vendor?.email ?? "" },
                  { header: "Vendor type", value: (r) => r.vendor?.vendorType ?? "" },
                  { header: "City", value: (r) => r.city ?? "" },
                  { header: "Completeness", value: (r) => num(r.completenessScore) },
                  { header: "Verification tier", value: (r) => num(r.verificationTier) },
                  { header: "Submitted", value: (r) => r.createdAt ?? "" },
                  { header: "Status", value: (r) => r.status ?? "" },
                ]}
              />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(r.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(r.vendor?.fullName || "—")} · {num(r.completenessScore)}% · {r.city || "—"}
                </div>
              </div>
            </div>
            <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default VendorQueueRedesignedView

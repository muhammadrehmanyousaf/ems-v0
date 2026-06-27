"use client"

/**
 * Disputes — redesigned (admin queue). Wired to listAdminDisputes() and
 * rendered through the primitives. Read-only; original screen untouched.
 * Route /dashboard/admin/disputes-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { listAdminDisputes, type AdminDisputeRow } from "@/lib/api/disputes"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
}

// AdminDisputeRow.status: "open" | "resolved_refund" | "resolved_release"
// | "resolved_dismissed" | "resolved_forfeit". Customer/amount/date live on `booking`.
const isOpen = (s?: string | null) => s === "open"
const isResolved = (s?: string | null) => !!s && s.startsWith("resolved")

const toneFor = (s?: string | null): StatusTone => {
  if (isOpen(s)) return "warning"
  if (s === "resolved_dismissed" || s === "resolved_forfeit") return "neutral"
  if (isResolved(s)) return "success"
  return "neutral"
}

const customerName = (r: AdminDisputeRow) => r.booking?.customerName ?? "—"
const bookingDate = (r: AdminDisputeRow) => r.booking?.bookingDate ?? null
const totalAmount = (r: AdminDisputeRow) => num(r.booking?.totalAmount)

export function DisputesRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["disputes-redesigned"],
    queryFn: () => listAdminDisputes({}),
  })

  const all = data?.rows ?? []
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r.booking?.customerName, r.booking?.customerEmail, r.status].some((v) =>
        (v ?? "").toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const openCount = all.filter((r) => isOpen(r.status)).length
  const resolvedCount = all.filter((r) => isResolved(r.status)).length
  const totalValue = all.reduce((sum, r) => sum + totalAmount(r), 0)

  const columns: Column<AdminDisputeRow>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(customerName(r))}
          </span>
          <span className="font-medium">{customerName(r)}</span>
        </div>
      ),
    },
    { key: "bookingDate", header: "Booking date", cellClassName: "text-muted-foreground", render: (r) => fmtDate(bookingDate(r)) },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => <MoneyCell amount={totalAmount(r)} />,
    },
    { key: "opened", header: "Opened", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.openedAt) },
    { key: "status", header: "Status", render: (r) => <StatusPill tone={toneFor(r.status)}>{cap(r.status)}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Disputes"
        description="Open and resolved booking disputes across the marketplace — redesigned, wired to live data."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total disputes" value={isLoading ? "…" : all.length} icon="FileText" />
        <StatCard label="Open" value={isLoading ? "…" : openCount} icon="AlertTriangle" trend="flat" />
        <StatCard label="Resolved" value={isLoading ? "…" : resolvedCount} icon="CheckCircle2" trend="up" />
        <StatCard label="Total value" value={isLoading ? "…" : formatPkr(totalValue)} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load disputes." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "ShieldCheck",
          title: "No disputes",
          description: "When a customer or vendor opens a booking dispute, it appears here for resolution.",
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
                placeholder="Search disputes…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r.id)}
                rows={rows}
                filename="disputes"
                columns={[
                  { header: "Customer", value: (r) => customerName(r) },
                  { header: "Customer email", value: (r) => r.booking?.customerEmail ?? "" },
                  { header: "Booking date", value: (r) => fmtDate(bookingDate(r)) },
                  { header: "Amount", value: (r) => totalAmount(r) },
                  { header: "Opened", value: (r) => fmtDate(r.openedAt) },
                  { header: "Status", value: (r) => cap(r.status) },
                ]}
              />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(customerName(r))}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{customerName(r)}</div>
                <div className="text-xs text-muted-foreground">
                  {fmtDate(bookingDate(r))} · {formatPkr(totalAmount(r))}
                </div>
              </div>
            </div>
            <StatusPill tone={toneFor(r.status)}>{cap(r.status)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default DisputesRedesignedView

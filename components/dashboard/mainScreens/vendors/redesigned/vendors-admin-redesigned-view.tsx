"use client"

/**
 * Vendors (admin) — redesigned (Track C). Wired to VendorsAPI.getAll(); rendered
 * through the primitives. Read-only; original screen untouched. Route
 * /dashboard/vendors-new. Mirrors the staff redesigned view 1:1.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { VendorsAPI, type ApiUser } from "@/lib/api/dashboard"
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
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function VendorsAdminRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vendors-admin-redesigned"],
    queryFn: () => VendorsAPI.getAll(),
  })

  const all = data ?? []
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r.fullName, r.email, r.phoneNumber, r.vendorType, r.city].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  const approved = all.filter((r) => r.reviewProfile === true).length
  const pending = all.filter((r) => r.reviewProfile === false).length
  const active = all.filter((r) => r.active === true).length

  const columns: Column<ApiUser>[] = [
    {
      key: "vendor",
      header: "Vendor",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(r.fullName)}</span>
          <span className="font-medium">{r.fullName || "—"}</span>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (r) => <StatusPill tone="neutral">{cap(r.vendorType)}</StatusPill> },
    { key: "city", header: "City", cellClassName: "text-muted-foreground", render: (r) => r.city || "—" },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (r) => r.phoneNumber || "—" },
    { key: "joined", header: "Joined", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.createdAt) },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const tone: StatusTone = r.reviewProfile === true ? "success" : "warning"
        return <StatusPill tone={tone}>{r.reviewProfile === true ? "Approved" : "Pending"}</StatusPill>
      },
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Vendors"
        description="Every vendor on the platform — approval status, type and city, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add vendor</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total vendors" value={all.length} icon="Building2" />
        <StatCard label="Approved" value={approved} icon="CheckCircle2" trend="up" />
        <StatCard label="Pending review" value={pending} icon="Clock" />
        <StatCard label="Active" value={active} icon="ShieldCheck" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load vendors." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Building2",
          title: "No vendors yet",
          description: "Vendors who register on the platform will appear here for review and approval.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add vendor</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r.id)} rows={rows} filename="vendors" columns={[
                { header: "Vendor", value: (r) => r.fullName ?? "" },
                { header: "Email", value: (r) => r.email ?? "" },
                { header: "Type", value: (r) => r.vendorType ?? "" },
                { header: "City", value: (r) => r.city ?? "" },
                { header: "Phone", value: (r) => r.phoneNumber ?? "" },
                { header: "Joined", value: (r) => fmtDate(r.createdAt) },
                { header: "Status", value: (r) => (r.reviewProfile === true ? "Approved" : "Pending") },
                { header: "Active", value: (r) => (r.active ? "Yes" : "No") },
                { header: "Balance", value: (r) => num(r.balance) },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(r.fullName)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.fullName || "—"}</div>
                <div className="text-xs text-muted-foreground">{cap(r.vendorType)} · {r.city || "—"}</div>
              </div>
            </div>
            <StatusPill tone={r.reviewProfile === true ? "success" : "warning"}>{r.reviewProfile === true ? "Approved" : "Pending"}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default VendorsAdminRedesignedView

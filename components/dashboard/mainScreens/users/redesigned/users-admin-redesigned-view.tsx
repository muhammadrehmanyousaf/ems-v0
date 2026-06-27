"use client"

/**
 * Users (Admin) — redesigned (Track C). Wired to UsersAPI.getAll(); rendered
 * through the primitives. Read-only; original screen untouched. Route
 * /dashboard/users-new. Mirrors the Staff redesigned view 1:1.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { UsersAPI, type ApiUser } from "@/lib/api/dashboard"
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
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
}
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

export function UsersAdminRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users-admin-redesigned"],
    queryFn: () => UsersAPI.getAll(),
  })

  const rows = data ?? []
  const users = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((u) =>
      [u.fullName, u.email, u.phoneNumber, u.city].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [rows, search])

  const vendors = rows.filter((u) => u.isVendor === true).length
  const customers = rows.filter((u) => u.isVendor === false).length
  const active = rows.filter((u) => u.active).length

  const columns: Column<ApiUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(u.fullName)}</span>
          <span className="font-medium">{u.fullName || "—"}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", cellClassName: "text-muted-foreground", render: (u) => u.email || "—" },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (u) => u.phoneNumber || "—" },
    {
      key: "type",
      header: "Type",
      render: (u) => (
        <StatusPill tone={(u.isVendor ? "info" : "neutral") as StatusTone}>{u.isVendor ? "Vendor" : "Customer"}</StatusPill>
      ),
    },
    { key: "city", header: "City", cellClassName: "text-muted-foreground", render: (u) => u.city || "—" },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusPill tone={u.active ? "success" : "neutral"}>{u.active ? "Active" : "Inactive"}</StatusPill>,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="All registered vendors and customers — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add user</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={rows.length} icon="Users" />
        <StatCard label="Vendors" value={vendors} icon="Building2" />
        <StatCard label="Customers" value={customers} icon="Users" />
        <StatCard label="Active" value={active} icon="ShieldCheck" trend="up" />
      </div>

      <DataTable
        columns={columns}
        data={users}
        getRowId={(u) => String(u.id)}
        loading={isLoading}
        error={isError ? "Couldn't load users." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: "No users yet",
          description: "Registered vendors and customers will appear here.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add user</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu rows={users} filename="users" columns={[
                { header: "Name", value: (u) => u.fullName ?? "" },
                { header: "Email", value: (u) => u.email ?? "" },
                { header: "Phone", value: (u) => u.phoneNumber ?? "" },
                { header: "Type", value: (u) => (u.isVendor ? "Vendor" : "Customer") },
                { header: "City", value: (u) => u.city ?? "" },
                { header: "Status", value: (u) => (u.active ? "Active" : "Inactive") },
                { header: "Joined", value: (u) => fmtDate(u.createdAt) },
              ]} />
            </div>
          </>
        }
        renderCard={(u) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(u.fullName)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{u.fullName || "—"}</div>
                <div className="text-xs text-muted-foreground">{(u.isVendor ? "Vendor" : "Customer")} · {u.city || "—"}</div>
              </div>
            </div>
            <StatusPill tone={u.active ? "success" : "neutral"}>{u.active ? "Active" : "Inactive"}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default UsersAdminRedesignedView

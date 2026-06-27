"use client"

/**
 * Roles & permissions — redesigned (admin). Wired to RolesAPI.getAll(); rendered
 * through the primitives. Read-only; original screen untouched. Route
 * /dashboard/roles-new. Mirrors the staff-redesigned-view template 1:1.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { RolesAPI, type ApiRole } from "@/lib/api/dashboard"
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
const initials = (name: string) => (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function RolesAdminRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["roles-admin-redesigned"],
    queryFn: () => RolesAPI.getAll(),
  })

  const rows = data ?? []
  const roles = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.name, r.description, r.type].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [rows, search])

  const countByType = (t: string) =>
    rows.filter((r) => (r.type ?? "").toLowerCase() === t).length
  const adminRoles = countByType("admin")
  const vendorRoles = countByType("vendor")
  const userRoles = countByType("user")

  const columns: Column<ApiRole>[] = [
    {
      key: "name",
      header: "Role",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(r.name)}</span>
          <span className="font-medium">{r.name || "—"}</span>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (r) => <StatusPill tone="neutral">{cap(r.type)}</StatusPill> },
    {
      key: "description",
      header: "Description",
      cellClassName: "text-muted-foreground",
      render: (r) => (
        <span className="block max-w-[20rem] truncate" title={r.description ?? ""}>{r.description || "—"}</span>
      ),
    },
    { key: "members", header: "Members", align: "right", cellClassName: "tabular-nums", render: (r) => r.users?.length ?? 0 },
    { key: "created", header: "Created", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.createdAt) },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Roles & permissions"
        description="Access roles and the members assigned to them — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> New role</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total roles" value={rows.length} icon="ShieldCheck" />
        <StatCard label="Admin roles" value={adminRoles} icon="Users" />
        <StatCard label="Vendor roles" value={vendorRoles} icon="Building2" />
        <StatCard label="User roles" value={userRoles} icon="Star" />
      </div>

      <DataTable
        columns={columns}
        data={roles}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load roles." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "ShieldCheck",
          title: "No roles yet",
          description: "Create roles to group permissions and assign them to your team members.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> New role</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu rows={roles} filename="roles" columns={[
                { header: "Role", value: (r) => r.name ?? "" },
                { header: "Type", value: (r) => r.type ?? "" },
                { header: "Description", value: (r) => r.description ?? "" },
                { header: "Members", value: (r) => r.users?.length ?? 0 },
                { header: "Created", value: (r) => fmtDate(r.createdAt) },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(r.name)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name || "—"}</div>
                <div className="text-xs text-muted-foreground">{cap(r.type)} · {r.users?.length ?? 0} members</div>
              </div>
            </div>
            <StatusPill tone="neutral">{cap(r.type)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default RolesAdminRedesignedView

"use client"

/**
 * Suppliers — redesigned (Track C). Wired to SupplierAPI.list(); rendered through
 * the primitives. Read-only; original screen untouched. Route /dashboard/suppliers-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { SupplierAPI, type Supplier } from "@/lib/api/suppliers"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const initials = (name: string) => (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

export function SuppliersRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["suppliers-redesigned"],
    queryFn: () => SupplierAPI.list(),
  })

  const all = data?.suppliers ?? []
  const suppliers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((s) => [s.name, s.contactPerson, s.phoneNumber, s.category].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const active = all.filter((s) => s.isActive).length
  const categories = new Set(all.map((s) => s.category).filter(Boolean)).size
  const creditTotal = all.reduce((s, x) => s + num(x.creditLimit), 0)

  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: "Supplier",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(s.name)}</span>
          <span className="font-medium">{s.name}</span>
        </div>
      ),
    },
    { key: "category", header: "Category", cellClassName: "text-muted-foreground", render: (s) => cap(s.category) },
    { key: "contact", header: "Contact", cellClassName: "text-muted-foreground", render: (s) => s.contactPerson || "—" },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (s) => s.phoneNumber || "—" },
    { key: "credit", header: "Credit limit", align: "right", render: (s) => <MoneyCell amount={s.creditLimit != null ? num(s.creditLimit) : null} tone="muted" /> },
    { key: "status", header: "Status", render: (s) => <StatusPill tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Inactive"}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Suppliers"
        description="Your vendor network and credit terms — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add supplier</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total suppliers" value={all.length} icon="Building2" />
        <StatCard label="Active" value={active} icon="ShieldCheck" trend="up" />
        <StatCard label="Categories" value={categories} icon="LayoutGrid" />
        <StatCard label="Credit available" value={creditTotal ? formatPkr(creditTotal) : "—"} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        getRowId={(s) => String(s.id)}
        loading={isLoading}
        error={isError ? "Couldn't load suppliers." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Building2",
          title: "No suppliers yet",
          description: "Add the vendors you buy from — albums, frames, props — to track credit and invoices.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add supplier</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(s) => String(s.id)} rows={suppliers} filename="suppliers" columns={[
                { header: "Supplier", value: (s) => s.name },
                { header: "Category", value: (s) => s.category ?? "" },
                { header: "Contact", value: (s) => s.contactPerson ?? "" },
                { header: "Phone", value: (s) => s.phoneNumber ?? "" },
                { header: "Credit limit", value: (s) => (s.creditLimit != null ? num(s.creditLimit) : 0) },
                { header: "Active", value: (s) => (s.isActive ? "Yes" : "No") },
              ]} />
            </div>
          </>
        }
        renderCard={(s) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(s.name)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{cap(s.category)} · {s.phoneNumber || "no phone"}</div>
              </div>
            </div>
            <StatusPill tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Inactive"}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default SuppliersRedesignedView

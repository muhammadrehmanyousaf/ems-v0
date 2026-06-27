"use client"

/**
 * Inventory — redesigned (Track C). Wired to InventoryAPI.listItems(); rendered
 * through the primitives. Read-only presentation; original screen untouched.
 * Route /dashboard/inventory-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { InventoryAPI, type InventoryItem } from "@/lib/api/inventory"
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
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

const stockState = (it: InventoryItem): { tone: StatusTone; label: string } => {
  const stock = num(it.currentStock)
  const thr = num(it.lowStockThreshold)
  if (stock <= 0) return { tone: "error", label: "Out of stock" }
  if (stock <= thr) return { tone: "warning", label: "Low stock" }
  return { tone: "success", label: "In stock" }
}

export function InventoryRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory-redesigned"],
    queryFn: () => InventoryAPI.listItems(),
  })

  const all = data?.items ?? []
  const items = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((i) => [i.name, i.sku, i.category].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const lowCount = all.filter((i) => num(i.currentStock) <= num(i.lowStockThreshold)).length
  const stockValue = all.reduce((s, i) => s + num(i.currentStock) * num(i.lastRestockCostPerUnit), 0)
  const categories = new Set(all.map((i) => i.category)).size

  const columns: Column<InventoryItem>[] = [
    { key: "name", header: "Item", render: (i) => <span className="font-medium">{i.name}</span> },
    { key: "sku", header: "SKU", cellClassName: "text-muted-foreground", render: (i) => i.sku || "—" },
    { key: "category", header: "Category", cellClassName: "text-muted-foreground", render: (i) => cap(i.category) },
    { key: "stock", header: "Stock", align: "right", render: (i) => <span className="tabular-nums">{num(i.currentStock)} <span className="text-muted-foreground">{String(i.unit)}</span></span> },
    { key: "cost", header: "Last cost / unit", align: "right", render: (i) => <MoneyCell amount={i.lastRestockCostPerUnit != null ? num(i.lastRestockCostPerUnit) : null} tone="muted" /> },
    { key: "status", header: "Status", render: (i) => { const s = stockState(i); return <StatusPill tone={s.tone}>{s.label}</StatusPill> } },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Inventory"
        description="Gear, props and consumables — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add item</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total items" value={all.length} icon="Package" />
        <StatCard label="Low / out of stock" value={lowCount} icon="AlertTriangle" trend={lowCount ? "down" : "flat"} delta={lowCount ? "reorder" : "all good"} />
        <StatCard label="Stock value" value={formatPkr(Math.round(stockValue))} icon="Wallet" />
        <StatCard label="Categories" value={categories} icon="LayoutGrid" />
      </div>

      <DataTable
        columns={columns}
        data={items}
        getRowId={(i) => String(i.id)}
        loading={isLoading}
        error={isError ? "Couldn't load inventory." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={() => <Button size="sm" variant="outline">Export selected</Button>}
        empty={{
          icon: "Package",
          title: "No inventory yet",
          description: "Track your gear, props and consumables so you never run short on a shoot day.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add item</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu rows={items} filename="inventory" columns={[
                { header: "Item", value: (i) => i.name },
                { header: "SKU", value: (i) => i.sku ?? "" },
                { header: "Category", value: (i) => i.category },
                { header: "Stock", value: (i) => num(i.currentStock) },
                { header: "Unit", value: (i) => String(i.unit) },
                { header: "Last cost", value: (i) => (i.lastRestockCostPerUnit != null ? num(i.lastRestockCostPerUnit) : 0) },
              ]} />
            </div>
          </>
        }
        renderCard={(i) => {
          const s = stockState(i)
          return (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{i.name}</div>
                <div className="text-xs text-muted-foreground">{cap(i.category)} · {num(i.currentStock)} {String(i.unit)}</div>
                <div className="mt-1"><StatusPill tone={s.tone}>{s.label}</StatusPill></div>
              </div>
              <MoneyCell amount={i.lastRestockCostPerUnit != null ? num(i.lastRestockCostPerUnit) : null} tone="muted" className="text-sm" />
            </div>
          )
        }}
      />
    </div>
  )
}

export default InventoryRedesignedView

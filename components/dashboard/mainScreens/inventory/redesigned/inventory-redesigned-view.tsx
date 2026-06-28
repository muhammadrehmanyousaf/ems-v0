"use client"

/**
 * Inventory — redesigned (Track C). Wired to InventoryAPI.listItems(); rendered
 * through the primitives. Read-only presentation; original screen untouched.
 * Route /dashboard/inventory-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { InventoryAPI, type InventoryItem } from "@/lib/api/inventory"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { InventoryFormDialog } from "@/components/dashboard/mainScreens/inventory/redesigned/inventory-form-dialog"
import { InventoryMovementDialog } from "@/components/dashboard/mainScreens/inventory/redesigned/inventory-movement-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
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
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<InventoryItem | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<InventoryItem | null>(null)
  const [moving, setMoving] = React.useState<InventoryItem | undefined>(undefined)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory-redesigned"],
    queryFn: () => InventoryAPI.listItems(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  const businessId = businesses?.[0]?.id

  const invalidate = () => qc.invalidateQueries({ queryKey: ["inventory-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (i: InventoryItem) => { setEditing(i); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => InventoryAPI.removeItem(id),
    onSuccess: () => { showSuccessToast("Item removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove item (stock must be zero first)"),
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
    {
      key: "actions", header: "", align: "right",
      render: (i) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => setMoving(i)} aria-label="Adjust stock"><Icon name="RefreshCw" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(i)} aria-label="Edit item"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(i)} aria-label="Remove item"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Inventory"
        description="Gear, props and consumables — redesigned, wired to live data."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add item</Button>}
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
        empty={{
          icon: "Package",
          title: "No inventory yet",
          description: "Track your gear, props and consumables so you never run short on a shoot day.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add item</Button>,
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
              <ExportMenu selectedIds={selected} getRowId={(i) => String(i.id)} rows={items} filename="inventory" columns={[
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

      <InventoryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} businessId={businessId} onSaved={invalidate} />
      <InventoryMovementDialog open={!!moving} onOpenChange={(v) => !v && setMoving(undefined)} item={moving} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this item?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.name} will be removed from inventory. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && removeMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default InventoryRedesignedView

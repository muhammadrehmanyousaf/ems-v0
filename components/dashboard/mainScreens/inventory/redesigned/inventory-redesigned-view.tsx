"use client"

/**
 * Inventory — redesigned (Track C). Wired to InventoryAPI.listItems(); rendered
 * through the primitives. Read-only presentation; 
 * Route /dashboard/inventory.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useRecordBusinessId } from "@/hooks/use-record-business-id"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { InventoryAPI, INVENTORY_CATEGORY_LABELS, type InventoryItem, type InventoryCategory } from "@/lib/api/inventory"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { InventoryFormDialog } from "@/components/dashboard/mainScreens/inventory/redesigned/inventory-form-dialog"
import { InventoryMovementDialog } from "@/components/dashboard/mainScreens/inventory/redesigned/inventory-movement-dialog"
import { InventoryHistoryDialog } from "@/components/dashboard/mainScreens/inventory/redesigned/inventory-history-dialog"
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
import { DestructiveConfirm } from "@/components/dashboard/primitives/destructive-confirm"

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
  // WWL-248 — the read side of the audit trail, reachable from any row.
  const [history, setHistory] = React.useState<InventoryItem | undefined>(undefined)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory-redesigned"],
    queryFn: () => InventoryAPI.listItems(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  /**
   * WWL-293/311/332/350 — this was `businesses?.[0]?.id`, so under "All venues"
   * a new record landed on whichever venue happened to be first in the array,
   * silently. The hook returns undefined rather than guessing when there is no
   * right answer; the create dialog then asks.
   */
  const businessId = useRecordBusinessId()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["inventory-redesigned"] })
    // WWL-248 — a movement that just landed must appear in the history the
    // vendor opens next, not the version cached before they recorded it.
    qc.invalidateQueries({ queryKey: ["inventory-movements"] })
  }
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (i: InventoryItem) => { setEditing(i); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => InventoryAPI.removeItem(id),
    onSuccess: () => { showSuccessToast("Item removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't remove item (stock must be zero first)")),
  })

  /** WWL-258 — "show me only what needs reordering", from the card that counts it. */
  const [lowOnly, setLowOnly] = React.useState(false)

  const all = data?.items ?? []
  const items = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = lowOnly
      ? all.filter((i) => num(i.currentStock) <= num(i.lowStockThreshold))
      : all
    if (!q) return base
    /**
     * WWL-251 — the client filter matched name, sku and category; the BACKEND
     * search matches name, sku and `defaultSupplierName`. So searching
     * "Bismillah" — a supplier on six live rows — returned 0 rows and the "No
     * inventory yet" empty state, on data that carries the name. The field was
     * also displayed nowhere: not a column, not on the card, not in the export.
     */
    return base.filter((i) =>
      [i.name, i.sku, i.category, i.defaultSupplierName].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search, lowOnly])

  /**
   * WWL-249 — the stat cards ignored the search, so filtering the list left
   * "Total items" and "Stock value" describing stock the vendor could not see.
   */
  const filtering = search.trim().length > 0 || lowOnly
  const scope = items
  const scopeNote = filtering ? `of ${all.length} total` : undefined
  const lowCount = scope.filter((i) => num(i.currentStock) <= num(i.lowStockThreshold)).length
  const stockValue = scope.reduce((s, i) => s + num(i.currentStock) * num(i.lastRestockCostPerUnit), 0)
  const categories = new Set(scope.map((i) => i.category)).size

  const columns: Column<InventoryItem>[] = [
    { key: "name", header: "Item", render: (i) => <span className="font-medium">{i.name}</span> },
    /* WWL-258 — SKU is null on all 36 rows, so this column rendered an em dash
       36 times and exported empty. Dropped when nothing has one, and the
       supplier — searchable server-side, shown nowhere — takes the space. */
    ...(all.some((i) => (i.sku ?? "").trim())
      ? [{ key: "sku", header: "SKU", cellClassName: "text-muted-foreground", render: (i: InventoryItem) => i.sku || "—" } as Column<InventoryItem>]
      : []),
    {
      key: "supplier", header: "Supplier", cellClassName: "text-muted-foreground",
      render: (i) => i.defaultSupplierName || "—",
    },
    /* WWL-255 — one field, three renderings: `rental` was "Rental" in the
       table (from a generic capitaliser), "Rental fleet" in the dialog
       dropdown, and "rental" in the export. The label map is the product's own
       answer; every surface uses it now. */
    {
      key: "category", header: "Category", cellClassName: "text-muted-foreground",
      render: (i) => INVENTORY_CATEGORY_LABELS[i.category as InventoryCategory] ?? cap(i.category),
    },
    { key: "stock", header: "Stock", align: "right", render: (i) => <span className="tabular-nums">{num(i.currentStock)} <span className="text-muted-foreground">{String(i.unit)}</span></span> },
    { key: "cost", header: "Last cost / unit", align: "right", render: (i) => <MoneyCell amount={i.lastRestockCostPerUnit != null ? num(i.lastRestockCostPerUnit) : null} tone="muted" /> },
    { key: "status", header: "Status", render: (i) => { const s = stockState(i); return <StatusPill tone={s.tone}>{s.label}</StatusPill> } },
    {
      key: "actions", header: "", align: "right",
      render: (i) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => setHistory(i)} aria-label={`Stock history for ${i.name}`}><Icon name="Clock" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setMoving(i)} aria-label={`Adjust stock for ${i.name}`}><Icon name="RefreshCw" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(i)} aria-label={`Edit ${i.name}`}><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(i)} aria-label={`Remove ${i.name}`}><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Inventory"
        description="Gear, props and consumables."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add item</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/**
          * WWL-259 — with the items request pointed at an unroutable host the
          * table correctly said "Couldn't load inventory." with a working
          * Retry, and the four cards above it read: Total items 0 · Low / out
          * of stock 0 "all good" · Stock value Rs 0 · Categories 0. A vendor
          * glancing at the header during an outage saw an empty, healthy stock
          * book. Only the money card carried `error`; the other three rendered
          * zeros where they should render an unknown.
          *
          * "all good" is the worst of them: it is a reassurance, asserted from
          * no data at all.
          */}
        <StatCard label={filtering ? "Items (filtered)" : "Total items"} value={scope.length} icon="Package" delta={scopeNote} error={isError} />
        <StatCard
          label="Low / out of stock"
          value={lowCount}
          icon="AlertTriangle"
          trend={isError ? undefined : lowCount ? "down" : "flat"}
          delta={isError ? undefined : lowCount ? "reorder" : "all good"}
          error={isError}
          /* WWL-258 — the API supports `lowStockOnly=true` and no control in
             the product reached it; the card that names the number was the
             obvious one. */
          onClick={!isError ? () => setLowOnly((v) => !v) : undefined}
        />
        <StatCard label={filtering ? "Stock value (filtered)" : "Stock value"} value={formatPkr(Math.round(stockValue))} icon="Wallet" error={isError} />
        <StatCard label="Categories" value={categories} icon="LayoutGrid" error={isError} />
      </div>

      <DataTable
        filterQuery={search || (lowOnly ? "low or out of stock" : "")}
        onClearFilter={() => { setSearch(""); setLowOnly(false) }}
        caption="Inventory"
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
          /* WWL-256 — "so you never run short on a shoot day" on an account
             whose stock is banquet chairs, chafing dishes, basmati rice and
             Dalda oil. Photographer copy shipped to every vendor type. */
          description: "Track your stock, equipment and consumables so you never run short on an event day.",
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
                { header: "Supplier", value: (i) => i.defaultSupplierName ?? "" },
                { header: "Category", value: (i) => INVENTORY_CATEGORY_LABELS[i.category as InventoryCategory] ?? i.category },
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
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{cap(i.category)} · {num(i.currentStock)} {String(i.unit)}</div>
                  <div className="mt-1"><StatusPill tone={s.tone}>{s.label}</StatusPill></div>
                </div>
                <MoneyCell amount={i.lastRestockCostPerUnit != null ? num(i.lastRestockCostPerUnit) : null} tone="muted" className="text-sm" />
              </div>
              {/* WWL-244 — this card emitted no buttons, and the table it
                  replaces is `hidden md:block`. Adjust stock is the only path
                  that can change a count, so on a phone the module's entire
                  purpose was unreachable: 108 action buttons in the DOM, 0
                  visible. Full-width targets, comfortably over the 24px
                  WCAG 2.2 minimum. */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Button size="sm" variant="secondary" className="h-9 flex-1 min-w-[7rem]" onClick={() => setMoving(i)}>
                  <Icon name="RefreshCw" size={14} className="mr-1.5" /> Adjust stock
                </Button>
                <Button size="sm" variant="outline" className="h-9 flex-1 min-w-[5rem]" onClick={() => openEdit(i)}>
                  <Icon name="Pencil" size={14} className="mr-1.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="h-9 w-9 shrink-0 p-0" onClick={() => setHistory(i)} aria-label={`Stock history for ${i.name}`}>
                  <Icon name="Clock" size={15} className="text-muted-foreground" />
                </Button>
                <Button size="sm" variant="ghost" className="h-9 w-9 shrink-0 p-0" onClick={() => setDeleting(i)} aria-label={`Remove ${i.name}`}>
                  <Icon name="Trash2" size={15} className="text-muted-foreground" />
                </Button>
              </div>
            </div>
          )
        }}
      />

      <InventoryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} businessId={businessId} onSaved={invalidate} />
      <InventoryMovementDialog open={!!moving} onOpenChange={(v) => !v && setMoving(undefined)} item={moving} onSaved={invalidate} />
      <InventoryHistoryDialog open={!!history} onOpenChange={(v) => !v && setHistory(undefined)} item={history} />

      {/**
        * WWL-252 — this promised "Banquet Chairs will be removed from
        * inventory" for an item the server is guaranteed to refuse with a 409,
        * with the button styled destructive as though it would work. There was
        * no pre-check on `currentStock` at all.
        *
        * The rule is the backend's own: an item with stock cannot be deleted,
        * and its error message tells the vendor to zero it with an adjustment
        * first. That instruction is now the dialog's, given before the failure
        * rather than after it — and it points at the control that carries it
        * out, which is the Adjust stock dialog two buttons away.
        *
        * WWL-156 — "can't be undone" was also false: InventoryItem is
        * paranoid, and the movement ledger survives the delete.
        */}
      <DestructiveConfirm
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this item?"
        reversibility="soft"
        pending={removeMut.isPending}
        onConfirm={() => deleting && removeMut.mutate(deleting.id)}
        blockedReason={
          deleting && num(deleting.currentStock) !== 0
            ? `${deleting.name} still has ${num(deleting.currentStock)} ${String(deleting.unit)} in stock. Record a stock-take of 0 first (Adjust stock), then remove it — the server refuses to delete an item holding stock.`
            : null
        }
        fields={[
          { label: "Item", value: deleting?.name || "" },
          { label: "SKU", value: deleting?.sku || "" },
          { label: "Category", value: deleting ? cap(deleting.category) : "" },
          { label: "Stock", value: deleting ? `${num(deleting.currentStock)} ${String(deleting.unit)}` : "" },
          {
            label: "Last cost",
            value: deleting?.lastRestockCostPerUnit != null
              ? `${formatPkr(num(deleting.lastRestockCostPerUnit))} / ${String(deleting.unit)}`
              : "",
          },
        ]}
        consequence="Its movement history is kept, so the audit trail stays complete."
      />
    </div>
  )
}

export default InventoryRedesignedView

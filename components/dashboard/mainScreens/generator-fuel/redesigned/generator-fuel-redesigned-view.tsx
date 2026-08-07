"use client"

/**
 * Generator fuel log — redesigned (Track C). Wired to GeneratorFuelAPI.list();
 * rendered through the shared primitives. 
 * Route /dashboard/generator-fuel.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GeneratorFuelAPI, type FuelEntry, type EntryType } from "@/lib/api/generatorFuel"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { FuelEntryFormDialog } from "@/components/dashboard/mainScreens/generator-fuel/redesigned/fuel-entry-form-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { DestructiveConfirm } from "@/components/dashboard/primitives/destructive-confirm"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")

const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

const ENTRY_LABELS: Record<EntryType, string> = {
  delivery: "Delivery",
  consumption: "Consumption",
  tank_reading: "Tank reading",
  maintenance: "Maintenance",
}

const typeTone = (t?: EntryType | string | null): StatusTone => {
  switch (t) {
    case "delivery":
      return "success"
    case "tank_reading":
      return "info"
    case "maintenance":
      return "warning"
    case "consumption":
      return "neutral"
    default:
      return "neutral"
  }
}

const typeLabel = (t?: EntryType | string | null) =>
  (t && ENTRY_LABELS[t as EntryType]) || cap(t)

export function GeneratorFuelRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<FuelEntry | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<FuelEntry | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["generator-fuel-redesigned"],
    queryFn: () => GeneratorFuelAPI.list(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  const businessId = businesses?.[0]?.id

  /**
   * WWL-307 (S2) — tank status is computed on the server and was shown nowhere.
   * WWL-308 (S3) — the tank balance sits on every row and in no column.
   *
   * The one number a generator operator actually wants — how much diesel is in
   * each tank right now — was a request away and never asked for.
   */
  const tanksQ = useQuery({
    queryKey: ["generator-fuel-tanks", businessId],
    queryFn: () => GeneratorFuelAPI.tanks(businessId ? { businessId } : {}),
    enabled: businessId != null,
  })
  const tanks = tanksQ.data?.tanks ?? []
  const invalidate = () => qc.invalidateQueries({ queryKey: ["generator-fuel-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (e: FuelEntry) => { setEditing(e); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => GeneratorFuelAPI.remove(id),
    onSuccess: () => { showSuccessToast("Entry removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove entry"),
  })

  const all = data?.entries ?? []
  const entries = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((e) =>
      [e.generatorIdentifier, e.supplierName, e.fuelType].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  const deliveries = all.filter((e) => e.type === "delivery").length
  const deliveredLitres = all
    .filter((e) => e.type === "delivery")
    .reduce((sum, e) => sum + num(e.litres), 0)
  const totalCost = all.reduce((sum, e) => sum + num(e.totalCost), 0)

  const columns: Column<FuelEntry>[] = [
    {
      key: "generator",
      header: "Generator",
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon name="Zap" size={15} />
          </span>
          <span className="font-medium">{e.generatorIdentifier || "—"}</span>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (e) => <StatusPill tone={typeTone(e.type)}>{typeLabel(e.type)}</StatusPill> },
    { key: "fuel", header: "Fuel", cellClassName: "text-muted-foreground", render: (e) => cap(e.fuelType) },
    { key: "litres", header: "Litres", align: "right", cellClassName: "tabular-nums", render: (e) => num(e.litres).toLocaleString("en-PK") },
    { key: "cost", header: "Total cost", align: "right", render: (e) => <MoneyCell amount={e.totalCost == null ? null : num(e.totalCost)} /> },
    { key: "occurred", header: "Occurred", cellClassName: "text-muted-foreground", render: (e) => fmtDate(e.occurredAt) },
    {
      key: "actions", header: "", align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(e)} aria-label="Edit entry"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(e)} aria-label="Remove entry"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Compliance"
        title="Generator fuel"
        description="Deliveries, consumption and tank readings."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Log entry</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total entries" value={all.length} icon="FileText" />
        <StatCard label="Deliveries" value={deliveries} icon="Package" trend="up" />
        <StatCard label="Delivered litres" value={deliveredLitres.toLocaleString("en-PK")} icon="Gauge" />
        <StatCard label="Total cost" value={formatPkr(totalCost)} icon="Wallet" error={isError} />
      </div>

      {/* WWL-307 / WWL-308 — what is actually in the tanks, per generator. */}
      {tanks.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">In the tanks now</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {tanks.map((t) => (
              <div key={t.identifier} className="rounded-lg border border-border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{t.identifier}</span>
                  <span className="text-xs uppercase text-muted-foreground">{t.fuelType}</span>
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {Number(t.currentTankLitres || 0).toLocaleString("en-PK")}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">litres</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  last reading {fmtDate(t.lastReadingAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Generator fuel log"
        columns={columns}
        data={entries}
        getRowId={(e) => String(e.id)}
        loading={isLoading}
        error={isError ? "Couldn't load fuel log." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Package",
          title: "No fuel entries yet",
          description: "Log generator deliveries, consumption and tank readings to track fuel and cost.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Log entry</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fuel log…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(e) => String(e.id)} rows={entries} filename="generator-fuel" columns={[
                { header: "Generator", value: (e) => e.generatorIdentifier ?? "" },
                { header: "Type", value: (e) => typeLabel(e.type) },
                { header: "Fuel", value: (e) => e.fuelType ?? "" },
                { header: "Litres", value: (e) => num(e.litres) },
                { header: "Cost per litre", value: (e) => num(e.costPerLitre) },
                { header: "Total cost", value: (e) => num(e.totalCost) },
                { header: "Supplier", value: (e) => e.supplierName ?? "" },
                { header: "Occurred at", value: (e) => e.occurredAt ?? "" },
              ]} />
            </div>
          </>
        }
        renderCard={(e) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon name="Zap" size={15} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{e.generatorIdentifier || "—"}</div>
                <div className="text-xs text-muted-foreground">{cap(e.fuelType)} · {num(e.litres).toLocaleString("en-PK")} L · {e.totalCost == null ? "—" : formatPkr(num(e.totalCost))}</div>
              </div>
            </div>
            <StatusPill tone={typeTone(e.type)}>{typeLabel(e.type)}</StatusPill>
          </div>
        )}
      />

      <FuelEntryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} businessId={businessId} onSaved={invalidate} />

      {/* WWL-316 — "This fuel entry will be removed" named no generator, date,
          litres or cost, on a destructive action against an audit record. */}
      <DestructiveConfirm
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this fuel entry?"
        reversibility="soft"
        pending={removeMut.isPending}
        onConfirm={() => deleting && removeMut.mutate(deleting.id)}
        fields={[
          { label: "Generator", value: deleting?.generatorIdentifier || "" },
          { label: "Type", value: deleting ? typeLabel(deleting.type) : "" },
          { label: "Litres", value: deleting ? `${Number(deleting.litres) || 0} L` : "" },
          { label: "Cost", value: deleting?.totalCost != null ? formatPkr(Number(deleting.totalCost) || 0) : "" },
          { label: "Supplier", value: deleting?.supplierName || "" },
          { label: "When", value: deleting ? fmtDate(deleting.occurredAt) : "" },
          { label: "Tank", value: deleting ? `${Number(deleting.tankBeforeLitres) || 0} → ${Number(deleting.tankAfterLitres) || 0} L` : "" },
        ]}
        consequence="The tank readings recorded either side of this entry stay as they are, so the running tank level will no longer add up across the log."
      />
    </div>
  )
}

export default GeneratorFuelRedesignedView

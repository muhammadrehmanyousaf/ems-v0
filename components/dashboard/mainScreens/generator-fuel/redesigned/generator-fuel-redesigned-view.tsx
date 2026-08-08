"use client"

/**
 * Generator fuel log — redesigned (Track C). Wired to GeneratorFuelAPI.list();
 * rendered through the shared primitives. 
 * Route /dashboard/generator-fuel.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useRecordBusinessId } from "@/hooks/use-record-business-id"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
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
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
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

  /**
   * WWL-310 — `list()` accepts `type`, `from`, `to` and `generatorIdentifier`,
   * and the toolbar offered a client-side text search and nothing else. So a
   * log whose whole purpose is PERIOD reconciliation had no date range, and a
   * venue running several sets had no per-generator filter. Four filters the
   * server implements, none of them reachable.
   */
  const [typeFilter, setTypeFilter] = React.useState<EntryType | "">("")
  const [genFilter, setGenFilter] = React.useState("")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")

  const serverFilters = React.useMemo(
    () => ({
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(genFilter ? { generatorIdentifier: genFilter } : {}),
      ...(fromDate ? { from: fromDate } : {}),
      ...(toDate ? { to: toDate } : {}),
    }),
    [typeFilter, genFilter, fromDate, toDate],
  )

  const { data, isLoading, isError, refetch } = useQuery({
    // The filters are part of the key: the summary above is computed by the
    // server ACROSS the filtered set, so a stale entry would describe a
    // different period than the rows beneath it.
    queryKey: ["generator-fuel-redesigned", serverFilters],
    queryFn: () => GeneratorFuelAPI.list(serverFilters),
    placeholderData: (prev) => prev,
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  /**
   * WWL-293/311/332/350 — this was `businesses?.[0]?.id`, so under "All venues"
   * a new record landed on whichever venue happened to be first in the array,
   * silently. The hook returns undefined rather than guessing when there is no
   * right answer; the create dialog then asks.
   */
  const businessId = useRecordBusinessId()
  const activeBusinessId = useActiveBusinessId()

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
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't remove entry")),
  })

  const all = data?.entries ?? []
  const entries = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((e) =>
      [e.generatorIdentifier, e.supplierName, e.fuelType].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  /**
   * WWL-309 — the API returns
   * `summary: {byType, totalDeliveredLitres, totalDeliveryCost, totalConsumedLitres}`
   * and this screen ignored it, recomputing three of those from `entries` — so
   * the headline described only the page it had, not the filtered set the
   * server had aggregated.
   *
   * More consequentially there was NO consumed-litres card beside Delivered.
   * Bought against burned is the entire reconciliation a fuel log exists to
   * make, and it could not be done on this screen at all. The server has been
   * computing it the whole time.
   */
  /** Every generator the log has seen, for the per-set filter (WWL-310). */
  const generatorOptions = React.useMemo(
    () => Array.from(new Set(all.map((e) => e.generatorIdentifier).filter(Boolean) as string[])).sort(),
    [all],
  )

  const summary = data?.summary
  const deliveries = summary?.byType?.delivery ?? all.filter((e) => e.type === "delivery").length
  const deliveredLitres = summary?.totalDeliveredLitres
    ?? all.filter((e) => e.type === "delivery").reduce((sum, e) => sum + num(e.litres), 0)
  const consumedLitres = summary?.totalConsumedLitres ?? 0
  const totalCost = summary?.totalDeliveryCost ?? all.reduce((sum, e) => sum + num(e.totalCost), 0)
  const unaccounted = deliveredLitres - consumedLitres

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
    /**
     * WWL-314 — `num(e.litres)` coerced null to 0, so a tank-reading or
     * maintenance row with no litres read "0" — a measurement — rather than
     * "not applicable". The Total cost column beside it already got this right.
     */
    { key: "litres", header: "Litres", align: "right", cellClassName: "tabular-nums", render: (e) => (e.litres == null ? <span className="text-muted-foreground">—</span> : num(e.litres).toLocaleString("en-PK")) },
    /**
     * WWL-313 — cost per litre and supplier were captured by the form and
     * exported to CSV, and neither was a column. The search matches
     * `supplierName`, so searching a supplier filtered the log down to rows
     * that never showed which supplier they came from.
     */
    { key: "perLitre", header: "Rs / litre", align: "right", render: (e) => <MoneyCell amount={e.costPerLitre == null ? null : num(e.costPerLitre)} tone="muted" /> },
    { key: "cost", header: "Total cost", align: "right", render: (e) => <MoneyCell amount={e.totalCost == null ? null : num(e.totalCost)} /> },
    { key: "supplier", header: "Supplier", cellClassName: "text-muted-foreground", render: (e) => e.supplierName || "—" },
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

      {/* WWL-306 */}
      <BurnRatePanel businessId={activeBusinessId} generators={generatorOptions} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total entries" value={all.length} icon="FileText" error={isError} />
        <StatCard
          label="Delivered litres"
          value={deliveredLitres.toLocaleString("en-PK")}
          delta={`${deliveries} deliver${deliveries === 1 ? "y" : "ies"}`}
          icon="Gauge"
          error={isError}
        />
        {/* WWL-309 — the other half of the reconciliation. */}
        <StatCard
          label="Consumed litres"
          value={consumedLitres.toLocaleString("en-PK")}
          delta={
            deliveredLitres > 0
              ? `${unaccounted >= 0 ? "" : "-"}${Math.abs(unaccounted).toLocaleString("en-PK")} L ${unaccounted >= 0 ? "still in tank / unlogged" : "more burned than bought"}`
              : undefined
          }
          icon="Gauge"
          error={isError}
        />
        <StatCard label="Delivery cost" value={formatPkr(totalCost)} icon="Wallet" error={isError} />
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
            {/* WWL-310 — the four the server has always supported. */}
            <label className="sr-only" htmlFor="fuel-type">Entry type</label>
            <select
              id="fuel-type" value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EntryType | "")}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2"
            >
              <option value="">All types</option>
              {(Object.keys(ENTRY_LABELS) as EntryType[]).map((t) => (
                <option key={t} value={t}>{ENTRY_LABELS[t]}</option>
              ))}
            </select>
            {generatorOptions.length > 0 && (
              <>
                <label className="sr-only" htmlFor="fuel-gen">Generator</label>
                <select
                  id="fuel-gen" value={genFilter} onChange={(e) => setGenFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2"
                >
                  <option value="">All generators</option>
                  {generatorOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </>
            )}
            <label className="sr-only" htmlFor="fuel-from">From date</label>
            <input
              id="fuel-from" type="date" value={fromDate} max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2"
            />
            <label className="sr-only" htmlFor="fuel-to">To date</label>
            <input
              id="fuel-to" type="date" value={toDate} min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2"
            />
            {(typeFilter || genFilter || fromDate || toDate) && (
              <Button size="sm" variant="ghost" onClick={() => { setTypeFilter(""); setGenFilter(""); setFromDate(""); setToDate("") }}>
                Clear
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              {/* WWL-319 — the control sat there on an empty log and would
                  have produced a header-only file. */}
              {entries.length > 0 && (
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
              )}
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
                {/* WWL-313/314 — same fields as the table, same null handling. */}
                <div className="text-xs text-muted-foreground">
                  {cap(e.fuelType)} · {e.litres == null ? "—" : `${num(e.litres).toLocaleString("en-PK")} L`} · {e.totalCost == null ? "—" : formatPkr(num(e.totalCost))}
                </div>
                {e.supplierName && <div className="truncate text-xs text-muted-foreground">from {e.supplierName}</div>}
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


/**
 * WWL-306 — `GET /generator-fuel/burn-rate` is not flag-gated and not a stub.
 * Probed live it answers **400 "Invalid from"** with no params and **400 "Need
 * readings on both sides of the window"** with a full valid-looking query —
 * both precise, domain-correct refusals from a working engine that understands
 * it cannot interpolate a burn rate without a tank reading at each end.
 *
 * And nothing in the product called it. A venue owner's most-asked generator
 * question — "how much diesel does this set actually burn an hour?" — was
 * answerable by the server and unaskable from the app.
 *
 * The panel is deliberately small: two dates, a generator and the hours it ran.
 * The engine's own refusals are surfaced verbatim, because "need readings on
 * both sides of the window" tells the vendor exactly what to log next.
 */
function BurnRatePanel({
  businessId, generators,
}: { businessId: number | null; generators: string[] }) {
  const [gen, setGen] = React.useState("")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [hours, setHours] = React.useState("")

  const run = useMutation({
    mutationFn: () =>
      GeneratorFuelAPI.burnRate({
        ...(businessId ? { businessId } : {}),
        generatorIdentifier: gen,
        from,
        to,
        runHours: Number(hours),
      }),
    onError: (e: unknown) => toast.error(errorMessage(e, "Couldn't work out the burn rate.")),
  })

  const ready = !!gen && !!from && !!to && Number(hours) > 0 && from <= to
  const res = run.data?.result

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">How much is this set burning?</h2>
      <p className="text-xs text-muted-foreground">
        Litres per running hour between two tank readings. Needs a tank reading logged at both ends of
        the period.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted-foreground">
          <span className="block">Generator</span>
          {generators.length > 0 ? (
            <select value={gen} onChange={(e) => setGen(e.target.value)}
              className="mt-1 h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2">
              <option value="">Pick one…</option>
              {generators.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          ) : (
            <input value={gen} onChange={(e) => setGen(e.target.value)} placeholder="e.g. 25 KVA #1"
              className="mt-1 h-9 w-40 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2" />
          )}
        </label>
        <label className="text-xs text-muted-foreground">
          <span className="block">From</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)}
            className="mt-1 h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2" />
        </label>
        <label className="text-xs text-muted-foreground">
          <span className="block">To</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)}
            className="mt-1 h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2" />
        </label>
        <label className="text-xs text-muted-foreground">
          <span className="block">Hours it ran</span>
          <input type="number" min={1} step={1} inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)}
            className="mt-1 h-9 w-28 rounded-md border border-input bg-background px-2 text-sm tabular-nums outline-none ring-ring focus-visible:ring-2" />
        </label>
        <Button size="sm" disabled={!ready || run.isPending} onClick={() => run.mutate()}>
          {run.isPending ? <><Spinner size={14} className="mr-1.5" /> Working…</> : "Work it out"}
        </Button>
      </div>

      {res && (
        res.ok ? (
          <p className="mt-3 rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <span className="font-semibold tabular-nums">{res.ratePerHour?.toLocaleString("en-PK")} litres/hour</span>
            {res.burnLitres != null && (
              <span className="text-muted-foreground"> · {res.burnLitres.toLocaleString("en-PK")} L burned over {hours} hours</span>
            )}
          </p>
        ) : (
          <p className="mt-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
            {res.reason || "Not enough readings in that window to work this out."}
          </p>
        )
      )}
    </section>
  )
}

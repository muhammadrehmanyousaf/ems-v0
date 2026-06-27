"use client"

/**
 * Trade-operations HUB (redesigned, Track C — generic config-driven editor).
 * One renderer for every wedding trade's operational plan. Reads the trade
 * registry (lib/dashboard/trade-ops-config.ts); each trade maps to one
 * function-sheet JSON column = { [section.key]: Row[] }. A trade switcher lets
 * a multi-service vendor edit any trade; the active trade's whole jsonField is
 * saved via FunctionSheetAPI.update (the same proven path as the bespoke
 * Photography editor). Per-trade dirty tracking. Route /dashboard/trade-ops-new
 * (optionally ?trade=kitchen&id=6). Loads the latest sheet (or ?id=).
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FunctionSheetAPI, type FunctionSheet } from "@/lib/api/functionSheets"
import { TRADE_OPS, getTrade, type TradeOpsColumn } from "@/lib/dashboard/trade-ops-config"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { DetailSkeleton } from "@/components/dashboard/primitives/skeletons"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Row = Record<string, string | number>
// rows[tradeKey][sectionKey] = Row[]
type RowState = Record<string, Record<string, Row[]>>

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none ring-ring focus-visible:ring-2"
const spanStyle = (span: number) => ({ ["--gc" as any]: `span ${span} / span ${span}` } as React.CSSProperties)
const gcCell = "[grid-column:1/-1] sm:[grid-column:var(--gc)]"

function buildInitialState(sheet: FunctionSheet | null): RowState {
  const state: RowState = {}
  for (const t of TRADE_OPS) {
    const field = (sheet?.[t.jsonField as keyof FunctionSheet] || {}) as any
    state[t.trade] = {}
    for (const s of t.sections) state[t.trade][s.key] = Array.isArray(field?.[s.key]) ? field[s.key] : []
  }
  return state
}

export function TradeOperationsHubView() {
  const qc = useQueryClient()
  const { data: sheet, isLoading, isError } = useQuery<FunctionSheet | null>({
    queryKey: ["trade-ops-hub"],
    queryFn: async () => {
      const idParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null
      if (idParam) return FunctionSheetAPI.get(Number(idParam))
      const list = await FunctionSheetAPI.list()
      const first = list?.functionSheets?.[0]
      return first ? FunctionSheetAPI.get(first.id) : null
    },
  })

  const initialTrade = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("trade") : null
  const [active, setActive] = React.useState<string>(getTrade(initialTrade)?.trade ?? TRADE_OPS[0]?.trade ?? "")
  const [rows, setRows] = React.useState<RowState>({})
  const [dirty, setDirty] = React.useState<Set<string>>(new Set())
  const loadedId = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (sheet && loadedId.current !== sheet.id) {
      loadedId.current = sheet.id
      setRows(buildInitialState(sheet))
      setDirty(new Set())
    }
  }, [sheet])

  const trade = getTrade(active)
  const markDirty = (t: string) => setDirty((d) => (d.has(t) ? d : new Set(d).add(t)))

  const setCell = (sectionKey: string, i: number, colKey: string, v: string) => {
    setRows((prev) => ({ ...prev, [active]: { ...prev[active], [sectionKey]: prev[active][sectionKey].map((r, ix) => (ix === i ? { ...r, [colKey]: v } : r)) } }))
    markDirty(active)
  }
  const addRow = (sectionKey: string, cols: TradeOpsColumn[]) => {
    const blank: Row = Object.fromEntries(cols.map((c) => [c.key, c.type === "select" ? (c.options?.[0] ?? "") : ""]))
    setRows((prev) => ({ ...prev, [active]: { ...prev[active], [sectionKey]: [...(prev[active]?.[sectionKey] ?? []), blank] } }))
    markDirty(active)
  }
  const removeRow = (sectionKey: string, i: number) => {
    setRows((prev) => ({ ...prev, [active]: { ...prev[active], [sectionKey]: prev[active][sectionKey].filter((_, ix) => ix !== i) } }))
    markDirty(active)
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const t = trade!
      const obj: Record<string, Row[]> = {}
      for (const s of t.sections) obj[s.key] = (rows[active]?.[s.key] ?? []).map((r) => ({ ...r }))
      return FunctionSheetAPI.update(sheet!.id, { [t.jsonField]: obj } as any)
    },
    onSuccess: () => {
      showSuccessToast(`${trade?.label} saved`)
      setDirty((d) => { const n = new Set(d); n.delete(active); return n })
      qc.invalidateQueries({ queryKey: ["trade-ops-hub"] })
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  })

  if (!TRADE_OPS.length) return <div className="p-4 md:p-6"><EmptyState icon="ClipboardList" title="No trades configured" description="The trade operations registry is empty." /></div>
  if (isLoading) return <div className="p-4 md:p-6"><DetailSkeleton /></div>
  if (isError || !sheet) return <div className="p-4 md:p-6"><EmptyState icon="ClipboardList" title="No function sheet" description="Create a function sheet first to plan its operations." /></div>
  if (!trade) return null

  const totalRows = trade.sections.reduce((n, s) => n + (rows[active]?.[s.key]?.length ?? 0), 0)

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24">
      <PageHeader
        eyebrow="Operate · Trade operations"
        title="Trade operations"
        description="Per-trade operational plan for this function sheet — pick a trade and edit."
        breadcrumb={
          <a href="/dashboard/function-sheet-detail-new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Icon name="ChevronLeft" size={14} /> {sheet.title || "Function sheet"}
          </a>
        }
      />

      {/* Trade switcher */}
      <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Trades">
        {TRADE_OPS.map((t) => (
          <button
            key={t.trade}
            onClick={() => setActive(t.trade)}
            aria-current={active === t.trade}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              active === t.trade ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
            {dirty.has(t.trade) && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="unsaved" />}
          </button>
        ))}
      </nav>

      {/* Sections for the active trade */}
      {trade.sections.map((s) => {
        const sectionRows = rows[active]?.[s.key] ?? []
        return (
          <div key={s.key} className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name={s.icon} size={16} /></span>
              <div className="mr-auto"><h2 className="text-sm font-semibold">{s.label}</h2><p className="text-xs text-muted-foreground">{s.desc}</p></div>
              <Button size="sm" variant="outline" onClick={() => addRow(s.key, s.columns)}><Icon name="Plus" size={14} className="mr-1" /> {s.addLabel}</Button>
            </div>
            <div className="space-y-2 p-3">
              {sectionRows.length === 0 && <p className="px-1 py-3 text-sm text-muted-foreground">Nothing yet — {s.addLabel.toLowerCase()}.</p>}
              {/* desktop column header */}
              {sectionRows.length > 0 && (
                <div className="hidden grid-cols-12 gap-2 px-2 sm:grid">
                  {s.columns.map((c) => (
                    <div key={c.key} className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground" style={spanStyle(c.span)}>
                      <span className="sm:[grid-column:var(--gc)]">{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {sectionRows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-border/70 p-2">
                  {s.columns.map((c) => (
                    <div key={c.key} className={gcCell} style={spanStyle(c.span)}>
                      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">{c.label}</div>
                      <CellInput col={c} value={row[c.key]} onChange={(v) => setCell(s.key, i, c.key, v)} />
                    </div>
                  ))}
                  <button onClick={() => removeRow(s.key, i)} aria-label="Remove row" className="grid h-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-red-600 [grid-column:1/-1] sm:[grid-column:span_1/span_1]">
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur md:left-[var(--sidebar-width,0)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{trade.label}</span> · {totalRows} {totalRows === 1 ? "row" : "rows"}
            {dirty.has(active) && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Unsaved</span>}
          </div>
          <Button disabled={!dirty.has(active) || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save {trade.label.toLowerCase()}</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CellInput({ col, value, onChange }: { col: TradeOpsColumn; value: string | number | undefined; onChange: (v: string) => void }) {
  const v = value == null ? "" : String(value)
  if (col.type === "select") {
    return (
      <select className={inputCls} value={v} onChange={(e) => onChange(e.target.value)}>
        {!(col.options ?? []).includes(v) && <option value={v}>{v || "—"}</option>}
        {(col.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <input
      className={cn(inputCls, col.type === "number" && "text-right tabular-nums")}
      type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
      placeholder={col.placeholder || col.label}
      value={v}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default TradeOperationsHubView

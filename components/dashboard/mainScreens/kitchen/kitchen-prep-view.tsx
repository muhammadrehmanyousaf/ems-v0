"use client"

/**
 * Phase-4 — Kitchen Prep Sheet (KOT) screen (/dashboard/kitchen-prep).
 *
 * The caterer's event-day cook plan: pick the dishes on the menu + head counts,
 * and get how many DEGHS to cook per dish plus a CONSOLIDATED ingredient shopping
 * list (deghs × recipe × wastage), ready to print for the kitchen. Reuses the
 * already-built recipe BOMs. Self-hides when the kitchen-BOM engine is dark (404).
 */

import * as React from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { venueOsApi, type RecipeBom, type KitchenPrepSheet } from "@/lib/api/venueOs"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none ring-ring focus-visible:ring-2"
interface Row { dishName: string; guests: string }

export function KitchenPrepView() {
  const businessId = useActiveBusinessId()
  const [rows, setRows] = React.useState<Row[]>([{ dishName: "", guests: "" }])
  const [sheet, setSheet] = React.useState<KitchenPrepSheet | null>(null)
  const [eventLabel, setEventLabel] = React.useState("")

  const bomsQ = useQuery<RecipeBom[]>({
    queryKey: ["recipe-boms", businessId],
    queryFn: () => venueOsApi.listRecipeBoms(businessId as number),
    enabled: businessId != null,
    retry: false, // 404 when the engine is dark
  })
  const boms = bomsQ.data ?? []

  const setRow = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)))
  const addRow = () => setRows((r) => [...r, { dishName: "", guests: "" }])
  const removeRow = (i: number) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : r))

  const genMut = useMutation({
    mutationFn: () => {
      const dishes = rows
        .filter((r) => r.dishName.trim() && Number(r.guests) > 0)
        .map((r) => ({ dishName: r.dishName.trim(), guests: Number(r.guests) }))
      if (dishes.length === 0) throw new Error("Add at least one dish with a guest count")
      return venueOsApi.kitchenPrep(businessId as number, dishes)
    },
    onSuccess: (s) => setSheet(s),
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't build the prep sheet"),
  })

  // Total heads shown on the printed sheet is derived from the GENERATED sheet's
  // matched dishes — not the live builder rows — so it stays consistent with the
  // deghs on the page even if the user edits a row after generating.
  const sheetGuests = sheet ? sheet.dishes.reduce((s, d) => s + (Number(d.guests) || 0), 0) : 0

  if (bomsQ.isError) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <PageHeader eyebrow="Kitchen" title="Kitchen prep sheet" description="Turn the menu into deghs to cook and a shopping list." />
        <div className="mt-6 rounded-lg border p-6 text-center text-sm text-muted-foreground">The kitchen-BOM engine isn&apos;t enabled for your account yet.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Kitchen"
        title="Kitchen prep sheet"
        description="Pick the dishes and head counts — get deghs to cook and a consolidated shopping list."
        actions={sheet ? <Button variant="outline" onClick={() => window.print()} data-print-hide><Icon name="Printer" size={16} className="mr-1.5" /> Print</Button> : undefined}
      />

      {/* Builder (screen only) */}
      <div data-print-hide className="space-y-3 rounded-xl border bg-card p-4 print:hidden">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Event (optional)</label>
          <input className={cn(inputCls, "w-full")} value={eventLabel} onChange={(e) => setEventLabel(e.target.value)} placeholder="e.g. Khan Walima · 14 Feb" />
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <select className={cn(inputCls, "flex-1")} value={r.dishName} onChange={(e) => setRow(i, "dishName", e.target.value)}>
                <option value="">{boms.length ? "Pick a dish…" : "No recipes yet — add them in kitchen settings"}</option>
                {boms.map((b) => <option key={b.id} value={b.dishName}>{b.dishName}</option>)}
              </select>
              <input className={cn(inputCls, "w-28 tabular-nums")} type="number" inputMode="numeric" value={r.guests} onChange={(e) => setRow(i, "guests", e.target.value)} placeholder="guests" />
              <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => removeRow(i)} aria-label="Remove"><Icon name="Trash2" size={14} /></Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={addRow}><Icon name="Plus" size={14} className="mr-1" /> Add dish</Button>
          <Button size="sm" disabled={genMut.isPending} onClick={() => genMut.mutate()}>
            {genMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Building…</> : <>Generate prep sheet</>}
          </Button>
        </div>
      </div>

      {/* Print isolation: hide the dashboard chrome + [data-print-hide] controls so
          only the KOT sheet prints, black-on-white. Mirrors run-sheet-dialog. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          [data-print-hide] { display: none !important; }
          .kot-print, .kot-print * { visibility: visible !important; }
          .kot-print { position: absolute !important; left: 0; top: 0; width: 100%; border: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* Printable sheet */}
      {sheet && (
        <div className="kot-print rounded-xl border bg-white p-6 text-[13px] text-neutral-900 print:border-0 print:p-0">
          <header className="mb-4 border-b border-neutral-300 pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight">Kitchen Prep Sheet</h1>
              <span className="text-xs uppercase tracking-wider text-neutral-500">KOT · degh plan</span>
            </div>
            <div className="mt-1 text-[13px]">
              {eventLabel && <span className="font-medium">{eventLabel} · </span>}
              <span className="text-neutral-500">Total heads across dishes:</span> <span className="font-medium tabular-nums">{sheetGuests}</span>
            </div>
          </header>

          {sheet.unmatchedDishes.length > 0 && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              No recipe for: <b>{sheet.unmatchedDishes.join(", ")}</b> — add a recipe BOM so these are included.
            </div>
          )}

          <section className="mb-4 rs-group">
            <h2 className="mb-1 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-600">Cook (deghs per dish)</h2>
            <table className="w-full border-collapse">
              <tbody>
                {sheet.dishes.map((d, i) => (
                  <tr key={`${d.dishName}-${i}`} className="border-b border-neutral-100">
                    <td className="py-1 pr-2 font-medium">{d.dishName}{d.dishNameUr ? <span className="ml-1 text-neutral-400">· {d.dishNameUr}</span> : null}</td>
                    <td className="w-[70px] py-1 pr-2 text-right text-neutral-500 tabular-nums">{d.guests} heads</td>
                    <td className="w-[110px] py-1 text-right font-semibold tabular-nums">{d.deghs} × {d.batchLabel}</td>
                  </tr>
                ))}
                {sheet.dishes.length === 0 && <tr><td className="py-2 text-neutral-400">No matched dishes.</td></tr>}
              </tbody>
            </table>
          </section>

          <section className="rs-group">
            <h2 className="mb-1 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-600">Shopping list (all dishes, incl. wastage)</h2>
            <table className="w-full border-collapse">
              <tbody>
                {sheet.ingredients.map((ing) => (
                  <tr key={`${ing.itemId}-${ing.unit}`} className="border-b border-neutral-100">
                    <td className="py-1 pr-2">{ing.name}{ing.nameUr ? <span className="ml-1 text-neutral-400">· {ing.nameUr}</span> : null}</td>
                    <td className="w-[90px] py-1 pr-2 text-neutral-400">{ing.category || ""}</td>
                    <td className="w-[110px] py-1 text-right font-semibold tabular-nums">{ing.totalQty} {ing.unit}</td>
                  </tr>
                ))}
                {sheet.ingredients.length === 0 && <tr><td className="py-2 text-neutral-400">Nothing to buy.</td></tr>}
              </tbody>
            </table>
          </section>

          <footer className="mt-5 border-t border-neutral-300 pt-2 text-[10px] text-neutral-400">
            {sheet.dishes.length} dish(es) · {sheet.ingredients.length} ingredient(s) · Wedding Wala kitchen prep sheet
          </footer>
        </div>
      )}
    </div>
  )
}

export default KitchenPrepView

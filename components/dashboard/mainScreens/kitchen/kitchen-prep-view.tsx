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
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation } from "@tanstack/react-query"
import { venueOsApi, type RecipeBom, type KitchenPrepSheet } from "@/lib/api/venueOs"
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none ring-ring focus-visible:ring-2"
interface Row { dishName: string; guests: string }

/** Far past Pakistan's largest walima; a guard against a slipped keypress. */
const MAX_GUESTS = 100_000

export function KitchenPrepView() {
  // WWL-233 / F3 — the default venue scope produced a 500 because this sent
  // no businessId under "All venues". One scoping primitive.
  const [businessIdStr] = useBusinessIdField()
  const businessId = businessIdStr ? Number(businessIdStr) : null
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

  /**
   * WWL-241 — the builder survived a venue switch: a guest count typed at "All
   * venues" stayed put while the recipe list re-scoped underneath it, so once
   * recipes exist a dish chosen for one venue would remain selected against
   * another venue's list. The rows belong to a venue; when the venue changes
   * they are no longer about anything.
   */
  const loadedBusinessId = React.useRef<number | null | undefined>(undefined)
  React.useEffect(() => {
    if (loadedBusinessId.current === undefined) { loadedBusinessId.current = businessId; return }
    if (loadedBusinessId.current === businessId) return
    loadedBusinessId.current = businessId
    setRows([{ dishName: "", guests: "" }])
    setSheet(null)
  }, [businessId])

  const setRow = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)))
  const addRow = () => setRows((r) => [...r, { dishName: "", guests: "" }])
  const removeRow = (i: number) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : r))

  /**
   * WWL-234 — rows were silently dropped by
   * `filter(r => r.dishName.trim() && Number(r.guests) > 0)`. A blank, zero,
   * negative or non-numeric head count vanished with no warning, and the
   * unmatched-dish banner covers only dishes with no recipe — so the printed
   * sheet came out missing a dish and nothing on the page said so.
   *
   * On a cook sheet a silently missing dish is a dish that never gets cooked.
   * Incomplete rows are now named on screen and block generation instead.
   */
  const rowProblem = (r: Row): string | null => {
    const hasDish = !!r.dishName.trim()
    const raw = r.guests.trim()
    const n = Number(raw)
    if (!hasDish && !raw) return null // an untouched spare row is not an error
    if (!hasDish) return "pick a dish"
    if (!raw) return "add a head count"
    if (!Number.isFinite(n)) return "head count must be a number"
    if (n <= 0) return "head count must be more than 0"
    // WWL-240 — reject what the server would floor or the field would accept.
    if (!Number.isInteger(n)) return "head count must be a whole number of people"
    if (!/^\d+$/.test(raw)) return "write the number in figures — 1000, not 1e3"
    if (n > MAX_GUESTS) return `head count looks too large — over ${MAX_GUESTS.toLocaleString("en-PK")}`
    return null
  }
  const rowProblems = rows.map(rowProblem)
  const usableRows = rows.filter((r, i) => rowProblems[i] === null && r.dishName.trim() && Number(r.guests) > 0)
  const incompleteCount = rowProblems.filter(Boolean).length

  const genMut = useMutation({
    mutationFn: () => {
      const dishes = usableRows.map((r) => ({ dishName: r.dishName.trim(), guests: Number(r.guests) }))
      if (dishes.length === 0) throw new Error("Add at least one dish with a guest count")
      return venueOsApi.kitchenPrep(businessId as number, dishes)
    },
    onSuccess: (s) => setSheet(s),
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't build the prep sheet")),
  })

  // Total heads shown on the printed sheet is derived from the GENERATED sheet's
  // matched dishes — not the live builder rows — so it stays consistent with the
  // deghs on the page even if the user edits a row after generating.
  const sheetGuests = sheet ? sheet.dishes.reduce((s, d) => s + (Number(d.guests) || 0), 0) : 0

  /**
   * WWL-235 — "Total heads across dishes" sums only the MATCHED dishes, so on a
   * sheet with an unmatched dish it prints lower than the numbers the vendor
   * typed, with nothing tying the difference to the amber banner further down.
   * A cook sheet that under-reports heads is a sheet that under-cooks.
   */
  const requestedGuests = usableRows.reduce((s, r) => s + (Number(r.guests) || 0), 0)
  const guestsExcluded = sheet ? Math.max(0, requestedGuests - sheetGuests) : 0

  /**
   * WWL-231 — ANY rejection rendered "the kitchen-BOM engine isn't enabled for
   * your account yet", with no error text, no Retry and no way back but a
   * manual reload. Driven live with the engine verified enabled: an unroutable
   * host and an HTTP 500 both produced that sentence. A vendor who hits one
   * flaky moment concludes the feature is not in their plan and never returns.
   *
   * Only a 404 means "dark". Everything else is a failure, and says so with a
   * way to try again.
   */
  if (bomsQ.isError) {
    const status = (bomsQ.error as any)?.response?.status
    const isDark = status === 404
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <PageHeader eyebrow="Kitchen" title="Kitchen prep sheet" description="Turn the menu into deghs to cook and a shopping list." />
        <div className="mt-6 rounded-lg border p-6 text-center text-sm">
          {isDark ? (
            <p className="text-muted-foreground">The kitchen-BOM engine isn&apos;t enabled for your account yet.</p>
          ) : (
            <div className="space-y-3">
              <p className="font-medium">Couldn&apos;t load your recipes.</p>
              <p className="text-muted-foreground">
                {status ? `The server answered ${status}.` : "The request didn't get through — check your connection."}{" "}
                Your recipes are safe; this is a loading problem.
              </p>
              <Button size="sm" variant="outline" onClick={() => bomsQ.refetch()}>
                <Icon name="RefreshCw" size={14} className="mr-1.5" /> Try again
              </Button>
            </div>
          )}
        </div>
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
        {/* WWL-232 — at 360px this row was a single flex line: the dish select
            alone took 342px of the 296px available, pushing the guests input
            (383→495) and Remove (503→535) entirely off-screen, with 22 elements
            overflowing the viewport. Two of the three controls were unreachable
            on a phone. It stacks below `sm` and only becomes a row when there is
            room for one; `min-w-0` lets the select shrink instead of forcing the
            track wide. */}
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="space-y-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className={cn(inputCls, "w-full min-w-0 sm:flex-1")}
                  value={r.dishName}
                  onChange={(e) => setRow(i, "dishName", e.target.value)}
                  aria-label={`Dish ${i + 1}`}
                >
                  {/* WWL-230 — this said "add them in kitchen settings". There
                      is no kitchen settings screen; the command palette knows
                      nothing by that name either. Directions to a place that
                      does not exist are worse than no directions. */}
                  <option value="">{boms.length ? "Pick a dish…" : "No recipes set up for this venue yet"}</option>
                  {boms.map((b) => <option key={b.id} value={b.dishName}>{b.dishName}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    className={cn(inputCls, "w-full min-w-0 tabular-nums sm:w-28")}
                    type="number"
                    /* WWL-240 — no max and no step: 999999999 was accepted and
                       ArrowUp took it to 1,000,000,000. `1e3` displayed to the
                       vendor as "1e3", and `12.5` was sent and floored to 12
                       server-side. A head count is a whole number of people,
                       and 100,000 is far past Pakistan's largest walima. */
                    min={1}
                    max={MAX_GUESTS}
                    step={1}
                    inputMode="numeric"
                    value={r.guests}
                    onChange={(e) => setRow(i, "guests", e.target.value)}
                    placeholder="guests"
                    aria-label={`Head count for dish ${i + 1}`}
                  />
                  {/* WWL-238 — the `r.length > 1` guard is right and the
                      button did not reflect it: no `disabled`, no
                      `aria-disabled`, no message. Clicking Remove on the only
                      row did nothing at all, silently. */}
                  <Button
                    size="sm" variant="ghost" className="h-9 shrink-0 px-2"
                    disabled={rows.length <= 1}
                    title={rows.length <= 1 ? "A prep sheet needs at least one dish" : undefined}
                    onClick={() => removeRow(i)}
                    aria-label={`Remove dish ${i + 1}`}
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
              {/* WWL-234 — say it, rather than dropping the row on generate. */}
              {rowProblems[i] && (
                <p className="text-xs text-amber-700 dark:text-amber-400">This row won&apos;t be cooked — {rowProblems[i]}.</p>
              )}
            </div>
          ))}
        </div>
        {incompleteCount > 0 && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {incompleteCount === 1 ? "One row isn't ready" : `${incompleteCount} rows aren't ready`} — fix or remove
            {incompleteCount === 1 ? " it" : " them"} so nothing is left off the cook sheet.
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" onClick={addRow}><Icon name="Plus" size={14} className="mr-1" /> Add dish</Button>
          {/* WWL-234 — an incomplete row must not be quietly left out of a cook
              sheet, so it blocks the build until it is fixed or removed. */}
          {/* WWL-236 — the only feedback was a corner toast measured at
              1,253ms cold from click, so a vendor who pressed Generate and
              watched the button saw nothing at all for over a second. The
              button is disabled with the reason beside it now: the answer is
              on screen before the click, not a second after it. */}
          {(incompleteCount > 0 || usableRows.length === 0) && (
            <p role="status" className="ml-auto mr-2 text-xs text-muted-foreground">
              {usableRows.length === 0 && incompleteCount === 0
                ? "Pick a dish and a head count to build the sheet."
                : "Fix the rows above to build the sheet."}
            </p>
          )}
          <Button
            size="sm"
            disabled={genMut.isPending || incompleteCount > 0 || usableRows.length === 0}
            onClick={() => genMut.mutate()}
          >
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
              {guestsExcluded > 0 && (
                <span className="text-amber-700 dark:text-amber-400">
                  {" "}· {guestsExcluded} more heads are on dishes with no recipe and are NOT in this plan
                </span>
              )}
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

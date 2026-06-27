"use client"

/**
 * Function-sheet COMPOSER (redesigned, Track C — the interactive editor).
 * Edits the morphing document: header, line items (add/edit/remove with live
 * totals), discount/tax, terms — saved via FunctionSheetAPI.update — and advances
 * the lifecycle via FunctionSheetAPI.transition. Wired to the latest sheet (or
 * ?id=). The server recomputes subtotal/grandTotal from lineItemsJson + discount
 * + tax, so we send those and preview totals locally. Route
 * /dashboard/function-sheet-composer-new. Mutations hit the (dev) API.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FunctionSheetAPI, STATE_LABELS, type FunctionSheet, type FunctionSheetState } from "@/lib/api/functionSheets"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { DetailSkeleton } from "@/components/dashboard/primitives/skeletons"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon } from "@/components/dashboard/shared/icon"
import { Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const STATE_ORDER: FunctionSheetState[] = ["draft", "quote_sent", "contract_pending", "signed", "beo_ready", "invoiced", "paid"]
const STATE_TONE: Record<FunctionSheetState, StatusTone> = {
  draft: "neutral", quote_sent: "info", contract_pending: "warning", signed: "info",
  beo_ready: "warning", invoiced: "info", paid: "success", archived: "neutral", cancelled: "error",
}

interface Item { label: string; qty: number | string; unitPrice: number | string; notes?: string | null }

const labelCls = "text-xs font-medium text-muted-foreground"
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"

export function FunctionSheetComposerView() {
  const qc = useQueryClient()
  const { data: sheet, isLoading, isError } = useQuery<FunctionSheet | null>({
    queryKey: ["fs-composer"],
    queryFn: async () => {
      const idParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null
      if (idParam) return FunctionSheetAPI.get(Number(idParam))
      const list = await FunctionSheetAPI.list()
      const first = list?.functionSheets?.[0]
      return first ? FunctionSheetAPI.get(first.id) : null
    },
  })

  const [form, setForm] = React.useState({
    title: "", customerName: "", customerEmail: "", customerPhone: "",
    eventDate: "", validUntil: "", discountAmount: "0", taxAmount: "0", notes: "", terms: "",
  })
  const [items, setItems] = React.useState<Item[]>([])
  const [dirty, setDirty] = React.useState(false)
  const loadedId = React.useRef<number | null>(null)

  // Initialize the form once per loaded sheet.
  React.useEffect(() => {
    if (sheet && loadedId.current !== sheet.id) {
      loadedId.current = sheet.id
      setForm({
        title: sheet.title ?? "",
        customerName: sheet.customerName ?? "",
        customerEmail: sheet.customerEmail ?? "",
        customerPhone: sheet.customerPhone ?? "",
        eventDate: (sheet.eventDate ?? "").slice(0, 10),
        validUntil: (sheet.validUntil ?? "").slice(0, 10),
        discountAmount: String(num(sheet.discountAmount)),
        taxAmount: String(num(sheet.taxAmount)),
        notes: sheet.notes ?? "",
        terms: Array.isArray(sheet.termsJson?.lines) ? sheet.termsJson.lines.join("\n") : "",
      })
      setItems((sheet.lineItemsJson ?? []).map((i: any) => ({ label: i.label ?? "", qty: i.qty ?? 1, unitPrice: i.unitPrice ?? 0, notes: i.notes ?? "" })))
      setDirty(false)
    }
  }, [sheet])

  const setField = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true) }
  const setItem = (idx: number, patch: Partial<Item>) => { setItems((it) => it.map((x, i) => (i === idx ? { ...x, ...patch } : x))); setDirty(true) }
  const addItem = () => { setItems((it) => [...it, { label: "", qty: 1, unitPrice: 0, notes: "" }]); setDirty(true) }
  const removeItem = (idx: number) => { setItems((it) => it.filter((_, i) => i !== idx)); setDirty(true) }

  const subtotal = items.reduce((s, i) => s + num(i.qty) * num(i.unitPrice), 0)
  const grandTotal = subtotal - num(form.discountAmount) + num(form.taxAmount)

  const saveMut = useMutation({
    mutationFn: () =>
      FunctionSheetAPI.update(sheet!.id, {
        title: form.title,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        eventDate: form.eventDate || null,
        validUntil: form.validUntil || null,
        lineItemsJson: items.map((i) => ({ label: i.label, qty: num(i.qty), unitPrice: num(i.unitPrice), total: num(i.qty) * num(i.unitPrice), notes: i.notes || null })),
        discountAmount: num(form.discountAmount),
        taxAmount: num(form.taxAmount),
        termsJson: { lines: form.terms.split("\n").map((s) => s.trim()).filter(Boolean) },
        notes: form.notes || null,
      } as any),
    onSuccess: () => { showSuccessToast("Function sheet saved"); setDirty(false); qc.invalidateQueries({ queryKey: ["fs-composer"] }); qc.invalidateQueries({ queryKey: ["fs-detail-redesigned"] }) },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  })

  const transitionMut = useMutation({
    mutationFn: (to: FunctionSheetState) => FunctionSheetAPI.transition(sheet!.id, { to }),
    onSuccess: (_d, to) => { showSuccessToast(`Moved to ${STATE_LABELS[to]}`); qc.invalidateQueries({ queryKey: ["fs-composer"] }) },
    onError: (e: any) => toast.error(e?.message || "Couldn't change status"),
  })

  if (isLoading) return <div className="p-4 md:p-6"><DetailSkeleton /></div>
  if (isError || !sheet) {
    return <div className="p-4 md:p-6"><EmptyState icon="FileText" title="No function sheet to edit" description="Create a function sheet first, then edit it here." /></div>
  }

  const idx = STATE_ORDER.indexOf(sheet.state)
  const nextState = idx >= 0 && idx < STATE_ORDER.length - 1 ? STATE_ORDER[idx + 1] : null

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24">
      <PageHeader
        eyebrow="Operate · Compose"
        title="Edit function sheet"
        breadcrumb={
          <a href="/dashboard/function-sheet-detail-new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Icon name="ChevronLeft" size={14} /> Back to document
          </a>
        }
        actions={<StatusPill tone={STATE_TONE[sheet.state]}>{STATE_LABELS[sheet.state]}</StatusPill>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-6">
          {/* Header fields */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-1.5">
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. Wedding Photography — Ahmed & Fatima" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><label className={labelCls}>Customer name</label><input className={inputCls} value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} /></div>
              <div className="space-y-1.5"><label className={labelCls}>Phone</label><input className={inputCls} value={form.customerPhone} onChange={(e) => setField("customerPhone", e.target.value)} /></div>
              <div className="space-y-1.5"><label className={labelCls}>Email</label><input className={inputCls} value={form.customerEmail} onChange={(e) => setField("customerEmail", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><label className={labelCls}>Event date</label><input type="date" className={inputCls} value={form.eventDate} onChange={(e) => setField("eventDate", e.target.value)} /></div>
              <div className="space-y-1.5"><label className={labelCls}>Quote valid until</label><input type="date" className={inputCls} value={form.validUntil} onChange={(e) => setField("validUntil", e.target.value)} /></div>
            </div>
          </div>

          {/* Line items editor */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold">Line items</h2>
              <Button size="sm" variant="outline" onClick={addItem}><Icon name="Plus" size={14} className="mr-1" /> Add item</Button>
            </div>
            <div className="space-y-2 p-3">
              {items.length === 0 && <p className="px-1 py-3 text-sm text-muted-foreground">No items yet — add the first.</p>}
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border/70 p-2">
                  <input className={cn(inputCls, "col-span-12 sm:col-span-5")} placeholder="Description" value={it.label} onChange={(e) => setItem(i, { label: e.target.value })} />
                  <input className={cn(inputCls, "col-span-3 sm:col-span-2 text-right tabular-nums")} type="number" placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} />
                  <input className={cn(inputCls, "col-span-5 sm:col-span-2 text-right tabular-nums")} type="number" placeholder="Unit" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: e.target.value })} />
                  <div className="col-span-3 sm:col-span-2 text-right text-sm font-medium tabular-nums">{formatPkr(num(it.qty) * num(it.unitPrice))}</div>
                  <button onClick={() => removeItem(i)} aria-label="Remove item" className="col-span-1 grid h-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-red-600"><Icon name="Trash2" size={15} /></button>
                </div>
              ))}
            </div>
            {/* Totals + discount/tax inputs */}
            <div className="ml-auto max-w-sm space-y-2 border-t border-border p-4 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatPkr(subtotal)}</span></div>
              <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Discount</span><input type="number" className={cn(inputCls, "h-8 w-32 text-right tabular-nums")} value={form.discountAmount} onChange={(e) => setField("discountAmount", e.target.value)} /></div>
              <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Sales tax</span><input type="number" className={cn(inputCls, "h-8 w-32 text-right tabular-nums")} value={form.taxAmount} onChange={(e) => setField("taxAmount", e.target.value)} /></div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold"><span>Grand total</span><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatPkr(grandTotal)}</span></div>
            </div>
          </div>

          {/* Terms + notes */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-1.5 rounded-xl border border-border bg-card p-4 shadow-sm">
              <label className={labelCls}>Terms (one per line)</label>
              <textarea className={cn(inputCls, "h-28 resize-y py-2")} value={form.terms} onChange={(e) => setField("terms", e.target.value)} placeholder={"50% advance to confirm\nBalance due 7 days before event"} />
            </div>
            <div className="space-y-1.5 rounded-xl border border-border bg-card p-4 shadow-sm">
              <label className={labelCls}>Internal notes</label>
              <textarea className={cn(inputCls, "h-28 resize-y py-2")} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Sidebar — lifecycle actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Lifecycle</h3>
            <div className="space-y-2">
              {nextState ? (
                <Button className="w-full justify-between" disabled={transitionMut.isPending || dirty} onClick={() => transitionMut.mutate(nextState)}>
                  {transitionMut.isPending ? <Spinner size={14} /> : <>Move to {STATE_LABELS[nextState]}</>}
                  {!transitionMut.isPending && <Icon name="ChevronRight" size={15} />}
                </Button>
              ) : (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Sheet is {STATE_LABELS[sheet.state].toLowerCase()}.</div>
              )}
              {dirty && nextState && <p className="text-xs text-amber-600 dark:text-amber-400">Save your changes before advancing.</p>}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-sm">
            Editing is wired to the live API — saving updates the function sheet and the server recomputes totals.
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur md:left-[var(--sidebar-width,0)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="text-sm">
            <span className="text-muted-foreground">Grand total </span>
            <span className="font-semibold tabular-nums">{formatPkr(grandTotal)}</span>
            {dirty && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>}
          </div>
          <Button disabled={!dirty || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save changes</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FunctionSheetComposerView

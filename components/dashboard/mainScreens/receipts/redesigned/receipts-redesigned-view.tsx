"use client"

/**
 * Receipts — redesigned (Track C). Wired to ReceiptsAPI.list(); rendered through
 * the primitives. Read-only presentation; 
 * Route /dashboard/receipts.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReceiptsAPI, type PaymentReceipt, type ReceiptMethod } from "@/lib/api/paymentReceipts"
import { ReceiptFormDialog, type ReceiptPrefill } from "@/components/dashboard/mainScreens/receipts/redesigned/receipt-form-dialog"
import { OutboxStatus } from "@/components/dashboard/shared/outbox-status"
import { OutboxConflicts } from "@/components/dashboard/shared/outbox-conflicts"
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
import { LinkedFunctionSheetBadge } from "@/components/shared/linked-function-sheet-badge"
import { DestructiveConfirm } from "@/components/dashboard/primitives/destructive-confirm"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const methodLabel = (m: string) =>
  ({ cash: "Cash", jazzcash: "JazzCash", easypaisa: "Easypaisa", raast: "Raast", ibft: "IBFT", bank_transfer: "Bank transfer", other: "Other" } as Record<string, string>)[m] ?? m
const methodTone = (m: string): StatusTone => (m === "cash" ? "success" : m === "other" ? "neutral" : "info")
// WW-CUID — who actually paid. A walk-in booking has no registered User, so the
// receipt's customerUserId is null; the payer's name lives on the booking. Prefer
// the linked account, fall back to the booking, never show the vendor.
const payerName = (r: PaymentReceipt) => r.customer?.fullName || r.booking?.customerName || ""

/** WWL-157 — one screenful and a bit; "Load more" doubles it. */
const PAGE_SIZE = 100

export function ReceiptsRedesignedView() {
  const qc = useQueryClient()
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PaymentReceipt | undefined>(undefined)
  const [prefill, setPrefill] = React.useState<ReceiptPrefill | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<PaymentReceipt | null>(null)

  /**
   * WWL-157 — the endpoint had no limit and no paging, so the entire ledger
   * shipped on every load and every total was summed in the browser. Fine at
   * 39 rows; it degrades linearly and silently.
   *
   * The screen now asks for a page and grows it on demand. The money headline
   * does NOT come from the page — the server computes it in SQL across the
   * whole filtered ledger, so "Total received" stays true no matter how much
   * of the table has been loaded.
   */
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE)
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["receipts-redesigned", pageSize],
    queryFn: () => ReceiptsAPI.list({ limit: pageSize }),
    placeholderData: (prev) => prev,
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["receipts-redesigned"] })
  const openCreate = () => { setEditing(undefined); setPrefill(undefined); setDialogOpen(true) }
  const openEdit = (r: PaymentReceipt) => { setEditing(r); setPrefill(undefined); setDialogOpen(true) }
  // PWA-03 — re-enter a conflicted offline receipt with its values seeded.
  const openReenter = (p: ReceiptPrefill) => { setEditing(undefined); setPrefill(p); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => ReceiptsAPI.remove(id),
    onSuccess: () => { showSuccessToast("Receipt removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't remove receipt")),
  })

  const all = data?.receipts ?? []
  const receipts = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) => [payerName(r), r.transactionRef, r.method, r.notes].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  /**
   * WWL-151 — the cards read `all` while the table rendered the filtered rows,
   * so filtering 13 receipts down to 2 (or to 0) left the headline frozen at
   * Rs 7,704,813 every time. Third consecutive money module with this. A
   * headline that describes a different set than the rows under it is not a
   * summary; it is two answers to one question.
   *
   * The cards describe what is on screen, and say so when a filter is on.
   */
  const filtering = search.trim().length > 0
  const scope = receipts
  const now = new Date()
  const thisMonth = scope.filter((r) => {
    const d = new Date(r.receivedDate)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((s, r) => s + num(r.amount), 0)

  /**
   * WWL-157 — with paging on, a total summed from the loaded rows would go up
   * as the vendor scrolls, which is the same lie in a new costume. Unfiltered
   * headlines come from the server's whole-ledger aggregate; only a filter,
   * which is genuinely about the rows on screen, is summed locally.
   */
  const ledgerTotal = num(data?.summary?.total)
  const ledgerCount = data?.total ?? all.length
  const ledgerCash = num(data?.summary?.byMethod?.cash)

  const total = filtering ? scope.reduce((s, r) => s + num(r.amount), 0) : ledgerTotal
  const cashTotal = filtering
    ? scope.filter((r) => r.method === "cash").reduce((s, r) => s + num(r.amount), 0)
    : ledgerCash
  const shownCount = filtering ? scope.length : ledgerCount
  const scopeNote = filtering ? `of ${ledgerCount} total` : undefined

  // How much of the ledger is actually in the browser right now.
  const loaded = all.length
  const hasMore = loaded < ledgerCount

  // WWL-150 — the server's per-rail breakdown, biggest first.
  const byMethodRows = Object.entries(data?.summary?.byMethod ?? {})
    .filter(([, v]) => num(v) > 0)
    .sort((a, b) => num(b[1]) - num(a[1]))
    .map(([k, v]) => [k, num(v)] as [string, number])
  // Drop the Txn-ref column entirely when every row is cash (no reference), so
  // the table doesn't carry an all-dashes dead column.
  const hasRef = all.some((r) => (r.transactionRef ?? "").trim().length > 0)

  const columns: Column<PaymentReceipt>[] = [
    { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{payerName(r) || "—"}</span> },
    { key: "method", header: "Method", render: (r) => <StatusPill tone={methodTone(r.method)} variant="icon">{methodLabel(r.method)}</StatusPill> },
    ...(hasRef ? [{ key: "ref", header: "Txn ref", cellClassName: "text-muted-foreground", render: (r: PaymentReceipt) => r.transactionRef || "—" }] as Column<PaymentReceipt>[] : []),
    { key: "date", header: "Received", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.receivedDate) },
    { key: "event", header: "Event", render: (r) => <LinkedFunctionSheetBadge bookingId={r.bookingId} variant="inline" /> },
    { key: "amount", header: "Amount", align: "right", render: (r) => <MoneyCell amount={num(r.amount)} tone="success" /> },
    {
      key: "actions", header: "", align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit receipt"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(r)} aria-label="Remove receipt"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Receipts"
        description="Every payment received, with proof."
        actions={<div className="flex items-center gap-2"><OutboxStatus /><Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Record receipt</Button></div>}
      />

      <OutboxConflicts onReenter={openReenter} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={filtering ? "Total received (filtered)" : "Total received"} value={formatPkr(total)} icon="Wallet" trend="up" delta={scopeNote} error={isError} />
        <StatCard label="This month" value={formatPkr(thisMonthTotal)} icon="Calendar" trend="up" delta={`${thisMonth.length} ${thisMonth.length === 1 ? "receipt" : "receipts"}`} error={isError} />
        <StatCard label={filtering ? "Cash collected (filtered)" : "Cash collected"} value={formatPkr(cashTotal)} icon="DollarSign" error={isError} />
        <StatCard label={filtering ? "Receipts (filtered)" : "Receipts"} value={shownCount} icon="FileText" delta={scopeNote} />
      </div>

      {/* WWL-157 — never let the table imply it is the whole book. If a search
          is running while rows are still unloaded, say so plainly: a vendor
          who searches for a customer and sees nothing must not conclude the
          receipt was never recorded. */}
      {hasMore && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Showing the {loaded} most recent of {ledgerCount} receipts.
            {filtering && " Search only covers what is loaded."}
          </span>
          <Button size="sm" variant="secondary" className="h-7" disabled={isFetching} onClick={() => setPageSize((n) => n + PAGE_SIZE)}>
            {isFetching ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {/*
        WWL-150 — every response already carries `summary.byMethod`:
        cash 6,314,023 · JazzCash 5,558,585 · bank_transfer 3,175,730 ·
        Easypaisa 2,990,946 · Raast 2,002,337 · other 1,159,500. The screen
        surfaced ONLY cash and recomputed that client-side.

        For a Pakistani vendor the JazzCash / Easypaisa / Raast split IS the
        reconciliation view -- it is what they check each rail's app against at
        the end of a wedding week -- and it was being sent and thrown away.

        Server-computed, so it describes the whole ledger; labelled as such so
        it is never confused with the filtered cards above.
      */}
      {byMethodRows.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">Received by method</h3>
            <span className="text-[11px] text-muted-foreground">whole ledger</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {byMethodRows.map(([method, amount]) => (
              <div key={method} className="min-w-[8rem]">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {methodLabel(method as ReceiptMethod)}
                </div>
                <div className="text-sm font-semibold tabular-nums">{formatPkr(amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        /**
         * WWL-119 — every row was a navigational dead end: a `<tr>` with no
         * onRowClick, no link, no button, tabIndex -1 and cursor: auto. From a
         * payment a vendor could not reach the booking it belongs to, the
         * customer who made it, or the rest of that booking's receipts — on a
         * ledger whose whole job is answering "what is this Rs 489,311 against?"
         *
         * Rows without a bookingId stay inert rather than navigating nowhere.
         */
        onRowClick={(r) => { if (r.bookingId != null) router.push(`/dashboard/bookings/${r.bookingId}`) }}
        caption="Receipts"
        columns={columns}
        data={receipts}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load receipts." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        /* WWL-152 — with `filterQuery` passed, DataTable renders a "no matches"
           state instead of this one. Searching zzzqqq used to render "No
           receipts yet" plus a Record receipt button, presenting a populated
           ledger as first-run onboarding — worse than the sibling cases because
           it also offered a primary call-to-action. This `empty` is now only
           what a genuinely empty ledger sees. */
        empty={{
          icon: "FileText",
          title: "No receipts yet",
          description: "Record cash, JazzCash, Easypaisa and bank payments so every rupee is accounted for.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Record receipt</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search receipts…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r.id)} rows={receipts} filename="receipts" columns={[
                { header: "Customer", value: (r) => payerName(r) },
                { header: "Method", value: (r) => methodLabel(r.method) },
                { header: "Txn ref", value: (r) => r.transactionRef ?? "" },
                // WWL-136/155/172/188 — the export dropped a column that is on
                // screen, so the file the vendor hands their accountant is not the
                // table they were reading. Booking id is what actually ties a row
                // back to an event in a spreadsheet.
                { header: "Booking id", value: (r) => (r.bookingId != null ? `#${r.bookingId}` : "") },
                { header: "Received", value: (r) => fmtDate(r.receivedDate) },
                { header: "Amount", value: (r) => num(r.amount) },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{payerName(r) || "—"}</div>
              <div className="text-xs text-muted-foreground">{fmtDate(r.receivedDate)} · {r.transactionRef || "no ref"}</div>
              <div className="mt-1"><StatusPill tone={methodTone(r.method)} variant="icon">{methodLabel(r.method)}</StatusPill></div>
            </div>
            <MoneyCell amount={num(r.amount)} tone="success" className="text-sm font-medium" />
          </div>
        )}
      />

      <ReceiptFormDialog open={dialogOpen} onOpenChange={setDialogOpen} receipt={editing} prefill={prefill} onSaved={invalidate} />

      {/* WWL-145 — the confirm named only the amount, on a ledger where this
          vendor has two "Barat — Salman Rauf" receipts. WWL-156 — it also said
          "can't be undone" while PaymentReceipt is paranoid: true. */}
      <DestructiveConfirm
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this receipt?"
        reversibility="soft"
        pending={removeMut.isPending}
        onConfirm={() => deleting && removeMut.mutate(deleting.id)}
        fields={[
          { label: "Amount", value: deleting ? formatPkr(num(deleting.amount)) : "" },
          { label: "From", value: deleting ? payerName(deleting) : "" },
          { label: "Method", value: deleting ? methodLabel(deleting.method) : "" },
          { label: "Received", value: deleting ? fmtDate(deleting.receivedDate) : "" },
          { label: "Txn ref", value: deleting?.transactionRef || "" },
          { label: "Booking", value: deleting?.bookingId ? `#${deleting.bookingId}` : "" },
        ]}
        consequence={
          deleting?.bookingId
            ? "The booking's paid total and payment status will be recalculated without it."
            : undefined
        }
      />
    </div>
  )
}

export default ReceiptsRedesignedView

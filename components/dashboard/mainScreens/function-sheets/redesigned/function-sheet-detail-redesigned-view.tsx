"use client"

/**
 * Function sheet — DETAIL (redesigned, Track C bespoke). The morphing
 * Quote → Contract → BEO → Invoice → Receipt document, with a lifecycle stepper
 * as the hero. Wired to FunctionSheetAPI (list -> newest -> get for full detail),
 * or a specific id via ?id=. Read-only presentation; original detail view
 * untouched. Route /dashboard/function-sheet-detail-new. Token-only (themes).
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { FunctionSheetAPI, STATE_LABELS, type FunctionSheet, type FunctionSheetState } from "@/lib/api/functionSheets"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { DetailSkeleton } from "@/components/dashboard/primitives/skeletons"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

const STATE_ORDER: FunctionSheetState[] = ["draft", "quote_sent", "contract_pending", "signed", "beo_ready", "invoiced", "paid"]
const STATE_TONE: Record<FunctionSheetState, StatusTone> = {
  draft: "neutral", quote_sent: "info", contract_pending: "warning", signed: "info",
  beo_ready: "warning", invoiced: "info", paid: "success", archived: "neutral", cancelled: "error",
}
// Step → the timestamp field that marks it done + an icon
const STEP_META: Record<string, { ts?: keyof FunctionSheet; icon: IconName }> = {
  draft: { icon: "FileText" },
  quote_sent: { ts: "sentAt", icon: "Send" },
  contract_pending: { icon: "Pencil" },
  signed: { ts: "signedAt", icon: "CheckCircle2" },
  beo_ready: { icon: "ClipboardList" },
  invoiced: { ts: "invoicedAt", icon: "FileText" },
  paid: { ts: "paidAt", icon: "Wallet" },
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function FunctionSheetDetailRedesignedView() {
  const { data: sheet, isLoading, isError } = useQuery<FunctionSheet | null>({
    queryKey: ["fs-detail-redesigned"],
    queryFn: async () => {
      const idParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null
      if (idParam) return FunctionSheetAPI.get(Number(idParam))
      const list = await FunctionSheetAPI.list()
      const first = list?.functionSheets?.[0]
      return first ? FunctionSheetAPI.get(first.id) : null
    },
  })

  if (isLoading) {
    return <div className="p-4 md:p-6"><DetailSkeleton /></div>
  }
  if (isError || !sheet) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState icon="FileText" title="No function sheet to show"
          description="Create a function sheet (quote/BEO/invoice) and it'll render here in the new design." />
      </div>
    )
  }

  const items = sheet.lineItemsJson ?? []
  const sigs: any = sheet.signaturesJson ?? {}
  const terms: string[] = Array.isArray(sheet.termsJson?.lines) ? sheet.termsJson.lines : []
  const schedule: any[] = Array.isArray(sheet.paymentScheduleJson) ? sheet.paymentScheduleJson : []
  const currentIdx = STATE_ORDER.indexOf(sheet.state)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate · Function sheet"
        title={sheet.title}
        breadcrumb={
          <a href="/dashboard/function-sheets-new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Icon name="ChevronLeft" size={14} /> Function sheets
          </a>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline"><Icon name="Download" size={15} className="mr-1.5" /> PDF</Button>
            <Button variant="outline"><Icon name="Send" size={15} className="mr-1.5" /> Share</Button>
          </div>
        }
      />

      {/* Lifecycle stepper — the morphing document hero */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">FS #{sheet.id}</span>
            <StatusPill tone={STATE_TONE[sheet.state]}>{STATE_LABELS[sheet.state]}</StatusPill>
            {sheet.business?.name && <span className="text-sm text-muted-foreground"><Icon name="Building2" size={13} className="mr-1 inline" />{sheet.business.name}</span>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatPkr(num(sheet.grandTotal))}</div>
            <div className="text-xs text-muted-foreground">Grand total{num(sheet.taxAmount) > 0 ? ` · inc. ${formatPkr(num(sheet.taxAmount))} tax` : ""}</div>
          </div>
        </div>
        <div className="flex items-center overflow-x-auto pb-1">
          {STATE_ORDER.map((st, i) => {
            const meta = STEP_META[st]
            const done = currentIdx >= 0 && i < currentIdx
            const isCurrent = i === currentIdx
            const ts = meta.ts ? (sheet[meta.ts] as string | null) : null
            return (
              <React.Fragment key={st}>
                <div className="flex min-w-[88px] flex-col items-center text-center">
                  <span className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border-2 transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !done && !isCurrent && "border-border text-muted-foreground",
                  )}>
                    <Icon name={done ? "CheckCircle2" : meta.icon} size={15} />
                  </span>
                  <span className={cn("mt-1 text-[11px] font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>{STATE_LABELS[st]}</span>
                  {ts && <span className="text-[10px] text-muted-foreground">{fmtDate(ts)}</span>}
                </div>
                {i < STATE_ORDER.length - 1 && (
                  <div className={cn("mx-1 h-0.5 flex-1", i < currentIdx ? "bg-primary" : "bg-border")} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Customer + event */}
          <Section title="Customer & event">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</div>
                <div className="text-sm font-medium">{sheet.customerName || sheet.customer?.fullName || "—"}</div>
                {sheet.customerPhone && <a href={`tel:${sheet.customerPhone}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><Icon name="Phone" size={13} /> {sheet.customerPhone}</a>}
                {sheet.customerEmail && <a href={`mailto:${sheet.customerEmail}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><Icon name="Mail" size={13} /> {sheet.customerEmail}</a>}
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event</div>
                <div className="flex items-center gap-1.5 text-sm"><Icon name="Calendar" size={13} className="text-muted-foreground" /> {fmtDate(sheet.eventDate)}</div>
                {sheet.validUntil && <div className="text-xs text-muted-foreground">Quote valid until {fmtDate(sheet.validUntil)}</div>}
              </div>
            </div>
          </Section>

          {/* Line items */}
          <Section title="Line items" action={<span className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>}>
            {items.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No line items.</p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">Description</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Unit</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any, i: number) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5">
                        <div className="font-medium">{it.label}</div>
                        {it.notes && <div className="text-xs text-muted-foreground">{it.notes}</div>}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">{num(it.qty)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{formatPkr(num(it.unitPrice))}</td>
                      <td className="py-2.5 text-right font-medium">{formatPkr(it.total != null ? num(it.total) : num(it.qty) * num(it.unitPrice))}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
            {/* Totals */}
            <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatPkr(num(sheet.subtotal))}</span></div>
              {num(sheet.discountAmount) > 0 && <div className="flex justify-between text-rose-600 dark:text-rose-400"><span>− Discount</span><span className="tabular-nums">{formatPkr(num(sheet.discountAmount))}</span></div>}
              {num(sheet.taxAmount) > 0 && <div className="flex justify-between text-foreground"><span>+ Sales tax</span><span className="tabular-nums">{formatPkr(num(sheet.taxAmount))}</span></div>}
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold"><span>Grand total</span><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatPkr(num(sheet.grandTotal))}</span></div>
            </div>
          </Section>

          {/* Payment schedule */}
          {schedule.length > 0 && (
            <Section title="Payment schedule">
              <div className="space-y-2">
                {schedule.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{p.label}</span>
                      {p.dueDate && <span className="text-muted-foreground"> · due {fmtDate(p.dueDate)}</span>}
                      {p.paidOn && <StatusPill tone="success" className="ml-2">Paid {fmtDate(p.paidOn)}</StatusPill>}
                    </div>
                    <span className="tabular-nums font-medium">{formatPkr(num(p.amount))}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Terms */}
          {terms.length > 0 && (
            <Section title="Terms & conditions">
              <ul className="space-y-1.5 text-sm">
                {terms.map((t, i) => (
                  <li key={i} className="flex items-start gap-2"><Icon name="CheckCircle2" size={14} className="mt-0.5 shrink-0 text-muted-foreground" /><span>{t}</span></li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next action */}
          <Section title="Lifecycle">
            <div className="space-y-2">
              {currentIdx >= 0 && currentIdx < STATE_ORDER.length - 1 ? (
                <a href={`/dashboard/function-sheet-composer-new?id=${sheet.id}`} className="block">
                  <Button className="w-full justify-between">
                    Move to {STATE_LABELS[STATE_ORDER[currentIdx + 1]]} <Icon name="ChevronRight" size={15} />
                  </Button>
                </a>
              ) : (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">This sheet is {STATE_LABELS[sheet.state].toLowerCase()}.</div>
              )}
              <a href={`/dashboard/function-sheet-composer-new?id=${sheet.id}`} className="block">
                <Button variant="outline" className="w-full justify-between">Edit sheet <Icon name="Pencil" size={14} /></Button>
              </a>
            </div>
          </Section>

          {/* Signatures */}
          <Section title="Signatures">
            <div className="space-y-3">
              {(["vendor", "customer"] as const).map((side) => {
                const s = sigs[side]
                return (
                  <div key={side} className="rounded-lg border border-border p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{side}</div>
                    {s?.signedAt ? (
                      <div className="mt-1">
                        <div className="text-sm font-medium">{s.name || "Signed"}</div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><Icon name="CheckCircle2" size={12} /> Signed {fmtDate(s.signedAt)}{s.mode ? ` · ${s.mode}` : ""}</div>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-muted-foreground">Not yet signed</div>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          {/* FBR e-invoice */}
          {sheet.fbrInvoiceNumber && (
            <Section title="FBR e-invoice">
              <div className="flex items-center gap-2">
                <Icon name="ShieldCheck" size={16} className="text-emerald-500" />
                <div>
                  <div className="font-mono text-sm">{sheet.fbrInvoiceNumber}</div>
                  <StatusPill tone={sheet.fbrSubmissionStatus === "accepted" ? "success" : "warning"}>{sheet.fbrSubmissionStatus ?? "—"}</StatusPill>
                </div>
              </div>
            </Section>
          )}

          {sheet.notes && (
            <Section title="Internal notes">
              <p className="whitespace-pre-line text-sm text-muted-foreground">{sheet.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

export default FunctionSheetDetailRedesignedView

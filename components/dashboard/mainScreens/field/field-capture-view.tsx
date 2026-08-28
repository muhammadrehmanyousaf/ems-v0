"use client"

/**
 * Phase-3 EPIC 4 · PWA-02 — Field Capture hub (/dashboard/field).
 *
 * One offline-first screen for a vendor working the floor at a bridal expo with
 * dead signal: capture a lead, a payment, an expense, or hold a date — all four
 * outbox ops in one place. Everything queues locally and syncs on reconnect;
 * rejected items surface in the conflict panel with Re-enter. Dark until
 * FEAT_OFFLINE_OUTBOX (the capture dialogs simply post online when the flag's off).
 */

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useBusinessIdField } from "@/lib/store/use-business-id-field"
import { OutboxStatus, useOutboxStatus } from "@/components/dashboard/shared/outbox-status"
import { OutboxConflicts, type ReenterPayload } from "@/components/dashboard/shared/outbox-conflicts"
import type { OutboxOpType } from "@/lib/outbox"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"
import { cn } from "@/lib/utils"
import { LeadFormDialog } from "@/components/dashboard/mainScreens/leads/redesigned/lead-form-dialog"
import { ReceiptFormDialog } from "@/components/dashboard/mainScreens/receipts/redesigned/receipt-form-dialog"
import { ExpenseFormDialog } from "@/components/dashboard/mainScreens/expenses/redesigned/expense-form-dialog"
import { HoldDateDialog } from "@/components/dashboard/mainScreens/holds/hold-date-dialog"

type Kind = "lead" | "receipt" | "expense" | "hold" | null
const OP_TO_KIND: Record<OutboxOpType, Exclude<Kind, null>> = {
  capture_lead: "lead", record_receipt: "receipt", record_expense: "expense", hold_date: "hold",
}

interface Action { kind: Exclude<Kind, null>; icon: IconName; title: string; subtitle: string; tone: string }
const ACTIONS: Action[] = [
  { kind: "lead", icon: "Users", title: "Capture a lead", subtitle: "Walk-in at the expo", tone: "text-violet-600 bg-violet-50 border-violet-200" },
  { kind: "receipt", icon: "Wallet", title: "Record a payment", subtitle: "Advance or booking money", tone: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { kind: "expense", icon: "FileText", title: "Log an expense", subtitle: "Cash paid out on-site", tone: "text-rose-600 bg-rose-50 border-rose-200" },
  { kind: "hold", icon: "CalendarCheck", title: "Hold a date", subtitle: "Tentative reservation", tone: "text-blue-600 bg-blue-50 border-blue-200" },
]

/**
 * `embedded` — render as a SECTION inside another page rather than as the whole
 * screen (the dashboard Home uses this).
 *
 * It drops the PageHeader and the page chrome. Without it, embedding produced a
 * second "Field capture" title and a `max-w-2xl mx-auto` column floating in the
 * middle of a full-width dashboard. The OutboxStatus that lived in the header's
 * actions moves inline, because "is my capture saved?" is the one thing on this
 * component a vendor must never lose sight of.
 */
export function FieldCaptureView({ embedded = false }: { embedded?: boolean } = {}) {
  const qc = useQueryClient()
  // WWL-608 (S3) — this read `useActiveBusinessId() ?? undefined`, and the
  // dashboard header's persisted default is "All venues", under which that is
  // null. So a lead captured at a bridal expo attached to no venue at all.
  // `useBusinessIdField` is the shared primitive from the Module 36 fix: header
  // selection first, the vendor's first venue only as a last resort.
  const [businessIdStr] = useBusinessIdField()
  const businessId = businessIdStr ? Number(businessIdStr) : undefined
  const { online, pending } = useOutboxStatus()
  const [active, setActive] = React.useState<Kind>(null)
  const [prefill, setPrefill] = React.useState<ReenterPayload | undefined>(undefined)

  const open = (kind: Exclude<Kind, null>) => { setPrefill(undefined); setActive(kind) }
  const close = () => setActive(null)
  const onReenter = (p: ReenterPayload, opType: OutboxOpType) => { setPrefill(p); setActive(OP_TO_KIND[opType]) }
  // WWL-543 family — this was a blanket `invalidateQueries()`, which refetches
  // EVERY cached query in the app after a single capture. Scope it to the four
  // things a field capture can actually change.
  const onSaved = () => {
    for (const key of [["leads"], ["receipts"], ["expenses"], ["vendor-holds"], ["dashboard"]]) {
      qc.invalidateQueries({ queryKey: key })
    }
    close()
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6 p-4 md:p-6 max-w-2xl mx-auto"}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Field capture{" "}
              <span className="font-normal normal-case tracking-normal text-xs">· works offline</span>
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Capture everything on-site — it saves instantly and syncs when you&apos;re back online.
            </p>
          </div>
          <OutboxStatus />
        </div>
      ) : (
        <PageHeader
          eyebrow="On the floor"
          title="Field capture"
          description="Capture everything on-site — it saves instantly and syncs when you're back online."
          actions={<OutboxStatus />}
        />
      )}

      {/* Offline-first status banner */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
        online ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900",
      )}>
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", online ? "bg-emerald-100" : "bg-amber-100")}>
          <Icon name={online ? "Wifi" : "WifiOff"} size={16} />
        </span>
        <div className="min-w-0">
          <div className="font-medium">{online ? "You're online — captures save immediately." : "You're offline — capture anyway."}</div>
          <div className="text-xs opacity-80">
            {online
              ? (pending > 0 ? `${pending} item${pending === 1 ? "" : "s"} still syncing.` : "Everything's in sync.")
              : `Saved on this device${pending > 0 ? ` (${pending} waiting)` : ""} — syncs the moment you reconnect.`}
          </div>
        </div>
      </div>

      <OutboxConflicts reenterOps={["capture_lead", "record_receipt", "record_expense", "hold_date"]} onReenter={onReenter} />

      {/* Big tappable capture cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => (
          <button
            key={a.kind}
            type="button"
            onClick={() => open(a.kind)}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 text-left transition hover:border-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border", a.tone)}>
              <Icon name={a.icon} size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{a.title}</span>
              <span className="block text-xs text-muted-foreground">{a.subtitle}</span>
            </span>
            <Icon name="ChevronRight" size={18} className="ml-auto text-muted-foreground transition group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      {/* Capture dialogs — reused, offline-aware */}
      <LeadFormDialog open={active === "lead"} onOpenChange={(v) => !v && close()} prefill={prefill} businessId={businessId} onSaved={onSaved} />
      <ReceiptFormDialog open={active === "receipt"} onOpenChange={(v) => !v && close()} prefill={prefill} onSaved={onSaved} />
      <ExpenseFormDialog open={active === "expense"} onOpenChange={(v) => !v && close()} prefill={prefill} onSaved={onSaved} />
      <HoldDateDialog open={active === "hold"} onOpenChange={(v) => !v && close()} prefill={prefill} onSaved={onSaved} />
    </div>
  )
}

export default FieldCaptureView

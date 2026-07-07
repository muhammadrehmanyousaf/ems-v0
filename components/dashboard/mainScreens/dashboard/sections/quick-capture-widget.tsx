"use client"

/**
 * PWA-02 — Dashboard "Quick capture" widget.
 *
 * A compact launcher on the vendor's daily driver for the four offline-capable
 * capture actions (lead / payment / expense / hold), plus a live pending-sync
 * count and a link to full Field mode. Self-hides unless offline mode is enabled
 * (isOutboxEnabled) so it's invisible to non-pilot vendors — no behaviour change
 * for anyone until the flag flips.
 */

import * as React from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { isOutboxEnabled } from "@/lib/outbox"
import { useOutboxStatus } from "@/components/dashboard/shared/outbox-status"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"
import { cn } from "@/lib/utils"
import { LeadFormDialog } from "@/components/dashboard/mainScreens/leads/redesigned/lead-form-dialog"
import { ReceiptFormDialog } from "@/components/dashboard/mainScreens/receipts/redesigned/receipt-form-dialog"
import { ExpenseFormDialog } from "@/components/dashboard/mainScreens/expenses/redesigned/expense-form-dialog"
import { HoldDateDialog } from "@/components/dashboard/mainScreens/holds/hold-date-dialog"

type Kind = "lead" | "receipt" | "expense" | "hold" | null
const ACTIONS: { kind: Exclude<Kind, null>; icon: IconName; label: string; tone: string }[] = [
  { kind: "lead", icon: "Users", label: "Lead", tone: "text-violet-600 bg-violet-50 border-violet-200" },
  { kind: "receipt", icon: "Wallet", label: "Payment", tone: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { kind: "expense", icon: "FileText", label: "Expense", tone: "text-rose-600 bg-rose-50 border-rose-200" },
  { kind: "hold", icon: "CalendarCheck", label: "Hold", tone: "text-blue-600 bg-blue-50 border-blue-200" },
]

export default function QuickCaptureWidget() {
  const qc = useQueryClient()
  const businessId = useActiveBusinessId() ?? undefined
  const { online, pending } = useOutboxStatus()
  const [active, setActive] = React.useState<Kind>(null)
  const close = () => setActive(null)
  const onSaved = () => { qc.invalidateQueries(); close() }

  if (!isOutboxEnabled()) return null

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Quick capture</h2>
          <p className="text-xs text-muted-foreground">
            {online
              ? (pending > 0 ? `${pending} syncing…` : "Save on-site — works offline.")
              : `Offline — saved on this device${pending > 0 ? ` (${pending} waiting)` : ""}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("hidden h-2 w-2 rounded-full sm:inline-block", online ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
          <Link href="/dashboard/field" className="text-xs font-medium text-primary hover:underline">Field mode →</Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.kind}
            type="button"
            onClick={() => setActive(a.kind)}
            className="flex flex-col items-center gap-1.5 rounded-lg border bg-background p-3 text-center transition hover:border-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", a.tone)}>
              <Icon name={a.icon} size={18} />
            </span>
            <span className="text-xs font-medium">{a.label}</span>
          </button>
        ))}
      </div>

      <LeadFormDialog open={active === "lead"} onOpenChange={(v) => !v && close()} businessId={businessId} onSaved={onSaved} />
      <ReceiptFormDialog open={active === "receipt"} onOpenChange={(v) => !v && close()} onSaved={onSaved} />
      <ExpenseFormDialog open={active === "expense"} onOpenChange={(v) => !v && close()} onSaved={onSaved} />
      <HoldDateDialog open={active === "hold"} onOpenChange={(v) => !v && close()} onSaved={onSaved} />
    </section>
  )
}

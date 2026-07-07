"use client"

/**
 * Phase-3 EPIC 4 · PWA-03 — offline-sync conflict panel.
 *
 * A receipt captured offline can fail to sync (booking gone, no longer your
 * booking, bad data). Losing it silently would be losing money the vendor
 * believes they logged — so failed ops are persisted (lib/outbox conflict store)
 * and surfaced here with the reason and a way to re-enter or discard. Renders
 * nothing when there are no conflicts (and when the feature is dark).
 */

import * as React from "react"
import { isOutboxEnabled, listConflicts, removeConflict, onOutboxChange, type ConflictRecord, type OutboxOpType } from "@/lib/outbox"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

/** Map a backend error into something a vendor can act on. */
function reasonFor(c: ConflictRecord): string {
  const e = (c.error || "").toLowerCase()
  if (e.includes("unknown_op")) return "This action isn't supported yet."
  if (e.includes("not your booking")) return "You're no longer linked to that booking."
  if (e.includes("booking not found")) return "That booking no longer exists."
  if (e.includes("no customer")) return "The booking has no registered customer to attribute it to."
  if (e.includes("positive amount") || e.includes("amount")) return "The amount was invalid."
  return c.error || "It couldn't be synced."
}

export interface ReenterPayload {
  bookingId?: number
  amount?: number
  method?: string
  receivedDate?: string
  // record_expense fields
  category?: string
  paymentMethod?: string
  spentDate?: string
  note?: string
}

/**
 * @param reenterOps  op types this view can re-open in a form (default: receipts).
 *                    A conflict of another type shows Discard only.
 * @param onReenter   receives the rejected op's payload + its op type.
 */
export function OutboxConflicts({
  onReenter, reenterOps = ["record_receipt"],
}: {
  onReenter?: (p: ReenterPayload, opType: OutboxOpType) => void
  reenterOps?: OutboxOpType[]
}) {
  const [items, setItems] = React.useState<ConflictRecord[]>([])

  React.useEffect(() => {
    if (!isOutboxEnabled()) return
    let alive = true
    const refresh = async () => { const c = await listConflicts(); if (alive) setItems(c) }
    void refresh()
    const off = onOutboxChange(refresh)
    return () => { alive = false; off() }
  }, [])

  if (!isOutboxEnabled() || items.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <Icon name="AlertTriangle" size={16} />
        {items.length} offline {items.length === 1 ? "change" : "changes"} couldn&apos;t sync
      </div>
      <p className="mt-1 text-xs text-amber-800">These were saved on your device but the server rejected them. Re-enter to try again, or discard.</p>
      <ul className="mt-3 space-y-2">
        {items.map((c) => {
          const p = (c.payload || {}) as Record<string, any>
          return (
            <li key={c.key} className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-neutral-800">{c.label || `${c.opType}`}</div>
                <div className="truncate text-xs text-neutral-500">
                  {p.bookingId ? `Booking #${p.bookingId} · ` : ""}{reasonFor(c)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {onReenter && reenterOps.includes(c.opType) && (
                  <Button size="sm" variant="outline" className="h-7 border-amber-300 text-amber-900" onClick={() => { onReenter({ bookingId: p.bookingId, amount: p.amount, method: p.method, receivedDate: p.receivedDate, category: p.category, paymentMethod: p.paymentMethod, spentDate: p.spentDate, note: p.note }, c.opType); void removeConflict(c.key) }}>
                    Re-enter
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-neutral-500" onClick={() => void removeConflict(c.key)}>
                  Discard
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default OutboxConflicts

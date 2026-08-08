"use client"

/**
 * WWL-248 — the inventory audit trail was write-only.
 *
 * `listMovements` existed, `getItem` returned the last 30 movements, and the
 * model snapshots `stockBefore` / `stockAfter` inside a transaction so the
 * ledger can never drift from the running total. None of it was rendered
 * anywhere: no history view, no drill-in from a row, no way to see who changed
 * a count or why. An immutable audit trail nobody can read is not an audit
 * trail — it is storage.
 *
 * This is the read side. It matters more now that WWL-247 lets a movement
 * carry a supplier, an event, a date and a note: those fields exist to be
 * looked back at when the numbers disagree with the shelf.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  InventoryAPI,
  MOVEMENT_TYPE_LABELS,
  type InventoryItem,
  type InventoryMovement,
} from "@/lib/api/inventory"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)

const ADDS = new Set(["restock", "transfer_in"])
const SUBTRACTS = new Set(["consumed", "wastage", "transfer_out"])

/** Karachi-local day for a stored timestamp — the vendor's calendar, not UTC. */
const fmtDay = (iso: string | null | undefined) => {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

function deltaOf(m: InventoryMovement): { text: string; tone: string } {
  const before = num(m.stockBefore)
  const after = num(m.stockAfter)
  const delta = Math.round((after - before) * 1000) / 1000
  if (delta > 0) return { text: `+${delta}`, tone: "text-emerald-600 dark:text-emerald-400" }
  if (delta < 0) return { text: `${delta}`, tone: "text-red-600 dark:text-red-400" }
  return { text: "0", tone: "text-muted-foreground" }
}

/** Everything the movement recorded about WHY, in the order a vendor reads it. */
function contextOf(m: InventoryMovement): string[] {
  const bits: string[] = []
  if (m.reason) bits.push(m.reason)
  if (m.supplierName) bits.push(`from ${m.supplierName}`)
  if (m.booking) {
    const who = m.booking.customerName?.trim()
    bits.push(who ? `for ${who}'s event` : `for booking #${m.booking.id}`)
  } else if (m.bookingId) {
    bits.push(`for booking #${m.bookingId}`)
  }
  if (m.notes) bits.push(m.notes)
  return bits
}

export function InventoryHistoryDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: InventoryItem
}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory-movements", item?.id],
    queryFn: () => InventoryAPI.listMovements({ inventoryItemId: item!.id }),
    enabled: open && !!item,
  })

  const movements = data?.movements ?? []
  const unit = String(item?.unit ?? "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock history{item ? ` — ${item.name}` : ""}</DialogTitle>
          <DialogDescription>
            Every recorded movement, newest first. Current stock:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {num(item?.currentStock)} {unit}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Spinner size={16} /> Loading history…
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="AlertTriangle" size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Couldn&apos;t load this item&apos;s history.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {/* An empty ledger is a real, common state — stock seeded at creation
            has genuinely never moved. Say that, rather than implying failure. */}
        {!isLoading && !isError && movements.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Icon name="Clock" size={22} className="text-muted-foreground" />
            <p className="text-sm font-medium">No movements recorded yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              This item&apos;s stock is still exactly as it was entered. Every restock, use, wastage
              and stock-take you record from here on will be listed here with who did it and why.
            </p>
          </div>
        )}

        {!isLoading && !isError && movements.length > 0 && (
          <ol className="space-y-2">
            {movements.map((m) => {
              const d = deltaOf(m)
              const context = contextOf(m)
              return (
                <li key={m.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                      </span>
                      <span className={cn("text-sm font-semibold tabular-nums", d.tone)}>
                        {d.text} {unit}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtDay(m.occurredAt)}</span>
                  </div>

                  {/* The snapshot pair is the whole point of the audit trail:
                      it proves the running total was never edited behind the
                      vendor's back. */}
                  <div className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {num(m.stockBefore)} → <span className="font-medium text-foreground">{num(m.stockAfter)}</span> {unit}
                    {m.costPerUnit != null && (
                      <> · Rs {Math.round(num(m.costPerUnit)).toLocaleString("en-PK")}/{unit || "unit"}</>
                    )}
                    {m.totalCost != null && (
                      <> · total Rs {Math.round(num(m.totalCost)).toLocaleString("en-PK")}</>
                    )}
                  </div>

                  {context.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">{context.join(" · ")}</p>
                  )}

                  {/* Types that reduce stock without an event or a reason are
                      exactly the ones an owner wants to question later. */}
                  {SUBTRACTS.has(m.type) && context.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                      No reason or event recorded for this reduction.
                    </p>
                  )}
                  {ADDS.has(m.type) && !m.supplierName && !m.reason && (
                    <p className="mt-1.5 text-xs text-muted-foreground italic">No supplier recorded.</p>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default InventoryHistoryDialog

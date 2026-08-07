"use client"

/**
 * WWL-145 / 156 / 182 / 252 / 278 / 316 / 382 — the shared destructive confirm.
 *
 * Seven dialogs across the portal asked a vendor to approve an irreversible
 * action against a record they could not identify from the dialog:
 *
 *   Receipts    "This Rs 458,460 receipt will be removed."   — no customer,
 *               date, event or ref, on a ledger where the same vendor has two
 *               "Barat — Salman Rauf" receipts
 *   Expenses    "This Rs 46,400 entry will be removed."      — 55-row ledger
 *   Suppliers   "Remove this invoice?"                       — names nothing
 *   Fuel        "This fuel entry will be removed."           — names nothing
 *   Reviews     "delete this review by Zeeshan Akram?"       — the reviewer,
 *               not the rating, date, venue or a word of the review
 *
 * Two other things were wrong with the same copy:
 *
 *   WWL-156 — "This can't be undone" while every one of these models except
 *   Review is `paranoid: true`, so destroy() writes `deletedAt` and support can
 *   restore the row. Telling a panicking vendor it is gone forever is the wrong
 *   direction to be wrong in.
 *
 *   WWL-252 — Inventory promised "Banquet Chairs will be removed" for an item
 *   the server is guaranteed to refuse with a 409, with the button styled as
 *   though it would work.
 *
 * So this component takes the record's identifying fields rather than a
 * sentence, states reversibility truthfully per model, and refuses up front
 * when the action is already known to be impossible.
 */

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Icon } from "@/components/dashboard/shared/icon"

export interface ConfirmField {
  label: string
  /** Rendered as-is. Falsy / empty values are dropped rather than shown as "—". */
  value: React.ReactNode
}

export interface DestructiveConfirmProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** e.g. "Remove this receipt?" */
  title: string
  /** The fields that identify WHICH record this is. Empty values are dropped. */
  fields: ConfirmField[]
  /**
   * How permanent this really is.
   *   "soft"      — model is paranoid; the row is hidden, not erased
   *   "permanent" — the row is actually gone
   */
  reversibility: "soft" | "permanent"
  /** Anything else the vendor should weigh before confirming. */
  consequence?: React.ReactNode
  /**
   * Set when the action is already known to be impossible. The confirm button
   * is disabled and this is shown instead of a promise the server will refuse.
   */
  blockedReason?: string | null
  confirmLabel?: string
  onConfirm: () => void
  pending?: boolean
}

export function DestructiveConfirm({
  open,
  onOpenChange,
  title,
  fields,
  reversibility,
  consequence,
  blockedReason,
  confirmLabel = "Remove",
  onConfirm,
  pending,
}: DestructiveConfirmProps) {
  const shown = fields.filter(
    (f) => f.value !== null && f.value !== undefined && f.value !== "" && f.value !== false,
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {shown.length > 0 && (
                <dl className="divide-y rounded-lg border text-sm">
                  {shown.map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-4 px-3 py-1.5">
                      <dt className="shrink-0 text-xs text-muted-foreground">{f.label}</dt>
                      <dd className="min-w-0 truncate text-right font-medium text-foreground">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {consequence && <p className="text-sm">{consequence}</p>}

              {blockedReason ? (
                <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  <Icon name="AlertTriangle" size={15} className="mt-0.5 shrink-0" />
                  <span>{blockedReason}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {reversibility === "soft"
                    ? "This hides it from your ledger. The record is kept, so support can restore it if you ask."
                    : "This can't be undone."}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!blockedReason && (
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open while the request is in flight so a
                // failure is reported against the record it belongs to.
                e.preventDefault()
                onConfirm()
              }}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "Removing…" : confirmLabel}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DestructiveConfirm

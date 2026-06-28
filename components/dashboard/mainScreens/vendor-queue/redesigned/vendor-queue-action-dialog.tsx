"use client"

/**
 * Vendor-queue action dialog — redesigned sibling.
 *
 * Ported VERBATIM (same ActionKind set, same notes schema/validation, same
 * backend API calls and request bodies) from the original admin queue screen
 * (components/admin/VendorQueueTable.tsx), whose action dialog is an inline,
 * non-exported block. Rebuilt here on the redesign primitives (shared Dialog +
 * Textarea + redesign Button + Icon) so it can be reused by the redesigned view
 * without editing the original. Functional parity is the goal.
 */

import * as React from "react"
import {
  approveBusiness,
  rejectBusiness,
  requestChangesBusiness,
  suspendBusiness,
  restoreBusiness,
  type QueueBusiness,
} from "@/lib/api/adminQueue"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"

export type ActionKind = "approve" | "reject" | "request_changes" | "suspend" | "restore"

export interface PendingAction {
  kind: ActionKind
  business: QueueBusiness
}

/** Same API mapping as the original switch statement. */
async function runAction(kind: ActionKind, id: number, notes?: string): Promise<QueueBusiness> {
  switch (kind) {
    case "approve":
      return approveBusiness(id, notes)
    case "reject":
      return rejectBusiness(id, notes)
    case "request_changes":
      return requestChangesBusiness(id, notes)
    case "suspend":
      return suspendBusiness(id, notes)
    case "restore":
      return restoreBusiness(id, notes)
  }
}

const ACTION_LABEL: Record<ActionKind, string> = {
  approve: "Approve",
  reject: "Reject",
  request_changes: "Request changes",
  suspend: "Suspend",
  restore: "Restore",
}

interface VendorQueueActionDialogProps {
  pending: PendingAction | null
  submitting: boolean
  onCancel: () => void
  /** Called with the optional, trimmed notes (undefined when blank). */
  onConfirm: (notes: string | undefined) => void
}

/**
 * Presentation-only shell. The mutation lives in the view (useMutation), which
 * calls `runAction` exported below — keeping the same single source of API
 * mapping the original had inline.
 */
export function VendorQueueActionDialog({
  pending,
  submitting,
  onCancel,
  onConfirm,
}: VendorQueueActionDialogProps) {
  const [notes, setNotes] = React.useState("")

  // Reset the notes field whenever a new action is opened (matches the
  // original's setNotes("") on every action trigger).
  React.useEffect(() => {
    setNotes("")
  }, [pending?.kind, pending?.business.id])

  const kind = pending?.kind
  // Same copy rule as the original: these three states email the vendor.
  const emailsVendor = kind === "reject" || kind === "request_changes" || kind === "suspend"

  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kind ? ACTION_LABEL[kind] : ""} — {pending?.business.name}
          </DialogTitle>
          <DialogDescription>
            {emailsVendor
              ? "Notes will be emailed to the vendor."
              : "Optional notes recorded in the audit log."}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes for the vendor (optional)"
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(notes.trim() || undefined)}
            disabled={submitting}
            variant={kind === "reject" ? "destructive" : "default"}
          >
            {submitting ? (
              <>
                <Icon name="RefreshCw" size={14} className="mr-1.5 animate-spin" />
                Working…
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { runAction }

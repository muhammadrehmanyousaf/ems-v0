"use client"

/**
 * Drone-NOC per-permit status-transition dialogs (redesigned) — functional
 * parity for the redesigned Drone NOC screen. Ports the original screen's
 * ReasonDialog (same schema/validation/API body) onto the redesign primitives
 * and wires to DroneNocAPI.transition. The original drone-noc-view.tsx is
 * untouched.
 *
 * Status rules (mirrors the original per-permit actions):
 *   - Approve / Reject  → from status "pending" (admin-capable screens only)
 *   - Resubmit          → from status "rejected" | "cancelled"  → "pending"
 *   - Cancel            → from status "approved" | "expiring_soon" | "expired"
 *
 * Reject + Cancel require a free-text reason (statusReason), exactly like the
 * original ReasonDialog. Approve + Resubmit are reason-less confirmations.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { DroneNocAPI, type DroneNOC, type PermitStatus } from "@/lib/api/droneNoc"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.message || e?.message || fallback

/** Which statuses allow which action — shared with the view for gating. */
export const canApprove = (s: PermitStatus) => s === "pending"
export const canReject = (s: PermitStatus) => s === "pending"
export const canResubmit = (s: PermitStatus) => s === "rejected" || s === "cancelled"
export const canCancel = (s: PermitStatus) =>
  s === "approved" || s === "expiring_soon" || s === "expired"

/**
 * Reason-capturing transition dialog for "rejected" / "cancelled".
 * Verbatim behaviour of the original ReasonDialog: reason is required,
 * body is { to: action, statusReason: reason.trim() }.
 */
export function PermitReasonDialog({
  permit,
  action,
  title,
  description,
  placeholder,
  onOpenChange,
  onSaved,
}: {
  permit: DroneNOC | null
  action: "rejected" | "cancelled"
  title: string
  description: string
  placeholder?: string
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [reason, setReason] = React.useState("")
  React.useEffect(() => setReason(""), [permit?.id])

  const mut = useMutation({
    mutationFn: (p: DroneNOC) =>
      DroneNocAPI.transition(p.id, { to: action, statusReason: reason.trim() }),
    onSuccess: () => {
      showSuccessToast(`Permit ${action}`)
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e: any) => toast.error(errMsg(e, "Couldn't update permit")),
  })

  if (!permit) return null

  const submit = () => {
    if (!reason.trim()) {
      toast.error("Reason required")
      return
    }
    mut.mutate(permit)
  }

  return (
    <Dialog open={!!permit} onOpenChange={(v) => !mut.isPending && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title} — {permit.referenceNumber}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            placeholder ??
            (action === "rejected"
              ? "e.g. Drone weight exceeds permitted 7 kg threshold"
              : "e.g. Wedding cancelled by customer")
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Reason-less confirmation transition for "approved" / "pending" (resubmit).
 * Mirrors the original handleApprove / handleResubmit: body is { to }.
 */
export function PermitConfirmTransitionDialog({
  permit,
  to,
  title,
  description,
  confirmLabel,
  destructive,
  successMessage,
  onOpenChange,
  onSaved,
}: {
  permit: DroneNOC | null
  to: PermitStatus
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  successMessage: string
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const mut = useMutation({
    mutationFn: (p: DroneNOC) => DroneNocAPI.transition(p.id, { to }),
    onSuccess: () => {
      showSuccessToast(successMessage)
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e: any) => toast.error(errMsg(e, "Couldn't update permit")),
  })

  return (
    <AlertDialog open={!!permit} onOpenChange={(v) => !mut.isPending && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mut.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              if (permit) mut.mutate(permit)
            }}
            disabled={mut.isPending}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {mut.isPending && <Spinner className="mr-2 h-4 w-4" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

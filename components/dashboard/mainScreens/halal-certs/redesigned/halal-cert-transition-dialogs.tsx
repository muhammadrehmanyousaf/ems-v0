"use client"

/**
 * Halal certificate lifecycle-transition dialogs (redesigned) — functional
 * parity for the dropped lifecycle flows on the redesigned screen. Ported
 * verbatim from the original halal-certs-view.tsx internal RevokeDialog /
 * RenewDialog (same API body via HalalCertAPI.transition()), rebuilt with the
 * redesign primitives. The original file is left untouched.
 *
 * Flows:
 *   - RevokeCertDialog       -> transition({ to: "revoked", revokedReason })
 *   - RenewCertDialog        -> when status === "pending_renewal":
 *                                 transition({ to: "active", newCertNumber?, newExpiryDate? })
 *                               else:
 *                                 transition({ to: "pending_renewal" })
 */

import * as React from "react"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"
import { useMutation } from "@tanstack/react-query"
import { HalalCertAPI, type HalalCert } from "@/lib/api/halalCerts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// Karachi's today, not UTC's — for the first five hours of every Pakistani day
// `toISOString().slice(0,10)` returns yesterday, which would let a certificate
// expiring today pass as a valid renewal date.
import { todayInKarachi } from "@/lib/utils/pk-date"

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

/* ── Revoke ─────────────────────────────────────────────────────────────── */

export function RevokeCertDialog({
  cert,
  onOpenChange,
  onSaved,
}: {
  cert: HalalCert | null
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [reason, setReason] = React.useState("")
  React.useEffect(() => setReason(""), [cert?.id])

  const mut = useMutation({
    mutationFn: () =>
      HalalCertAPI.transition(cert!.id, { to: "revoked", revokedReason: reason.trim() }),
    onSuccess: () => {
      showSuccessToast("Certificate revoked")
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Couldn't revoke certificate"),
  })

  /**
   * WWL-327 — this checked the reason and fired toast.error("Revoke reason
   * required") AFTER the vendor pressed a live, destructive Revoke button. The
   * create dialog directly beside it already disables and explains. Revoking is
   * terminal, so being told the rule beforehand matters more here, not less.
   */
  const revokeBlocked = reason.trim() ? undefined : "Add the reason for revoking — it stays on the certificate's record."
  const submit = () => {
    if (revokeBlocked) return
    mut.mutate()
  }

  return (
    <Dialog open={!!cert} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revoke certificate{cert ? ` — ${cert.itemDescription}` : ""}</DialogTitle>
          <DialogDescription>
            Revoking is terminal. The certificate stays in your ledger but you&apos;ll need to add a
            new one for fresh supply.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <label className={labelCls}>Reason</label>
          <textarea
            className={cn(inputCls, "h-24 resize-y py-2")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Supplier lost their PHA certification"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancel
          </Button>
          <FormBlockedHint message={revokeBlocked} />
          <Button
            onClick={submit}
            disabled={mut.isPending || !!revokeBlocked}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mut.isPending ? (
              <>
                <Spinner size={14} className="mr-1.5" /> Revoking…
              </>
            ) : (
              <>
                <Icon name="ShieldAlert" size={15} className="mr-1.5" /> Revoke
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Renew (mark pending renewal / renewal received) ────────────────────── */

export function RenewCertDialog({
  cert,
  onOpenChange,
  onSaved,
}: {
  cert: HalalCert | null
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const isPending = cert?.status === "pending_renewal"
  const [newCertNumber, setNewCertNumber] = React.useState("")
  const [newExpiry, setNewExpiry] = React.useState("")

  React.useEffect(() => {
    setNewCertNumber("")
    setNewExpiry("")
  }, [cert?.id])

  /**
   * WWL-321 — both fields were optional, so pressing Reactivate with them blank
   * sent `{to: "active"}` alone: the status flipped to active while the row kept
   * its old, already-lapsed expiry date. On a halal register that is the one
   * transition that must not be possible without evidence — it makes an expired
   * certificate read as current, to the vendor, to an inspector, and to every
   * downstream compliance check.
   *
   * Renewal means a new certificate. It needs its number and its expiry, and the
   * expiry has to be in the future — a "renewal" dated in the past is the same
   * lapse wearing a new number.
   */
  const trimmedNumber = newCertNumber.trim()
  const today = todayInKarachi()
  const expiryInPast = !!newExpiry && newExpiry <= today
  const renewalProblem = !isPending
    ? null
    : !trimmedNumber
      ? "Enter the new certificate number."
      : !newExpiry
        ? "Enter the new expiry date."
        : expiryInPast
          ? "The new expiry date must be in the future — that date has already passed."
          : null

  const mut = useMutation({
    mutationFn: () =>
      isPending
        ? HalalCertAPI.transition(cert!.id, {
            to: "active",
            newCertNumber: trimmedNumber,
            newExpiryDate: newExpiry,
          })
        : HalalCertAPI.transition(cert!.id, { to: "pending_renewal" }),
    onSuccess: () => {
      showSuccessToast(isPending ? "Certificate reactivated" : "Marked pending renewal")
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Couldn't update certificate"),
  })

  return (
    <Dialog open={!!cert} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isPending ? "Renewal received" : "Mark pending renewal"}</DialogTitle>
          <DialogDescription>
            {isPending
              ? "A renewal is a new certificate — its number and expiry are both required before the row can go back to active."
              : "Track that you've sent the certificate for renewal. The old cert keeps its dates until you update."}
          </DialogDescription>
        </DialogHeader>
        {isPending && (
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className={labelCls}>New cert number *</label>
              <input
                className={cn(inputCls, "font-mono")}
                value={newCertNumber}
                onChange={(e) => setNewCertNumber(e.target.value)}
                placeholder="PHA-2026-0042"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>New expiry date *</label>
              <input
                type="date"
                className={inputCls}
                min={today}
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
            </div>
            {renewalProblem && (
              <p className="text-xs text-amber-700 dark:text-amber-400">{renewalProblem}</p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !!renewalProblem}>
            {mut.isPending ? (
              <>
                <Spinner size={14} className="mr-1.5" /> Saving…
              </>
            ) : (
              <>
                <Icon name="RefreshCw" size={15} className="mr-1.5" />
                {isPending ? "Reactivate" : "Mark pending"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

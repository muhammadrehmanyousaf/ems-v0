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

  const submit = () => {
    if (!reason.trim()) {
      toast.error("Revoke reason required")
      return
    }
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
          <Button
            onClick={submit}
            disabled={mut.isPending}
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

  const mut = useMutation({
    mutationFn: () =>
      isPending
        ? HalalCertAPI.transition(cert!.id, {
            to: "active",
            newCertNumber: newCertNumber || undefined,
            newExpiryDate: newExpiry || undefined,
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
              ? "Capture the new cert # and expiry date — the row reactivates."
              : "Track that you've sent the certificate for renewal. The old cert keeps its dates until you update."}
          </DialogDescription>
        </DialogHeader>
        {isPending && (
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className={labelCls}>New cert number</label>
              <input
                className={cn(inputCls, "font-mono")}
                value={newCertNumber}
                onChange={(e) => setNewCertNumber(e.target.value)}
                placeholder="PHA-2026-0042"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>New expiry date</label>
              <input
                type="date"
                className={inputCls}
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
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

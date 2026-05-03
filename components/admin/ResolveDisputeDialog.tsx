"use client"

// BK-067 — admin resolve-dispute dialog. Drives `disputeService.resolveDispute`
// (release/dismissed un-freezes payouts; refund leaves them frozen for the
// admin to run processRefund separately; forfeit denies a customer no-show
// claim per BK-039).

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { resolveDispute, type AdminDisputeRow, type DisputeResolution } from "@/lib/api/disputes"

const OPTIONS: { value: DisputeResolution; label: string; help: string }[] = [
  {
    value: "refund",
    label: "Refund customer",
    help: "Mark dispute resolved in customer's favour. Payouts stay frozen — run processRefund separately.",
  },
  {
    value: "release",
    label: "Release to vendor",
    help: "Reject the customer's claim. Frozen payouts revert to scheduled and the dispatcher will pay out.",
  },
  {
    value: "dismissed",
    label: "Dismiss",
    help: "Close without action (e.g. duplicate / withdrawn). Frozen payouts revert to scheduled.",
  },
  {
    value: "forfeit",
    label: "Confirm vendor no-show denial",
    help: "BK-039 — admin-confirmed customer no-show. Refund engine refuses subsequent customer-initiated claims.",
  },
]

interface Props {
  dispute: AdminDisputeRow | null
  onClose: () => void
  onResolved: () => void
}

export function ResolveDisputeDialog({ dispute, onClose, onResolved }: Props) {
  const [resolution, setResolution] = useState<DisputeResolution>("release")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Reset form when a new dispute opens.
  const open = !!dispute
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setResolution("release")
      setNotes("")
      onClose()
    }
  }

  const submit = async () => {
    if (!dispute) return
    setSubmitting(true)
    try {
      const r = await resolveDispute(dispute.id, {
        resolution,
        notes: notes.trim() || undefined,
      })
      toast({
        title: "Dispute resolved",
        description:
          r.restoredPayoutCount > 0
            ? `${r.restoredPayoutCount} payout(s) released to scheduled.`
            : "Resolution recorded.",
      })
      setResolution("release")
      setNotes("")
      onResolved()
    } catch (e: any) {
      const msg =
        e?.response?.data?.data?.code ??
        e?.response?.data?.message ??
        "Try again."
      toast({ title: "Couldn't resolve", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Resolve dispute — Booking #{dispute?.bookingId}
          </DialogTitle>
          <DialogDescription>
            {dispute?.booking?.customerName || dispute?.booking?.customerEmail || ""}
            {" — "}reason: {dispute?.reason ? dispute.reason.slice(0, 120) : ""}
            {dispute?.reason && dispute.reason.length > 120 ? "…" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-bridal-text-soft">
            Resolution
          </Label>
          <div className="space-y-2">
            {OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex gap-3 p-3 rounded border cursor-pointer transition ${
                  resolution === opt.value
                    ? "border-bridal-mauve bg-bridal-cream/40"
                    : "border-bridal-beige hover:border-bridal-mauve/50"
                }`}
              >
                <input
                  type="radio"
                  name="dispute-resolution"
                  value={opt.value}
                  checked={resolution === opt.value}
                  onChange={() => setResolution(opt.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-bridal-charcoal">
                    {opt.label}
                  </div>
                  <div className="text-xs text-bridal-text-soft mt-0.5">
                    {opt.help}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-bridal-text-soft">
              Notes (optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes, reasoning, links to evidence…"
              rows={3}
              maxLength={1000}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            variant={resolution === "refund" || resolution === "forfeit" ? "destructive" : "default"}
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

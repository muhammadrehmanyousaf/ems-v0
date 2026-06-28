"use client"

/**
 * Resolve-dispute dialog (redesigned, admin). Functional parity for the
 * redesigned Disputes queue. Wired to resolveDispute (pick an outcome + optional
 * note). Resolutions: refund / release / dismissed / forfeit.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { resolveDispute, type DisputeResolution } from "@/lib/api/disputes"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const RESOLUTIONS: { value: DisputeResolution; label: string; hint: string }[] = [
  { value: "refund", label: "Refund customer", hint: "Money returned to the customer" },
  { value: "release", label: "Release to vendor", hint: "Payout released to the vendor" },
  { value: "forfeit", label: "Forfeit advance", hint: "Advance kept by the vendor" },
  { value: "dismissed", label: "Dismiss dispute", hint: "No action — closed" },
]
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

export function ResolveDisputeDialog({
  open, onOpenChange, disputeId, label, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  disputeId?: number
  label?: string
  onSaved?: () => void
}) {
  const [resolution, setResolution] = React.useState<DisputeResolution>("refund")
  const [notes, setNotes] = React.useState("")
  React.useEffect(() => { if (open) { setResolution("refund"); setNotes("") } }, [open])

  const mut = useMutation({
    mutationFn: () => resolveDispute(disputeId!, { resolution, notes: notes.trim() || undefined }),
    onSuccess: (res: any) => { showSuccessToast(res?.restoredPayoutCount ? `Resolved — ${res.restoredPayoutCount} payout(s) restored` : "Dispute resolved"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't resolve dispute"),
  })
  const current = RESOLUTIONS.find((r) => r.value === resolution)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Resolve dispute</DialogTitle><DialogDescription>{label || "Choose an outcome for this dispute."}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className={labelCls}>Outcome</label>
            <select className={inputCls} value={resolution} onChange={(e) => setResolution(e.target.value as DisputeResolution)}>
              {RESOLUTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {current && <p className="text-[11px] text-muted-foreground">{current.hint}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Notes (optional)</label>
            <textarea className={cn(inputCls, "h-20 resize-y py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason / what was agreed" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!disputeId || mut.isPending} onClick={() => mut.mutate()}>{mut.isPending ? <><Spinner size={14} className="mr-1.5" /> Resolving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Resolve</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ResolveDisputeDialog

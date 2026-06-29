"use client"

/**
 * Promotion request dialog (redesigned) — functional parity for the redesigned
 * Promote screen. Wired to PromotionsAPI.create (vendor requests a paid placement;
 * admin approves/rejects, so this is create-only on the vendor side). Placement +
 * window options come from the pricing returned by listMine().
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { PromotionsAPI, type PricingPlacement, type PromotionPlacement } from "@/lib/api/promotions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function PromoteRequestDialog({
  open, onOpenChange, pricing, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  pricing: PricingPlacement[]
  businessId?: number
  onSaved?: () => void
}) {
  const [placement, setPlacement] = React.useState<PromotionPlacement | "">("")
  const [windowDays, setWindowDays] = React.useState<string>("")
  const [note, setNote] = React.useState("")

  React.useEffect(() => {
    if (open) {
      const first = pricing[0]
      setPlacement(first?.placement ?? "")
      setWindowDays(first?.prices?.[0] ? String(first.prices[0].windowDays) : "")
      setNote("")
    }
  }, [open, pricing])

  const current = pricing.find((p) => p.placement === placement)
  const priceFor = current?.prices.find((pr) => String(pr.windowDays) === windowDays)?.priceQuoted

  const onPlacement = (v: string) => {
    setPlacement(v as PromotionPlacement)
    const p = pricing.find((x) => x.placement === v)
    setWindowDays(p?.prices?.[0] ? String(p.prices[0].windowDays) : "")
  }

  const saveMut = useMutation({
    mutationFn: () => PromotionsAPI.create({ businessId: businessId!, placement: placement as PromotionPlacement, windowDays: Number(windowDays) || 0, note: note.trim() || undefined }),
    onSuccess: () => { showSuccessToast("Placement requested"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't request placement"),
  })
  const canSave = !!placement && !!windowDays && businessId != null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a placement</DialogTitle>
          <DialogDescription>Boost your visibility. Your request goes to admin for approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {pricing.length === 0 ? (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Promotion pricing isn't available right now.</div>
          ) : (
            <>
              <Field label="Placement">
                <select className={inputCls} value={placement} onChange={(e) => onPlacement(e.target.value)}>
                  {pricing.map((p) => <option key={p.placement} value={p.placement}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Duration">
                <select className={inputCls} value={windowDays} onChange={(e) => setWindowDays(e.target.value)}>
                  {(current?.prices ?? []).map((pr) => <option key={pr.windowDays} value={pr.windowDays}>{pr.windowDays} days — {formatPkr(pr.priceQuoted)}</option>)}
                </select>
              </Field>
              {priceFor != null && (
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Quoted price</span>
                  <span className="font-semibold tabular-nums text-primary">{formatPkr(priceFor)}</span>
                </div>
              )}
              <Field label="Note (optional)"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the admin should know" /></Field>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Sending…</> : <><Icon name="Send" size={15} className="mr-1.5" /> Request placement</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PromoteRequestDialog

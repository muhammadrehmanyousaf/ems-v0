"use client"

/**
 * Promotion request dialog (redesigned) — functional parity for the redesigned
 * Promote screen. Wired to PromotionsAPI.create (vendor requests a paid placement;
 * admin approves/rejects, so this is create-only on the vendor side). Placement +
 * window options come from the pricing returned by listMine().
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useMutation } from "@tanstack/react-query"
import { PromotionsAPI, type PricingPlacement, type PromotionPlacement } from "@/lib/api/promotions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"
import { RecordVenueField } from "@/components/dashboard/shared/record-venue-field"

/**
 * WWL-429 — measured under true touch emulation at 360px, both selects and both
 * footer buttons rendered 36px high, under the 44px minimum. The dialog itself
 * fits (360×558, no overflow), so the height is free to take: 44px on touch,
 * the tighter 36px kept from `sm` up where a pointer is precise.
 */
const inputCls = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2 sm:h-9"
const labelCls = "text-xs font-medium text-muted-foreground"

/** WWL-415 — mirrors the server's own `.slice(0, 1000)`. */
const NOTE_MAX = 1000

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
  /**
   * WWL-413 — `canSave` was `!!placement && !!windowDays && businessId != null`,
   * and BOTH selects were pre-populated on open, so the send button was enabled
   * the instant the dialog appeared. The pre-selection was `pricing[0]` and
   * `prices[0]` — Homepage hero, 7 days, Rs 5,000, the most expensive placement
   * in the catalog. Two clicks from the dashboard filed a Rs 5,000 request
   * against a venue the vendor was never shown.
   *
   * Nothing is pre-selected now, and there is a review step. A vendor should
   * have to state which placement and how long before money is quoted at them.
   */
  const [placement, setPlacement] = React.useState<PromotionPlacement | "">("")
  const [windowDays, setWindowDays] = React.useState<string>("")
  const [note, setNote] = React.useState("")
  const [venueId, setVenueId] = React.useState<string>(businessId != null ? String(businessId) : "")
  const [confirming, setConfirming] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setPlacement("")
      setWindowDays("")
      setNote("")
      setConfirming(false)
    }
  }, [open])

  React.useEffect(() => {
    if (businessId != null) setVenueId(String(businessId))
  }, [businessId])

  const effectiveBusinessId = venueId ? Number(venueId) : businessId
  const current = pricing.find((p) => p.placement === placement)
  const priceFor = current?.prices.find((pr) => String(pr.windowDays) === windowDays)?.priceQuoted

  const onPlacement = (v: string) => {
    setPlacement(v as PromotionPlacement)
    // Duration prices differ per placement, so a stale selection would quote a
    // number that belongs to a different product.
    setWindowDays("")
  }

  const saveMut = useMutation({
    mutationFn: () => PromotionsAPI.create({
      businessId: effectiveBusinessId!,
      placement: placement as PromotionPlacement,
      windowDays: Number(windowDays) || 0,
      note: note.trim() || undefined,
    }),
    onSuccess: () => { showSuccessToast("Placement requested"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't request placement")),
  })

  const noteTooLong = note.length > NOTE_MAX
  const canSave = !!placement && !!windowDays && effectiveBusinessId != null && !noteTooLong

  /**
   * WWL-414 — the hint read "Fill in the required fields above to save" and
   * could never appear: both selects always carried a value, so the only
   * reachable blocked state was a vendor with no business at all. Now that
   * nothing is pre-selected the hint is reachable, and it names what is
   * actually missing instead of gesturing at the form.
   */
  const blockedReason = canSave
    ? undefined
    : effectiveBusinessId == null
      ? "Choose which venue you want to promote."
      : !placement
        ? "Choose where you want to be featured."
        : !windowDays
          ? "Choose how long the placement should run."
          : noteTooLong
            ? `Your note is ${note.length} characters — the maximum is ${NOTE_MAX}.`
            : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a placement</DialogTitle>
          <DialogDescription>Boost your visibility. Your request goes to admin for approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {pricing.length === 0 ? (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Promotion pricing isn&apos;t available right now.</div>
          ) : (
            <>
              <RecordVenueField value={venueId} onChange={setVenueId} label="Venue to promote" noun="placement" />
              <Field label="Placement">
                <select className={inputCls} value={placement} onChange={(e) => onPlacement(e.target.value)}>
                  <option value="">Choose a placement…</option>
                  {pricing.map((p) => <option key={p.placement} value={p.placement}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Duration">
                <select className={inputCls} value={windowDays} onChange={(e) => setWindowDays(e.target.value)} disabled={!placement}>
                  <option value="">{placement ? "Choose a duration…" : "Pick a placement first"}</option>
                  {(current?.prices ?? []).map((pr) => <option key={pr.windowDays} value={pr.windowDays}>{pr.windowDays} days — {formatPkr(pr.priceQuoted)}</option>)}
                </select>
              </Field>
              {priceFor != null && (
                <div className="space-y-1.5 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Indicative price</span>
                    <span className="font-semibold tabular-nums text-primary">{formatPkr(priceFor)}</span>
                  </div>
                  {/**
                    * WWL-412 — the controller's own header says "Pricing is
                    * placeholder PKR (structure locked, numbers TBD with real
                    * vendors). The FE labels them 'indicative'." The word
                    * "indicative" appeared NOWHERE in this UI — only in a code
                    * comment no vendor reads — while four surfaces called it a
                    * quote. Requesting is not agreeing to pay, and a screen
                    * naming figures up to Rs 17,500 has to say so.
                    */}
                  <p className="text-xs text-muted-foreground">
                    Indicative only, and exclusive of tax. Requesting does not commit you to pay —
                    an admin confirms the final price with you before anything runs.
                  </p>
                </div>
              )}
              <Field label="Note (optional)">
                <textarea
                  className={cn(inputCls, "h-20 resize-y py-2")}
                  value={note}
                  maxLength={NOTE_MAX}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the admin should know"
                />
                {/**
                  * WWL-415 — the textarea had maxLength -1 while the server does
                  * `.slice(0, 1000)`. Driven live: 1,226 characters transmitted,
                  * 226 dropped server-side with no error and no acknowledgement,
                  * on the one free-text field a vendor has to explain
                  * themselves with.
                  */}
                {note.length > NOTE_MAX - 150 && (
                  <p className={cn("text-[11px] tabular-nums", note.length >= NOTE_MAX ? "text-destructive" : "text-muted-foreground")}>
                    {note.length} / {NOTE_MAX}
                  </p>
                )}
              </Field>
            </>
          )}
        </div>
        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {/**
            * WWL-413 — there was no confirmation step, no review screen and no
            * "you will be invoiced" line. The request is now stated back in
            * full before it is sent.
            */}
          {confirming && canSave ? (
            <>
              <p className="flex-1 text-xs text-muted-foreground">
                Send <span className="font-medium text-foreground">{current?.label}</span> for{" "}
                <span className="font-medium text-foreground">{windowDays} days</span>
                {priceFor != null && <> at an indicative <span className="font-medium text-foreground">{formatPkr(priceFor)}</span></>}?
              </p>
              <Button variant="ghost" className="h-11 sm:h-9" onClick={() => setConfirming(false)} disabled={saveMut.isPending}>Back</Button>
              <Button className="h-11 sm:h-9" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
                {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Sending…</> : <><Icon name="Send" size={15} className="mr-1.5" /> Yes, send it</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="h-11 sm:h-9" onClick={() => onOpenChange(false)}>Cancel</Button>
              <FormBlockedHint message={blockedReason} />
              <Button className="h-11 sm:h-9" disabled={!canSave} onClick={() => setConfirming(true)}>
                <Icon name="Send" size={15} className="mr-1.5" /> Review request
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PromoteRequestDialog

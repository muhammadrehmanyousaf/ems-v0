"use client"

/**
 * Invite-vendor dialog. Invites another vendor onto a job, matched to a Wedding
 * Wala account by phone or email.
 *
 * The phone and the email are not just contact details here — they are the two
 * KEYS the server matches on. A typo in either produces a permanently unmatched
 * invite that the success toast still reports as sent, so both are validated
 * before the request leaves (WWL-456).
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useMutation } from "@tanstack/react-query"
import { CollaborationsAPI } from "@/lib/api/collaborations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validateEmail,
  validatePkPhone,
  validatePkr,
} from "@/components/dashboard/primitives/field-error"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

function Field({
  id, label, children, className,
}: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {/* WWL-467 — all six labels here had htmlFor null and no input carried an
          id, so none of them was associated with anything. */}
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

export function InviteVendorDialog({
  open, onOpenChange, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [toName, setToName] = React.useState("")
  const [toPhone, setToPhone] = React.useState("")
  const [toEmail, setToEmail] = React.useState("")
  const [eventLabel, setEventLabel] = React.useState("")
  const [scope, setScope] = React.useState("")
  const [agreedAmount, setAgreedAmount] = React.useState("")
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (open) {
      setToName(""); setToPhone(""); setToEmail(""); setEventLabel(""); setScope(""); setAgreedAmount("")
      setTouched({})
    }
  }, [open])

  const saveMut = useMutation({
    mutationFn: () => CollaborationsAPI.send({
      toName: toName.trim() || undefined,
      toPhone: toPhone.trim() || undefined,
      toEmail: toEmail.trim() || undefined,
      eventLabel: eventLabel.trim() || undefined,
      scope: scope.trim() || undefined,
      agreedAmount: agreedAmount.trim() === "" ? undefined : Number(agreedAmount),
    }),
    onSuccess: (res: any) => {
      showSuccessToast(
        res?.matched
          ? "Invite sent — vendor matched, they've been notified"
          : "Invite saved — that vendor isn't on Wedding Wala yet, so they won't see it in-app",
      )
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't send invite")),
  })

  /* WWL-456 — the email was a bare text box: no type, no pattern, no
     validation. Driven live, `not-an-email` left Save enabled. */
  const phoneErr = toPhone.trim() ? validatePkPhone(toPhone, { required: false }) : undefined
  const emailErr = toEmail.trim() ? validateEmail(toEmail) : undefined
  /* WWL-455 — the amount input was type="number" with no min and no step, and
     nothing checked it. −5000 was accepted and transmitted, then clamped to 0
     server-side; an extra digit pushed it past DECIMAL(12,2) and was stored as
     null. Both silently, on the field that records what two vendors agreed. */
  const amountErr = agreedAmount.trim()
    ? validatePkr(agreedAmount, { label: "Agreed amount", allowZero: true })
    : undefined

  const hasName = !!toName.trim()
  const hasContact = !!(toPhone.trim() || toEmail.trim())
  const canSave = hasName && hasContact && !phoneErr && !emailErr && !amountErr

  /**
   * WWL-454 — this hint read "Add a name, a phone AND an email to save" while
   * the helper text three lines above it said "a phone OR email", and the rule
   * the button actually enforced was name + (phone or email). Three statements,
   * two of them wrong. It names the one thing that is missing now.
   */
  const blockedReason = canSave
    ? undefined
    : !hasName && !hasContact
      ? "Add the vendor's name and a phone or email to send this."
      : !hasName
        ? "Add the vendor's name to send this."
        : !hasContact
          ? "Add a phone or an email so we can match the vendor."
          : phoneErr || emailErr || amountErr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a vendor</DialogTitle>
          <DialogDescription>Bring another vendor onto a job. They&apos;ll get an invite to accept.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <Field id="collab-name" label="Vendor name">
            <input id="collab-name" className={inputCls} value={toName} onChange={(e) => setToName(e.target.value)} autoFocus />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="collab-phone" label="Phone">
              <input
                id="collab-phone"
                type="tel"
                inputMode="tel"
                className={cn(inputCls, touched.phone && phoneErr && ERROR_INPUT_CLS)}
                value={toPhone}
                onChange={(e) => setToPhone(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                placeholder="03xx-xxxxxxx"
                {...fieldAria("collab-phone", touched.phone ? phoneErr : undefined)}
              />
              <FieldError id="collab-phone" message={touched.phone ? phoneErr : undefined} />
            </Field>
            <Field id="collab-email" label="Email">
              <input
                id="collab-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={cn(inputCls, touched.email && emailErr && ERROR_INPUT_CLS)}
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="name@example.com"
                {...fieldAria("collab-email", touched.email ? emailErr : undefined)}
              />
              <FieldError id="collab-email" message={touched.email ? emailErr : undefined} />
            </Field>
          </div>
          <Field id="collab-event" label="Event / job">
            <input id="collab-event" className={inputCls} value={eventLabel} onChange={(e) => setEventLabel(e.target.value)} placeholder="e.g. Ahmed & Fatima walima" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="collab-scope" label="Scope">
              <input id="collab-scope" className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="e.g. Drone coverage" />
            </Field>
            <Field id="collab-amount" label="Agreed amount (Rs)">
              <input
                id="collab-amount"
                type="number"
                min={0}
                step="0.01"
                className={cn(inputCls, "tabular-nums", touched.amount && amountErr && ERROR_INPUT_CLS)}
                value={agreedAmount}
                onChange={(e) => setAgreedAmount(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                {...fieldAria("collab-amount", touched.amount ? amountErr : undefined)}
              />
              <FieldError id="collab-amount" message={touched.amount ? amountErr : undefined} />
            </Field>
          </div>
          <p className="text-[11px] text-muted-foreground">
            The phone or email is how we match them to their Wedding Wala account. If neither matches
            one, the invite is saved but they won&apos;t be notified in the app.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button className="h-11" disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending
              ? <><Spinner size={14} className="mr-1.5" /> Sending…</>
              : <><Icon name="Send" size={15} className="mr-1.5" /> Send invite</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InviteVendorDialog

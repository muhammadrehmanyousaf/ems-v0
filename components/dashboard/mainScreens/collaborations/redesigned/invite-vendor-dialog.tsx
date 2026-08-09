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
import { useMutation, useQuery } from "@tanstack/react-query"
import { CollaborationsAPI, type DirectoryVendor } from "@/lib/api/collaborations"
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

  /**
   * WHO to invite — the question this dialog never asked.
   *
   * It asked for a name, a phone and an email, and its own note warned that a
   * typo in either contact field "produces a permanently unmatched invite that
   * the success toast still reports as sent". Validating the FORMAT of a
   * stranger's contact details cannot fix that: 0300 1234567 is a perfectly
   * valid number belonging to somebody else. The only real fix is to stop
   * making the sender retype details the platform already holds.
   *
   * Search picks the vendor, the contact fields fill themselves, and the match
   * is exact by construction. Typing them by hand still works — that is how you
   * invite someone with no account, which is what the email invitation is for.
   */
  const [query, setQuery] = React.useState("")
  const [picked, setPicked] = React.useState<DirectoryVendor | null>(null)
  const debounced = useDebounced(query, 250)

  const { data: matches = [], isFetching: searching } = useQuery({
    queryKey: ["collab-directory", debounced],
    queryFn: () => CollaborationsAPI.directory(debounced),
    enabled: open && !picked && debounced.trim().length >= 2,
    staleTime: 30_000,
  })

  const choose = (v: DirectoryVendor) => {
    setPicked(v)
    setToName(v.fullName ?? "")
    setToEmail(v.email ?? "")
    setToPhone(v.phoneNumber ?? "")
    setQuery("")
    setTouched({})
  }
  const clearPick = () => { setPicked(null); setToName(""); setToEmail(""); setToPhone("") }

  React.useEffect(() => {
    if (open) {
      setToName(""); setToPhone(""); setToEmail(""); setEventLabel(""); setScope(""); setAgreedAmount("")
      setTouched({}); setQuery(""); setPicked(null)
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
          ? "Invite sent — they've been notified in the app"
          : res?.emailed
            ? "They're not on Wedding Wala yet — we've emailed them an invitation to join"
            : "Invite saved. Add an email address and we'll send them an invitation",
      )
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't send invite")),
  })

  /* WWL-456 — the email was a bare text box: no type, no pattern, no
     validation. Driven live, `not-an-email` left Save enabled.

     But these checks exist to catch a TYPO in a stranger's contact details, and
     a vendor chosen from the directory was not typed — they are matched by the
     record we already hold. Validating our own stored data and then refusing to
     send is the wrong way round: driven live, picking a real vendor whose
     phone is stored as "3274811220" (ten digits, no leading zero — perfectly
     dialable, just not the format this regex wants) disabled Send with no way
     forward. So the format checks apply to hand-typed details only. */
  const phoneErr = !picked && toPhone.trim() ? validatePkPhone(toPhone, { required: false }) : undefined
  const emailErr = !picked && toEmail.trim() ? validateEmail(toEmail) : undefined
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
      {/*
        The base DialogContent sets no max-height and no overflow, so a dialog
        simply grows past the screen and the overhang becomes unreachable —
        there is nothing to scroll. Measured at 360x800 with the directory
        picker in place: 914px of dialog in an 800px viewport, which put the
        title off the top edge and clipped Cancel at the bottom. A 360x640
        Android with browser chrome loses ~274px.

        Capped here rather than in components/ui/dialog.tsx: that base is shared
        by every dialog in a live product, and switching its overflow would clip
        any inline dropdown the others render. dvh (not vh) so the cap follows
        the mobile URL bar as it collapses.
      */}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a vendor</DialogTitle>
          <DialogDescription>Bring another vendor onto a job. They&apos;ll get an invite to accept.</DialogDescription>
        </DialogHeader>
        {/* Only the body scrolls, so Send/Cancel stay on screen at every height.
            min-h-0 is required — a flex child defaults to min-height:auto and
            would refuse to shrink, which silently defeats the cap. */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-1">
          {picked ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{picked.fullName || `Vendor #${picked.id}`}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {[picked.vendorType, picked.email, picked.phoneNumber].filter(Boolean).join(" \u00b7 ")}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  On Wedding Wala — they&apos;ll be notified in the app
                </span>
              </span>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={clearPick}>Change</Button>
            </div>
          ) : (
            <Field id="collab-invite-search" label="Find a vendor on Wedding Wala">
              <input
                id="collab-invite-search"
                className={inputCls}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email or phone"
                autoFocus
                autoComplete="off"
              />
              {debounced.trim().length >= 2 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  {searching && <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>}
                  {!searching && matches.length === 0 && (
                    <p className="px-3 py-2 text-xs leading-snug text-muted-foreground">
                      Nobody on Wedding Wala matches that. Fill in their details below and we&apos;ll email
                      them an invitation to join.
                    </p>
                  )}
                  {matches.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => choose(v)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{v.fullName || `Vendor #${v.id}`}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {[v.vendorType, v.email].filter(Boolean).join(" \u00b7 ")}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
          )}

          <Field id="collab-name" label="Vendor name">
            <input id="collab-name" className={inputCls} value={toName} onChange={(e) => setToName(e.target.value)} />
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
            The phone or email is how we match them to their Wedding Wala account. If neither matches one,
            we email that address an invitation with a link to join — and the moment they sign up, this
            invite lands in front of them and you get told.
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

/** Debounce, so the directory is searched per pause rather than per keystroke. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

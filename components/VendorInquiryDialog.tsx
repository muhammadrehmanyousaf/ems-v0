"use client"

/**
 * F-7 — public "Send an inquiry" dialog on a vendor's page.
 *
 * Lets a prospect ask about their date/price without committing to a booking.
 * Posts to the public POST /api/v1/leads/inquiry, which lands a form_inquiry Lead
 * in that vendor's inbox. No auth (anonymous prospects). Shows an in-dialog
 * success state so it doesn't depend on the marketing site's toast system.
 */

import { useState } from "react"
import { BACKEND_URL } from "@/lib/backend-url"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2 } from "lucide-react"

const EVENT_TYPES = [
  { value: "", label: "Not sure yet" },
  { value: "mehndi", label: "Mehndi" },
  { value: "nikah", label: "Nikah" },
  { value: "baraat", label: "Baraat" },
  { value: "walima", label: "Walima" },
  { value: "engagement", label: "Engagement" },
  { value: "dholki", label: "Dholki" },
  { value: "other", label: "Other" },
]

interface Props {
  businessId: number | string
  vendorName: string
  open: boolean
  onOpenChange: (v: boolean) => void
  /**
   * Optional reframing. The same form serves "ask a question" and a guest's
   * "request a quote" — both land the identical Lead in the vendor's inbox, and
   * the only honest difference is what the visitor thinks they are doing. Sent
   * as copy rather than a second component so there is one form to maintain.
   */
  title?: string
  description?: string
  initialMessage?: string
}

export default function VendorInquiryDialog({
  businessId,
  vendorName,
  open,
  onOpenChange,
  title,
  description,
  initialMessage,
}: Props) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", eventType: "", eventDate: "", guests: "", message: initialMessage ?? "", website: "" })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  // Errors only after a field is touched, so opening the dialog doesn't
  // immediately scold the customer about the empty phone they're about to type.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))

  /*
   * This is the marketplace's core conversion form and it had NO validation.
   * Verified live on production: phone "abc-not-a-phone", guests "-50" and
   * email "not-an-email" were all accepted, Send stayed enabled, the POST
   * returned 201, and the customer was told "…has it in their inbox and will
   * get back to you. Keep an eye on your phone."
   *
   * The vendor cannot ring "abc-not-a-phone". Both sides lose, silently.
   *
   * Kept deliberately permissive — 9+ digits covers PK mobiles, landlines and
   * international numbers. The point is to catch typos and junk, not to police
   * formatting, and never to block a real customer mid-enquiry.
   */
  const digits = form.phone.replace(/\D/g, "")
  const phoneUsable = digits.length >= 9 && digits.length <= 15
  const emailUsable = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.trim())
  const guestsNum = form.guests.trim() === "" ? null : Number(form.guests)

  const errs = {
    phone: form.phone.trim() && !phoneUsable
      ? "That doesn't look like a working number — the vendor replies here."
      : undefined,
    email: form.email.trim() && !emailUsable
      ? "That email doesn't look right."
      : undefined,
    guests: guestsNum != null && (!Number.isFinite(guestsNum) || guestsNum <= 0)
      ? "Guest count must be more than 0."
      : undefined,
  }
  const shown = {
    phone: touched.phone ? errs.phone : undefined,
    email: touched.email ? errs.email : undefined,
    guests: touched.guests ? errs.guests : undefined,
  }

  // A name alone is NOT enough: the vendor needs a channel to reply on.
  const contactable = phoneUsable || emailUsable
  const canSend = contactable && !errs.phone && !errs.email && !errs.guests

  const blockedReason = canSend
    ? undefined
    : Object.values(shown).some(Boolean)
      ? undefined
      : !form.phone.trim() && !form.email.trim()
        ? `Add your phone or email so ${vendorName} can reply.`
        : "Check your phone number or email — the vendor replies there."

  const reset = () => { setForm({ name: "", phone: "", email: "", eventType: "", eventDate: "", guests: "", message: "", website: "" }); setSent(false); setError(null) }

  const submit = async () => {
    if (!canSend || submitting) return
    setSubmitting(true); setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}api/v1/leads/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: Number(businessId),
          contactName: form.name.trim() || undefined,
          contactPhone: form.phone.trim() || undefined,
          contactEmail: form.email.trim() || undefined,
          eventType: form.eventType || undefined,
          eventDate: form.eventDate || undefined,
          estimatedGuests: form.guests ? Number(form.guests) : undefined,
          message: form.message.trim() || undefined,
          website: form.website, // honeypot — must stay empty
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || "Couldn't send your inquiry")
      setSent(true)
    } catch (e: any) {
      setError(e?.message || "Couldn't send your inquiry — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 200) }}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h3 className="text-lg font-semibold">Inquiry sent</h3>
            <p className="text-sm text-muted-foreground">{vendorName} has it in their inbox and will get back to you. Keep an eye on your phone.</p>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title ?? `Ask ${vendorName}`}</DialogTitle>
              <DialogDescription>
                {description ?? "Check your date, prices or packages — no commitment. They'll reply directly."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              {/* Honeypot — hidden from humans, catches bots */}
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={(e) => set("website", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inq-name">Your name</Label>
                  <Input id="inq-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ayesha" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inq-phone">Phone / WhatsApp</Label>
                  <Input
                    id="inq-phone"
                    value={form.phone}
                    onChange={(e) => { set("phone", e.target.value); touch("phone") }}
                    onBlur={() => touch("phone")}
                    placeholder="03xx-xxxxxxx"
                    inputMode="tel"
                    aria-invalid={shown.phone ? true : undefined}
                    aria-describedby={shown.phone ? "inq-phone-error" : undefined}
                    className={shown.phone ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                  {shown.phone && <p id="inq-phone-error" role="alert" className="text-xs text-destructive">{shown.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inq-event">Function</Label>
                  <select id="inq-event" value={form.eventType} onChange={(e) => set("eventType", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2">
                    {EVENT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inq-date">Event date</Label>
                  <Input id="inq-date" type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inq-guests">Guests (approx)</Label>
                  <Input
                    id="inq-guests"
                    type="number"
                    min={1}
                    value={form.guests}
                    onChange={(e) => { set("guests", e.target.value); touch("guests") }}
                    onBlur={() => touch("guests")}
                    placeholder="350"
                    inputMode="numeric"
                    aria-invalid={shown.guests ? true : undefined}
                    aria-describedby={shown.guests ? "inq-guests-error" : undefined}
                    className={shown.guests ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                  {shown.guests && <p id="inq-guests-error" role="alert" className="text-xs text-destructive">{shown.guests}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inq-email">Email (optional)</Label>
                  <Input
                    id="inq-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => { set("email", e.target.value); touch("email") }}
                    onBlur={() => touch("email")}
                    placeholder="you@email.com"
                    aria-invalid={shown.email ? true : undefined}
                    aria-describedby={shown.email ? "inq-email-error" : undefined}
                    className={shown.email ? "border-destructive focus-visible:ring-destructive" : undefined}
                  />
                  {shown.email && <p id="inq-email-error" role="alert" className="text-xs text-destructive">{shown.email}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inq-msg">Message</Label>
                <Textarea id="inq-msg" value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="e.g. Is 14 Feb free? What's your Walima package for ~350 guests?" rows={3} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={!canSend || submitting} onClick={submit}>
                {submitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…</> : "Send inquiry"}
              </Button>
              {/* A disabled button is not feedback — say what it's waiting for.
                  The old copy said "name or phone" and never changed, even once
                  the name was filled in. */}
              <p className="text-center text-[11px] text-muted-foreground">
                {blockedReason ?? `${vendorName} will reply on the phone or email you gave.`}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

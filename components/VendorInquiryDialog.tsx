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
}

export default function VendorInquiryDialog({ businessId, vendorName, open, onOpenChange }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", eventType: "", eventDate: "", guests: "", message: "", website: "" })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const canSend = form.name.trim().length > 0 || form.phone.trim().length > 0

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
              <DialogTitle>Ask {vendorName}</DialogTitle>
              <DialogDescription>Check your date, prices or packages — no commitment. They&apos;ll reply directly.</DialogDescription>
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
                  <Input id="inq-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03xx-xxxxxxx" inputMode="tel" />
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
                  <Input id="inq-guests" type="number" value={form.guests} onChange={(e) => set("guests", e.target.value)} placeholder="350" inputMode="numeric" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inq-email">Email (optional)</Label>
                  <Input id="inq-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" />
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
              <p className="text-center text-[11px] text-muted-foreground">Add your name or phone so {vendorName} can reply.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

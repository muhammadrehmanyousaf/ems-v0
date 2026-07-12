"use client"

/**
 * FEAT_QUOTE_NEGOTIATION — customer "Request a quote" dialog on a vendor's page.
 *
 * A LOGGED-IN customer opens a price negotiation with a vendor (Pakistani
 * weddings are all haggled — "last price?"). Posts the authed
 * POST /api/v1/quotes → a CustomOrder inquiry in the vendor's incoming-quotes
 * inbox, trackable by the customer at /user/quotes. Flag-gated + hidden when the
 * feature is dark; the caller only mounts this when enabled + authenticated.
 */

import { useState } from "react"
import Link from "next/link"
import { QuotesAPI, QUOTE_EVENT_TYPES } from "@/lib/api/quotes"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2 } from "lucide-react"

interface Props {
  businessId: number | string
  vendorName: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function RequestQuoteDialog({ businessId, vendorName, open, onOpenChange }: Props) {
  const [form, setForm] = useState({ eventType: "", eventDate: "", guestCount: "", notes: "" })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const reset = () => { setForm({ eventType: "", eventDate: "", guestCount: "", notes: "" }); setSent(false); setError(null) }

  const submit = async () => {
    if (submitting) return
    setSubmitting(true); setError(null)
    try {
      await QuotesAPI.create({
        businessId: Number(businessId),
        eventType: form.eventType || undefined,
        eventDate: form.eventDate || undefined,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        notes: form.notes.trim() || undefined,
      })
      setSent(true)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Couldn't send your request — please try again")
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
            <h3 className="text-lg font-semibold">Quote requested</h3>
            <p className="text-sm text-muted-foreground">
              {vendorName} will send you a price. You can accept it, or counter with your own — track it under My quotes.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
              <Button asChild><Link href="/user/quotes">View my quotes</Link></Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a quote from {vendorName}</DialogTitle>
              <DialogDescription>Tell them about your event and they&apos;ll send you a price. Then haggle — accept or counter.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rq-event">Function</Label>
                  <select id="rq-event" value={form.eventType} onChange={(e) => set("eventType", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2">
                    {QUOTE_EVENT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rq-date">Event date</Label>
                  <Input id="rq-date" type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rq-guests">Guests (approx)</Label>
                <Input id="rq-guests" type="number" inputMode="numeric" value={form.guestCount} onChange={(e) => set("guestCount", e.target.value)} placeholder="350" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rq-notes">Anything else?</Label>
                <Textarea id="rq-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} maxLength={200}
                  placeholder="e.g. Need stage + lighting, budget is tight — what's your best price?" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={submitting} onClick={submit}>
                {submitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…</> : "Request quote"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

/**
 * FEAT_QUOTE_NEGOTIATION — shared price-entry dialog for the haggle loop.
 *
 * Used by BOTH sides: the vendor to send/counter a price, the customer to
 * counter. The caller wires onSubmit to QuotesAPI.respond / .counter.
 *
 * WW-QUOTE-PIPELINE — it now has two modes:
 *
 *   Just a price   the original single-number quote, unchanged. Still the right
 *                  shape for a customer countering ("can you do 1.1?") and for
 *                  a vendor who genuinely has one number to give.
 *   Itemised       a real quotation: hall, menu × heads, extras, discount, with
 *                  a validity date. This is what a venue actually negotiates,
 *                  because the conversation is "keep the hall, drop Platinum to
 *                  Gold" — which one number cannot express.
 *
 * The mode is offered (`allowItemised`) only to the party issuing a quotation,
 * and the total shown is computed by the same rules the server will apply.
 */

import { useState, useEffect, useMemo } from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { QuoteLinesEditor } from "@/components/quotes/quote-document"
import { priceQuoteLines, formatPkr, type QuoteLine, type QuoteDocumentInput } from "@/lib/api/quotes"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  ctaLabel?: string
  /** Prefill the amount (e.g. the current price when countering). */
  initialPrice?: number | null
  /** Offer the itemised builder — the party issuing a quotation. */
  allowItemised?: boolean
  /** Prefill the builder from the quote currently on the table. */
  initialLines?: QuoteLine[] | null
  /** Drives the per-head columns. */
  guestCount?: number | null
  initialValidUntil?: string | null
  initialEventTime?: string | null
  onSubmit: (price: number, message?: string, extras?: QuoteDocumentInput) => Promise<void>
}

export function NegotiateDialog({
  open,
  onOpenChange,
  title,
  description,
  ctaLabel = "Send",
  initialPrice,
  allowItemised = false,
  initialLines,
  guestCount,
  initialValidUntil,
  initialEventTime,
  onSubmit,
}: Props) {
  const [price, setPrice] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemised, setItemised] = useState(false)
  const [lines, setLines] = useState<QuoteLine[]>([])
  const [validUntil, setValidUntil] = useState<string>("")
  const [eventTime, setEventTime] = useState<string>("")

  useEffect(() => {
    if (!open) return
    setPrice(initialPrice != null ? String(initialPrice) : "")
    setMessage("")
    setError(null)
    const seeded = Array.isArray(initialLines) ? initialLines : []
    setLines(seeded)
    // Reopen in whichever mode the standing quote is already in — dropping a
    // vendor back to a single number after they built a document would silently
    // discard it on the next counter.
    setItemised(allowItemised && seeded.length > 0)
    setValidUntil(initialValidUntil ? String(initialValidUntil).slice(0, 10) : "")
    setEventTime(initialEventTime ? String(initialEventTime).slice(0, 5) : "")
  }, [open, initialPrice, initialLines, allowItemised, initialValidUntil, initialEventTime])

  const doc = useMemo(() => priceQuoteLines(lines, guestCount ?? 0), [lines, guestCount])

  // Mirrors the server's guards so its refusal is never the first the vendor
  // hears of a bad row.
  const lineProblem = useMemo(() => {
    if (!itemised) return null
    if (lines.length === 0) return "Add at least one line."
    for (const l of lines) {
      if (!l.label.trim()) return "Every line needs a label."
      if (!Number.isFinite(l.unitPrice)) return "Every line needs a price."
      if (l.kind === "discount" && l.unitPrice > 0) return `"${l.label || "Discount"}" must be negative.`
      if (l.kind !== "discount" && l.unitPrice < 0) return `"${l.label}" can't be negative — use a discount line.`
      if (l.unit === "percent" && Math.abs(l.unitPrice) > 100) return `"${l.label}" must be between −100 and 100.`
      if (l.unit === "per_head" && !(Number(l.qty) > 0) && !(Number(guestCount) > 0))
        return `"${l.label}" is per head, but there's no guest count — set a quantity.`
    }
    if (doc.total <= 0) return "The quote must come to more than zero."
    return null
  }, [itemised, lines, doc.total, guestCount])

  const amount = itemised ? doc.total : Number(price)
  const canSend = Number.isFinite(amount) && amount > 0 && !submitting && !lineProblem

  const submit = async () => {
    if (!canSend) return
    setSubmitting(true)
    setError(null)
    try {
      const extras: QuoteDocumentInput | undefined = itemised
        ? {
            lineItems: lines.map(({ total, ...l }) => l),
            validUntil: validUntil || null,
            eventTime: eventTime || null,
          }
        : validUntil || eventTime
          ? { validUntil: validUntil || null, eventTime: eventTime || null }
          : undefined
      await onSubmit(Math.round(amount * 100) / 100, message.trim() || undefined, extras)
      onOpenChange(false)
    } catch (e: any) {
      setError(errorMessage(e, "Couldn't send — please try again"))
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={itemised ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto py-1">
          {allowItemised && (
            <div className="flex rounded-md border border-border p-0.5 text-sm">
              {[
                { v: false, label: "Just a price" },
                { v: true, label: "Itemised quotation" },
              ].map((opt) => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setItemised(opt.v)}
                  className={
                    "flex-1 rounded px-3 py-1.5 transition-colors " +
                    (itemised === opt.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {itemised ? (
            <QuoteLinesEditor lines={lines} guestCount={guestCount ?? null} onChange={setLines} />
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="quote-price">Price (PKR)</Label>
              <Input
                id="quote-price"
                type="number"
                inputMode="numeric"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 250000"
                autoFocus
              />
            </div>
          )}

          {allowItemised && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                {/* A quoted peak-season Saturday that stands forever is a
                    standing liability on the venue's scarcest asset. */}
                <Label htmlFor="quote-valid">Hold this price until</Label>
                <Input
                  id="quote-valid"
                  type="date"
                  min={today}
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                {/* Without a slot an accepted quote has nothing to book. */}
                <Label htmlFor="quote-time">Sitting / start time</Label>
                <Input
                  id="quote-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="quote-message">Note (optional)</Label>
            <Textarea
              id="quote-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Includes stage + lighting. Best I can do for your date."
              rows={3}
              maxLength={200}
            />
          </div>

          {lineProblem && <p className="text-sm text-amber-700 dark:text-amber-400">{lineProblem}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          {itemised && lines.length > 0 && (
            <span className="text-sm tabular-nums text-muted-foreground">
              Total <span className="font-semibold text-foreground">{formatPkr(doc.total)}</span>
            </span>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={!canSend}>
              {submitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…</> : ctaLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NegotiateDialog

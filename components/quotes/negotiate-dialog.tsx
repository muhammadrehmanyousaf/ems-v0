"use client"

/**
 * FEAT_QUOTE_NEGOTIATION — shared price-entry dialog for the haggle loop.
 *
 * Used by BOTH sides: the vendor to send/counter a price, the customer to
 * counter. Enter a rupee amount + an optional short note ("best I can do for
 * 350 guests"). The caller wires onSubmit to QuotesAPI.respond / .counter.
 */

import { useState, useEffect } from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  ctaLabel?: string
  /** Prefill the amount (e.g. the current price when countering). */
  initialPrice?: number | null
  onSubmit: (price: number, message?: string) => Promise<void>
}

export function NegotiateDialog({ open, onOpenChange, title, description, ctaLabel = "Send", initialPrice, onSubmit }: Props) {
  const [price, setPrice] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPrice(initialPrice != null ? String(initialPrice) : "")
      setMessage("")
      setError(null)
    }
  }, [open, initialPrice])

  const amount = Number(price)
  const canSend = Number.isFinite(amount) && amount > 0 && !submitting

  const submit = async () => {
    if (!canSend) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(Math.round(amount * 100) / 100, message.trim() || undefined)
      onOpenChange(false)
    } catch (e: any) {
      setError(errorMessage(e, "Couldn't send — please try again"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 py-1">
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
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={!canSend}>
            {submitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…</> : ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NegotiateDialog

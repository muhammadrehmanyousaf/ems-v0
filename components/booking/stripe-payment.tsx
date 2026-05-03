"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, CheckCircle, XCircle, CreditCard, ExternalLink, Shield } from "lucide-react"
import { PaymentAPI } from "@/lib/api/payments"
import { toast } from "@/components/ui/use-toast"

interface StripePaymentProps {
  isOpen: boolean
  onClose: () => void
  bookingId: number
  customerEmail: string
  paymentType: 'down_payment' | 'remaining_payment' | 'full_payment'
  amount: number
  currency: string
  businessName: string
  onPaymentSuccess: () => void
  onPaymentFailure: () => void
}

export default function StripePayment({
  isOpen,
  onClose,
  bookingId,
  customerEmail,
  paymentType,
  amount,
  currency,
  businessName,
  onPaymentSuccess,
  onPaymentFailure
}: StripePaymentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'creating' | 'redirecting' | 'failed'>('idle')
  const isCreatingRef = useRef(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setStatus('idle')
      setLoading(false)
      isCreatingRef.current = false
    }
  }, [isOpen])

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case 'down_payment': return 'Down Payment'
      case 'remaining_payment': return 'Remaining Payment'
      case 'full_payment': return 'Full Payment'
      default: return 'Payment'
    }
  }

  const handlePayNow = async () => {
    if (isCreatingRef.current || loading) return
    isCreatingRef.current = true

    try {
      setLoading(true)
      setError(null)
      setStatus('creating')

      if (!bookingId || isNaN(Number(bookingId))) {
        throw new Error(`Invalid booking ID: ${bookingId}`)
      }

      // Create Checkout Session via backend
      const { url } = await PaymentAPI.createCheckoutSession(
        Number(bookingId),
        customerEmail,
        paymentType
      )

      if (!url) {
        throw new Error('No checkout URL returned from server')
      }

      setStatus('redirecting')
      toast({
        title: "Redirecting to Stripe",
        description: "You'll be redirected to a secure Stripe payment page.",
      })

      // Redirect to Stripe Checkout
      window.location.href = url

    } catch (err: any) {
      let errorMessage = err.message || 'Failed to create checkout session'
      if (errorMessage.includes('Booking not found')) {
        errorMessage = `Booking #${bookingId} not found. Please ensure the booking was created successfully.`
      }
      setError(errorMessage)
      setStatus('failed')
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      isCreatingRef.current = false
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && status === 'redirecting') return
    if (!open) onClose()
  }

  // Failed state
  if (status === 'failed') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-bridal-cream border border-bridal-beige rounded-md">
          <DialogHeader>
            <DialogTitle className="text-center font-display italic text-[24px] text-bridal-coral">
              Payment setup failed
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-bridal-coral/15 border border-bridal-coral/40 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-bridal-coral" />
            </div>
            <p className="font-bridal text-[13px] text-bridal-text-soft">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handlePayNow}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center h-11 rounded-[4px] border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Redirecting state
  if (status === 'redirecting') {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md bg-bridal-cream border border-bridal-beige rounded-md">
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-bridal-gold mx-auto" />
            <div>
              <p className="font-display italic text-[22px] text-bridal-charcoal">Redirecting to Stripe…</p>
              <p className="font-bridal text-[13px] text-bridal-text-soft mt-1">You&apos;ll be taken to a secure payment page</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Default: show payment summary + Pay button
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-bridal-cream border border-bridal-beige rounded-md">
        {/* Header */}
        <div className="relative bg-bridal-charcoal px-6 pt-6 pb-5 text-bridal-ivory overflow-hidden">
          <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <DialogHeader className="relative">
            <p className="font-bridal text-[10px] uppercase tracking-[0.32em] font-medium text-bridal-gold mb-1.5">
              Secure payment
            </p>
            <DialogTitle className="font-display italic text-[24px] text-bridal-ivory leading-tight">
              {paymentType === 'down_payment' ? 'Pay down payment' : paymentType === 'full_payment' ? 'Pay full amount' : 'Pay remaining balance'}
            </DialogTitle>
            <DialogDescription className="font-bridal text-[12px] text-bridal-ivory/75 mt-1.5">
              Processed via Stripe — your card details never touch our servers.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Payment Summary */}
          <div className="bg-bridal-ivory rounded-md p-4 border border-bridal-beige space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Payment Type</span>
              <span className="font-display italic text-[14px] text-bridal-charcoal">{getPaymentTypeLabel()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Business</span>
              <span className="font-bridal text-[13px] font-medium text-bridal-charcoal">{businessName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Booking</span>
              <span className="font-bridal text-[13px] font-medium text-bridal-charcoal">#{bookingId}</span>
            </div>
            <div className="border-t border-bridal-beige/70 pt-3">
              <div className="flex items-end justify-between">
                <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-text-label">Amount</span>
                <span className="font-display italic text-[28px] text-bridal-gold-dark leading-none">
                  Rs. {Number(amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 font-bridal text-[11.5px] text-bridal-text-soft justify-center">
            <Shield className="h-3.5 w-3.5 text-bridal-gold" />
            <span>Secured by Stripe. Your card details never touch our servers.</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePayNow}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)] transition-all duration-300 disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay Rs. {Number(amount).toLocaleString()}
                  <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-60" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center rounded-[4px] font-bridal text-[12px] uppercase tracking-[0.22em] font-medium text-bridal-text-soft hover:text-bridal-charcoal hover:bg-bridal-blush/55 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

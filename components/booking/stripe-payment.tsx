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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-red-600">
              Payment Setup Failed
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-neutral-600 text-sm">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <div className="space-y-2">
              <Button
                onClick={handlePayNow}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">
                Cancel
              </Button>
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
        <DialogContent className="max-w-md">
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-neutral-900">Redirecting to Stripe...</p>
              <p className="text-sm text-neutral-500 mt-1">You&apos;ll be taken to a secure payment page</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Default: show payment summary + Pay button
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-6 pb-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {paymentType === 'down_payment' ? 'Pay Down Payment' : paymentType === 'full_payment' ? 'Pay Full Amount' : 'Pay Remaining Balance'}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm">
              Secure payment via Stripe
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Payment Summary */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Payment Type</span>
              <span className="text-sm font-semibold text-neutral-800">{getPaymentTypeLabel()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Business</span>
              <span className="text-sm font-medium text-neutral-700">{businessName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Booking</span>
              <span className="text-sm font-medium text-neutral-700">#{bookingId}</span>
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-neutral-700">Amount</span>
                <span className="text-xl font-bold text-neutral-900">
                  Rs. {Number(amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 justify-center">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured by Stripe. Your card details never touch our servers.</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handlePayNow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Setting up...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pay Rs. {Number(amount).toLocaleString()}
                  <ExternalLink className="h-4 w-4 ml-1 opacity-60" />
                </div>
              )}
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full text-neutral-500" disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

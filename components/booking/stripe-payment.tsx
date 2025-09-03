"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, CheckCircle, XCircle, CreditCard, DollarSign, Calendar, Building } from "lucide-react"
import type { PaymentIntent } from "@/lib/types"
import { PaymentAPI } from "@/lib/api/payments"
import { toast } from "@/components/ui/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"

// Initialize Stripe promise with env fallback and provided key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51RbTluRs24VuP7A1EhiDNQpQZyCcmOn0hUJeywoJmEdqXym9gkxJq2TQhEKdkscR96JNqMsnN7AvILqkfSqAN5zN00lqAqdSYB"
)

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
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending')

  useEffect(() => {
    if (isOpen && !paymentIntent) {
      createPaymentIntent()
    }
  }, [isOpen])

  const createPaymentIntent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 StripePayment: Creating payment intent with:', {
        bookingId,
        customerEmail,
        paymentType,
        bookingIdType: typeof bookingId,
        paymentTypeDetails: {
          isDownPayment: paymentType === 'down_payment',
          isRemainingPayment: paymentType === 'remaining_payment',
          isFullPayment: paymentType === 'full_payment'
        }
      })
      
      // Validate bookingId
      if (!bookingId || isNaN(Number(bookingId))) {
        throw new Error(`Invalid booking ID: ${bookingId}`)
      }
      
      // Verify booking exists before creating payment intent
      const bookingExists = await PaymentAPI.verifyBookingExists(Number(bookingId))
      if (!bookingExists) {
        throw new Error(`Booking #${bookingId} not found. Please ensure the booking was created successfully.`)
      }
      
      console.log('🔍 StripePayment: About to call PaymentAPI.createPaymentIntent with:', {
        bookingId: Number(bookingId),
        customerEmail,
        paymentType
      })
      
      const response = await PaymentAPI.createPaymentIntent(
        Number(bookingId),
        customerEmail,
        paymentType
      )
      
      console.log('🔍 StripePayment: Payment intent response:', response)
      
      if (response.status) {
        setPaymentIntent(response.data)
        setPaymentStatus('processing')
      } else {
        throw new Error(response.message || 'Failed to create payment intent')
      }
    } catch (err: any) {
      console.error('🔍 StripePayment: Payment intent error:', err)
      
      // Handle specific error cases
      let errorMessage = err.message || 'Failed to create payment intent'
      
      if (errorMessage.includes('Booking not found')) {
        errorMessage = `Booking #${bookingId} not found. Please ensure the booking was created successfully.`
      } else if (errorMessage.includes('not found')) {
        errorMessage = `The requested resource was not found. Please check your booking details.`
      }
      
      setError(errorMessage)
      setPaymentStatus('failed')
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 StripePayment: Processing payment success for:', {
        paymentType,
        bookingId,
        isDownPayment: paymentType === 'down_payment',
        isRemainingPayment: paymentType === 'remaining_payment'
      })
      
      if (paymentType === 'down_payment') {
        console.log('🔍 StripePayment: Calling processDownPayment for booking:', bookingId)
        await PaymentAPI.processDownPayment(bookingId)
      } else if (paymentType === 'remaining_payment') {
        console.log('🔍 StripePayment: Calling processRemainingPayment for booking:', bookingId)
        await PaymentAPI.processRemainingPayment(bookingId)
      } else if (paymentType === 'full_payment') {
        console.log('🔍 StripePayment: Calling processFullPayment for booking:', bookingId)
        await PaymentAPI.processFullPayment(bookingId)
      } else {
        console.log('🔍 StripePayment: Unknown payment type:', paymentType)
      }
      
      setPaymentStatus('success')
      toast({
        title: "Payment Successful!",
        description: `${paymentType === 'down_payment' ? 'Down payment' : paymentType === 'full_payment' ? 'Full payment' : 'Payment'} processed successfully`,
      })
      
      setTimeout(() => {
        onPaymentSuccess()
        onClose()
      }, 2000)
      
    } catch (err: any) {
      console.error('🔍 StripePayment: Payment processing error:', err)
      setPaymentStatus('failed')
      setError(err.message || 'Failed to process payment')
      toast({
        title: "Payment Processing Error",
        description: err.message || 'Failed to process payment',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentFailure = () => {
    setPaymentStatus('failed')
    setError('Payment was cancelled or failed')
    onPaymentFailure()
  }

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case 'down_payment':
        return 'Down Payment'
      case 'remaining_payment':
        return 'Remaining Payment'
      case 'full_payment':
        return 'Full Payment'
      default:
        return 'Payment'
    }
  }

  const getPaymentTypeColor = () => {
    switch (paymentType) {
      case 'down_payment':
        return 'bg-green-100 text-green-800'
      case 'remaining_payment':
        return 'bg-blue-100 text-blue-800'
      case 'full_payment':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (paymentStatus === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-600">
              Payment Successful!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-neutral-900">
                {getPaymentTypeLabel()} Completed
              </p>
              <p className="text-neutral-600">
                Your {paymentType === 'down_payment' ? 'down payment has been processed' : paymentType === 'full_payment' ? 'full payment has been completed' : 'payment has been completed'} successfully.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                <p><strong>Amount:</strong> ${amount} {currency.toUpperCase()}</p>
                <p><strong>Booking ID:</strong> #{bookingId}</p>
                <p><strong>Business:</strong> {businessName}</p>
              </div>
            </div>
            
            <Button 
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-red-600">
              Payment Failed
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-neutral-900">
                Payment Unsuccessful
              </p>
              <p className="text-neutral-600">
                {error || 'Something went wrong with your payment. Please try again.'}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={createPaymentIntent}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
              
              <Button 
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {paymentType === 'down_payment' ? 'Pay Down Payment' : paymentType === 'full_payment' ? 'Pay Full Amount' : 'Pay Remaining Funds'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600">
            Complete your payment to secure your booking
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto overflow-x-hidden max-h-[60vh] sm:max-h-[70vh]">
          {paymentIntent && (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
              <CheckoutForm 
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentFailure}
                onCancel={onClose}
                paymentType={paymentType}
                bookingId={bookingId.toString()}
              />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Stripe Checkout Form Component
const CheckoutForm = ({ 
  onSuccess, 
  onError, 
  onCancel, 
  paymentType, 
  bookingId 
}: {
  onSuccess: (paymentType: string, bookingId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  paymentType: string;
  bookingId: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      onError('Stripe is not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: typeof window !== 'undefined' ? `${window.location.origin}/user/payments?bookingId=${bookingId}` : undefined,
        },
      });

      if (result.error) {
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onSuccess(paymentType, bookingId);
      }
    } catch (error) {
      onError('Payment failed unexpectedly');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
};

"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, Clock, CheckCircle, AlertCircle, Calendar, Building, Users, CreditCard, RefreshCw, Zap } from "lucide-react"
import { PaymentAPI } from "@/lib/api/payments"
import type { PendingPayment, PaymentHistory } from "@/lib/types"
import dynamic from "next/dynamic"

const StripePayment = dynamic(() => import("@/components/booking/stripe-payment"), { ssr: false })
import { toast } from "@/components/ui/use-toast"
import { getUser } from "@/hooks/getLoggedinUser"

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <PaymentsPageContent />
    </Suspense>
  )
}

function PaymentsPageContent() {
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const { user } = getUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionVerifiedRef = useRef(false)

  // Handle Stripe Checkout return — verify session_id from URL
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const bookingId = searchParams.get('bookingId')
    const paymentType = searchParams.get('paymentType')
    const cancelled = searchParams.get('cancelled')

    if (cancelled) {
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the payment. You can try again anytime.",
        variant: "destructive"
      })
      // Clean URL params
      router.replace('/user/payments')
      return
    }

    if (sessionId && !sessionVerifiedRef.current) {
      sessionVerifiedRef.current = true
      verifyStripeSession(sessionId, bookingId ? Number(bookingId) : undefined, paymentType || undefined)
    }
  }, [searchParams])

  const verifyStripeSession = async (sessionId: string, bookingId?: number, paymentType?: string) => {
    try {
      toast({
        title: "Verifying Payment",
        description: "Please wait while we confirm your payment...",
      })

      const result = await PaymentAPI.verifyCheckoutSession(sessionId, bookingId, paymentType)

      if (result.alreadyProcessed) {
        toast({
          title: "Payment Already Processed",
          description: "This payment was already recorded. Refreshing your data.",
        })
      } else {
        // Process vendor payouts based on payment type
        const pType = result.paymentType || paymentType || 'down_payment'
        try {
          if (pType === 'down_payment') {
            await PaymentAPI.processDownPayment(result.bookingId)
          } else if (pType === 'remaining_payment') {
            await PaymentAPI.processRemainingPayment(result.bookingId)
          } else if (pType === 'full_payment') {
            await PaymentAPI.processFullPayment(result.bookingId)
          }
        } catch (processErr: any) {
          console.error('Payout processing error (non-critical):', processErr)
        }

        toast({
          title: "Payment Successful!",
          description: `Your ${pType === 'down_payment' ? 'down payment' : pType === 'full_payment' ? 'full payment' : 'remaining payment'} of Rs. ${Number(result.amount).toLocaleString()} has been processed.`,
        })
      }

      // Refresh data and clean URL
      await fetchPayments()
      router.replace('/user/payments')

    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.message || "Could not verify the payment. Please contact support.",
        variant: "destructive"
      })
      router.replace('/user/payments')
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Fetch user's bookings and organize them by payment status
      const { pendingPayments: pending, paymentHistory: history } = await PaymentAPI.getUserBookings()
      
      setPendingPayments(pending)
      setPaymentHistory(history)
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSelect = (payment: PendingPayment, paymentTypeOverride?: 'down_payment' | 'full_payment') => {
    // Use override payment type if provided, otherwise use the payment's default type
    const selectedPaymentType = paymentTypeOverride || payment.paymentType
    
    // Validate payment can be made based on exact status requirements (case-insensitive)
    if (selectedPaymentType === 'down_payment') {
      if (payment.status?.toLowerCase() !== 'pending' || payment.paymentStatus?.toLowerCase() !== 'pending') {
        toast({
          title: "Payment Error",
          description: `Down payment can only be made for pending bookings with pending payment status. Current: ${payment.status}/${payment.paymentStatus}`,
          variant: "destructive"
        })
        return
      }
    }
    
    if (selectedPaymentType === 'remaining_payment') {
      if (payment.status?.toLowerCase() !== 'confirmed' || payment.paymentStatus?.toLowerCase() !== 'partial') {
        toast({
          title: "Payment Error",
          description: `Remaining payment can only be made for confirmed bookings with partial payment status. Current: ${payment.status}/${payment.paymentStatus}`,
          variant: "destructive"
        })
        return
      }
    }
    
    if (selectedPaymentType === 'full_payment') {
      if (payment.status?.toLowerCase() !== 'pending' || payment.paymentStatus?.toLowerCase() !== 'pending') {
        toast({
          title: "Payment Error",
          description: `Full payment can only be made for pending bookings with pending payment status. Current: ${payment.status}/${payment.paymentStatus}`,
          variant: "destructive"
        })
        return
      }
    }
    
    // Don't allow payment for completed bookings
    if (payment.status?.toLowerCase() === 'completed' && payment.paymentStatus?.toLowerCase() === 'paid') {
      toast({
        title: "Payment Error",
        description: "This booking is already completed and paid.",
        variant: "destructive"
      })
      return
    }
   
    // Create a modified payment object with the selected payment type and amount
    const modifiedPayment = {
      ...payment,
      paymentType: selectedPaymentType,
      amount: selectedPaymentType === 'full_payment' ? (payment.totalAmount || payment.amount) : payment.amount
    }
   
    setSelectedPayment(modifiedPayment)
    setPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false)
    setSelectedPayment(null)
    fetchPayments() // Refresh the data
    toast({
      title: "Success",
      description: "Payment processed successfully",
    })
  }

  const handlePaymentFailure = () => {
    setPaymentModalOpen(false)
    setSelectedPayment(null)
  }

  const handleCleanupDuplicates = async () => {
    try {
      setLoading(true)
      toast({
        title: "Cleaning up duplicate payment intents...",
        description: "This may take a moment",
      })
      
      // Call cleanup endpoint (this would need to be implemented in the backend)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payments/cleanup-duplicates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        toast({
          title: "Cleanup Complete",
          description: "Duplicate payment intents have been cleaned up",
        })
        fetchPayments() // Refresh the data
      } else {
        throw new Error('Failed to cleanup duplicates')
      }
    } catch (error: any) {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to cleanup duplicate payment intents",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'down_payment':
        return 'Down Payment'
      case 'remaining_payment':
        return 'Remaining Payment'
      case 'full_payment':
        return 'Full Payment'
      default:
        return type
    }
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | string, currency?: string) => {
    const num = Number(amount) || 0
    return `Rs. ${num.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header skeleton */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 skeleton-shimmer rounded-full" />
              <div className="h-9 w-36 skeleton-shimmer rounded-lg" />
            </div>
            <div className="h-4 w-80 skeleton-shimmer rounded mx-auto mb-4" />
            <div className="flex gap-3 justify-center">
              <div className="h-9 w-36 skeleton-shimmer rounded-lg" />
              <div className="h-9 w-40 skeleton-shimmer rounded-lg" />
            </div>
          </div>

          {/* Payment info card skeleton */}
          <Card className="border-2 border-blue-100 bg-blue-50/50 mb-6">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 skeleton-shimmer rounded" />
                <div className="h-5 w-48 skeleton-shimmer rounded" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="text-center p-2 bg-white rounded-lg border">
                    <div className="h-6 w-10 skeleton-shimmer rounded mx-auto mb-1" />
                    <div className="h-3 w-20 skeleton-shimmer rounded mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {["green", "purple", "blue", "amber"].map((color) => (
              <Card key={color} className={`border-2 border-${color}-100`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 skeleton-shimmer rounded-full" />
                    <div>
                      <div className="h-3 w-24 skeleton-shimmer rounded mb-2" />
                      <div className="h-7 w-10 skeleton-shimmer rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs skeleton */}
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1 w-full max-w-2xl">
              <div className="h-10 skeleton-shimmer rounded-md" />
              <div className="h-10 bg-transparent rounded-md" />
            </div>
          </div>

          {/* Payment cards skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-2 border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-6 w-28 skeleton-shimmer rounded-full" />
                    <div className="h-6 w-20 skeleton-shimmer rounded-full" />
                  </div>
                  <div className="h-5 w-32 skeleton-shimmer rounded" />
                  <div className="h-4 w-44 skeleton-shimmer rounded mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-amber-200 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-28 skeleton-shimmer rounded" />
                      <div className="h-5 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="h-3 w-32 skeleton-shimmer rounded" />
                  </div>
                  <div className="h-10 w-full skeleton-shimmer rounded-lg" />
                  <div className="h-10 w-full skeleton-shimmer rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">Payments</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage your payments, track pending amounts, and view your complete payment history
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={fetchPayments} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Payments
            </Button>
            <Button 
              onClick={handleCleanupDuplicates} 
              variant="outline" 
              className="flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
              disabled={loading}
            >
              <AlertCircle className="h-4 w-4" />
              Cleanup Duplicates
            </Button>
          </div>
        </div>

        {/* Payment Status Summary Card */}
        <Card className="border-2 border-blue-200 bg-blue-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Payment Status Summary</span>
            </div>
            
            {/* Payment Options Info */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-2">💡 Payment Options Explained</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium text-green-700">Down Payment:</span>
                    <span className="text-gray-600"> Pay a portion now, complete payment later</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium text-purple-700">Full Payment:</span>
                    <span className="text-gray-600"> Pay complete amount and finish booking</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-blue-700">{pendingPayments.length + paymentHistory.length}</div>
                <div className="text-blue-600">Total Bookings</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-yellow-700">
                  {pendingPayments.filter(p => p.status === 'pending' && p.paymentStatus === 'pending' && p.paymentType === 'down_payment').length}
                </div>
                <div className="text-yellow-600">Down Payment Due</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-purple-700">
                  {pendingPayments.filter(p => p.status === 'pending' && p.paymentStatus === 'pending' && p.paymentType === 'full_payment').length}
                </div>
                <div className="text-purple-600">Full Payment Due</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-blue-700">
                  {pendingPayments.filter(p => p.status === 'confirmed' && p.paymentStatus === 'partial').length}
                </div>
                <div className="text-blue-600">Remaining Due</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-green-700">
                  {paymentHistory.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-green-600">Completed</div>
              </div>
            </div>
            {/* Payment Amounts Summary */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
                <div className="text-lg font-bold text-yellow-700">
                  Rs. {pendingPayments
                    .filter(p => p.paymentType === 'down_payment')
                    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-yellow-600">Down Payments Due</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-lg font-bold text-purple-700">
                  Rs. {pendingPayments
                    .filter(p => p.paymentType === 'full_payment')
                    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-purple-600">Full Payments Due</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-lg font-bold text-blue-700">
                  Rs. {pendingPayments
                    .filter(p => p.paymentType === 'remaining_payment')
                    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-blue-600">Remaining Due</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                <div className="text-lg font-bold text-red-700">
                  Rs. {pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()}
                </div>
                <div className="text-red-600">Total Due</div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-white rounded-lg border text-xs text-gray-600">
              <strong>Status Logic:</strong> Down Payment (pending/pending) | Full Payment (pending/pending) | Remaining (confirmed/partial) | Completed (completed/paid)
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Pending Payments</p>
                  <p className="text-2xl font-bold text-green-700">{pendingPayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-purple-50/80">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Full Payments Due</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {pendingPayments.filter(p => p.paymentType === 'full_payment').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Completed Payments</p>
                  <p className="text-2xl font-bold text-blue-700">{paymentHistory.filter(p => p.status === 'completed').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">Total Transactions</p>
                  <p className="text-2xl font-bold text-amber-700">{paymentHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Payments
              {pendingPayments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingPayments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Payment History
            </TabsTrigger>
          </TabsList>

          {/* Pending Payments Tab */}
          <TabsContent value="pending" className="space-y-6">
            {pendingPayments.length === 0 ? (
              <Card className="border-2 border-dashed border-neutral-300">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Pending Payments Found</h3>
                  <p className="text-neutral-600 mb-4">
                    No pending payments found. This could mean:
                  </p>
                  <div className="text-sm text-neutral-500 space-y-1">
                    <p>• All your bookings are already paid</p>
                    <p>• Your bookings don't have payment status set</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingPayments.map((payment) => (
                  <Card key={payment.id} className={`border-2 hover:shadow-lg transition-all duration-200 ${
                    payment.paymentType === 'full_payment' 
                      ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-purple-50/80'
                      : payment.paymentType === 'remaining_payment'
                      ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
                      : 'border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getPaymentTypeColor(payment.paymentType)}>
                          {payment.paymentType === 'full_payment' && <Zap className="h-3 w-3 mr-1" />}
                          {getPaymentTypeLabel(payment.paymentType)}
                        </Badge>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-neutral-800">
                        Booking #{payment.bookingId}
                      </CardTitle>
                      <CardDescription className="text-neutral-600">
                        {payment.customerName} • {formatDate(payment.bookingDate)}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Business Information */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Building className="h-4 w-4" />
                          <span>Business:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {payment.businesses.map((business, index) => (
                            <Badge key={index} variant="outline" className="bg-white">
                              {business.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className={`bg-white rounded-lg p-4 border ${
                        payment.paymentType === 'full_payment' 
                          ? 'border-purple-200'
                          : payment.paymentType === 'remaining_payment'
                          ? 'border-blue-200'
                          : 'border-amber-200'
                      }`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">Payment Amount:</span>
                            <span className="text-lg font-bold text-neutral-800">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500">
                            Created: {formatDate(payment.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Show based on payment status */}
                      {(payment.paymentStatus?.toLowerCase() === 'pending' && payment.status?.toLowerCase() === 'pending') && (
                        <div className="space-y-3">
                          {payment.paymentType === 'full_payment' && (
                            <div className="text-center p-2 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-center justify-center gap-2 text-purple-700">
                                <Zap className="h-4 w-4" />
                                <span className="text-sm font-medium">Full Payment Required</span>
                              </div>
                              <div className="text-xs text-purple-600 mt-1">
                                This booking requires the full amount upfront
                              </div>
                            </div>
                          )}
                          {payment.paymentType === 'down_payment' && (
                            <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-center gap-2 text-green-700">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-sm font-medium">Payment Options Available</span>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                Choose between down payment or pay the full amount
                              </div>
                            </div>
                          )}
                          
                          {/* Payment Option Buttons */}
                          <div className="space-y-2">
                            {/* Down Payment Button */}
                            <Button
                              onClick={() => handlePaymentSelect(payment, 'down_payment')}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Pay Down Payment (Rs. {Number(payment.amount).toLocaleString()})
                            </Button>
                            
                            {/* Full Payment Button */}
                            <Button
                              onClick={() => handlePaymentSelect(payment, 'full_payment')}
                              variant="outline"
                              className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                            >
                              <Zap className="mr-2 h-4 w-4" />
                              Pay Full Amount (Rs. {Number(payment.totalAmount).toLocaleString()})
                            </Button>
                          </div>
                          
                          {/* Payment Comparison Info */}
                          <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Down Payment:</span> Rs. {Number(payment.amount).toLocaleString()} •
                              <span className="font-medium"> Full Amount:</span> Rs. {Number(payment.totalAmount).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Pay full amount to complete your booking immediately
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(payment.paymentStatus?.toLowerCase() === 'partial' && payment.status?.toLowerCase() === 'confirmed') && (
                        <div className="space-y-2">
                          <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-center gap-2 text-blue-700">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm font-medium">Remaining Payment Due</span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Complete your booking with the remaining balance
                            </div>
                          </div>
                          <Button
                            onClick={() => handlePaymentSelect(payment)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Remaining Funds (Rs. {Number(payment.amount).toLocaleString()})
                          </Button>
                        </div>
                      )}
                      
                      {(payment.paymentStatus?.toLowerCase() === 'paid' && payment.status?.toLowerCase() === 'completed') && (
                        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-5 w-4 text-green-600 mx-auto mb-1" />
                          <span className="text-sm text-green-700 font-medium">Booking Completed</span>
                        </div>
                      )}
                      
                      {/* Show payment status and amount info */}
                      <div className={`text-center p-3 rounded-lg border ${
                        payment.paymentType === 'full_payment' 
                          ? 'bg-purple-50 border-purple-200'
                          : payment.paymentType === 'remaining_payment'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className={`text-sm ${
                          payment.paymentType === 'full_payment' 
                            ? 'text-purple-700'
                            : payment.paymentType === 'remaining_payment'
                            ? 'text-blue-700'
                            : 'text-green-700'
                        }`}>
                          <span className="font-medium">Total Booking:</span> Rs. {Number(payment.totalAmount).toLocaleString()}
                        </div>
                        <div className={`text-xs ${
                          payment.paymentType === 'full_payment' 
                            ? 'text-purple-600'
                            : payment.paymentType === 'remaining_payment'
                            ? 'text-blue-600'
                            : 'text-green-600'
                        }`}>
                          {payment.paymentType === 'down_payment' 
                            ? `Down Payment: Rs. ${Number(payment.amount).toLocaleString()}`
                            : payment.paymentType === 'remaining_payment'
                            ? `Remaining: Rs. ${Number(payment.amount).toLocaleString()}`
                            : payment.paymentType === 'full_payment'
                            ? `Full Payment: Rs. ${Number(payment.amount).toLocaleString()}`
                            : `Payment: Rs. ${Number(payment.amount).toLocaleString()}`
                          }
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Status: {payment.status} | Payment: {payment.paymentStatus}
                        </div>
                        {payment.paymentType === 'down_payment' && (
                          <div className="text-xs text-purple-600 mt-2 font-medium">
                            💡 You can also pay the full amount (Rs. {Number(payment.totalAmount).toLocaleString()}) to complete your booking
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-6">
            {paymentHistory.length === 0 ? (
              <Card className="border-2 border-dashed border-neutral-300">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Payment History</h3>
                  <p className="text-neutral-600">Your payment history will appear here once you make your first payment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <Card key={payment.id} className="border border-neutral-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge className={getPaymentTypeColor(payment.paymentType)}>
                            {getPaymentTypeLabel(payment.paymentType)}
                          </Badge>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-neutral-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          {payment.totalAmount && payment.totalAmount !== payment.amount && (
                            <div className="text-sm text-neutral-600">
                              Total: {formatCurrency(payment.totalAmount, payment.currency)}
                            </div>
                          )}
                          <div className="text-sm text-neutral-500">
                            {formatDate(payment.createdAt)}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            ✓ {payment.paymentType === 'full_payment' ? 'Completed' : 'Paid'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {payment.bookingDetails?.customerName && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-neutral-500" />
                            <span className="text-neutral-600">Customer:</span>
                            <span className="font-medium text-neutral-800">{payment.bookingDetails.customerName}</span>
                          </div>
                        )}
                        {payment.bookingDetails?.bookingDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-neutral-500" />
                            <span className="text-neutral-600">Event Date:</span>
                            <span className="text-neutral-800">{formatDate(payment.bookingDetails.bookingDate)}</span>
                          </div>
                        )}
                        {payment.bookingDetails?.businesses && payment.bookingDetails.businesses.length > 0 && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <Building className="h-4 w-4 text-neutral-500" />
                            <span className="text-neutral-600">Business:</span>
                            <span className="font-medium text-neutral-800">
                              {payment.bookingDetails.businesses.map(b => b.name).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Modal */}
        {selectedPayment && (
          <StripePayment
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            bookingId={selectedPayment.bookingId}
            customerEmail={user?.email || ''}
            paymentType={selectedPayment.paymentType}
            amount={selectedPayment.amount}
            currency={selectedPayment.currency}
            businessName={selectedPayment.businesses[0]?.name || 'Business'}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        )}
      </div>
    </div>
  )
}

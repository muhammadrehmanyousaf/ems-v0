"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, Clock, CheckCircle, AlertCircle, Calendar, Building, Users, CreditCard, RefreshCw } from "lucide-react"
import { PaymentAPI } from "@/lib/api/payments"
import type { PendingPayment, PaymentHistory } from "@/lib/types"
import StripePayment from "@/components/booking/stripe-payment"
import { toast } from "@/components/ui/use-toast"
import { getUser } from "@/hooks/getLoggedinUser"

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const { user } = getUser()

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Fetch user's bookings and organize them by payment status
      const { pendingPayments: pending, paymentHistory: history } = await PaymentAPI.getUserBookings()
      
      console.log('🔍 PaymentsPage: Raw data from API:', { pending, history })
      console.log('🔍 PaymentsPage: Pending count:', pending.length, 'History count:', history.length)
      
      // Log some details about pending payments to see their status
      if (pending.length > 0) {
        console.log('🔍 PaymentsPage: First pending payment:', {
          id: pending[0].id,
          status: pending[0].status,
          paymentStatus: pending[0].paymentStatus,
          paymentType: pending[0].paymentType
        })
      }
      
      setPendingPayments(pending)
      setPaymentHistory(history)
      
    } catch (error: any) {
      console.error('Error fetching payments:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSelect = (payment: PendingPayment) => {
    // Validate payment can be made based on exact status requirements (case-insensitive)
    if (payment.paymentType === 'down_payment') {
      if (payment.status?.toLowerCase() !== 'pending' || payment.paymentStatus?.toLowerCase() !== 'pending') {
        toast({
          title: "Payment Error",
          description: `Down payment can only be made for pending bookings with pending payment status. Current: ${payment.status}/${payment.paymentStatus}`,
          variant: "destructive"
        })
        return
      }
    }
    
    if (payment.paymentType === 'remaining_payment') {
      if (payment.status?.toLowerCase() !== 'confirmed' || payment.paymentStatus?.toLowerCase() !== 'partial') {
        toast({
          title: "Payment Error",
          description: `Remaining payment can only be made for confirmed bookings with partial payment status. Current: ${payment.status}/${payment.paymentStatus}`,
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
   
    setSelectedPayment(payment)
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto mb-4" />
              <p className="text-neutral-600">Loading payments...</p>
            </div>
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
          <div className="mt-4">
            <Button 
              onClick={fetchPayments} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Payments
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-blue-700">{pendingPayments.length + paymentHistory.length}</div>
                <div className="text-blue-600">Total Bookings</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-yellow-700">
                  {pendingPayments.filter(p => p.status === 'pending' && p.paymentStatus === 'pending').length}
                </div>
                <div className="text-yellow-600">Down Payment Due</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-blue-700">
                  {pendingPayments.filter(p => p.status === 'confirmed' && p.paymentStatus === 'partial').length}
                </div>
                <div className="text-blue-600">Remaining Due</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border">
                <div className="text-lg font-bold text-green-700">
                  {paymentHistory.filter(p => p.status === 'completed' && p.paymentType === 'full_payment').length}
                </div>
                <div className="text-green-600">Completed</div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-white rounded-lg border text-xs text-gray-600">
              <strong>Status Logic:</strong> Down Payment (pending/pending) | Remaining (confirmed/partial) | Completed (completed/paid)
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          <Card className="border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Transactions</p>
                  <p className="text-2xl font-bold text-purple-700">{paymentHistory.length}</p>
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
                  <Card key={payment.id} className="border-2 border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getPaymentTypeColor(payment.paymentType)}>
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
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
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

                      {/* Action Button - Show based on payment status */}
                      {(payment.paymentStatus?.toLowerCase() === 'pending' && payment.status?.toLowerCase() === 'pending') && (
                        <Button
                          onClick={() => handlePaymentSelect(payment)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay Down Payment (${payment.amount})
                        </Button>
                      )}
                      
                      {(payment.paymentStatus?.toLowerCase() === 'partial' && payment.status?.toLowerCase() === 'confirmed') && (
                        <Button
                          onClick={() => handlePaymentSelect(payment)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay Remaining Funds (${payment.amount})
                        </Button>
                      )}
                      
                      {(payment.paymentStatus?.toLowerCase() === 'paid' && payment.status?.toLowerCase() === 'completed') && (
                        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-5 w-4 text-green-600 mx-auto mb-1" />
                          <span className="text-sm text-green-700 font-medium">Booking Completed</span>
                        </div>
                      )}
                      
                      {/* Show payment status and amount info */}
                      <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-700">
                          <span className="font-medium">Total Booking:</span> ${payment.totalAmount}
                        </div>
                        <div className="text-xs text-blue-600">
                          {payment.paymentType === 'down_payment' 
                            ? `Down Payment: $${payment.amount}` 
                            : payment.paymentType === 'remaining_payment'
                            ? `Remaining: $${payment.amount}`
                            : `Full Payment: $${payment.amount}`
                          }
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Status: {payment.status} | Payment: {payment.paymentStatus}
                        </div>
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

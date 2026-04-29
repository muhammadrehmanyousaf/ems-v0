"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Clock, CheckCircle2, CreditCard, Wallet, RefreshCw,
  Calendar, MapPin, Building2, ChevronRight, AlertTriangle,
  ArrowRight, TrendingUp, Loader2, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentAPI } from "@/lib/api/payments";
import type { PendingPayment, PaymentHistory } from "@/lib/types";
import dynamic from "next/dynamic";
import { toast } from "@/components/ui/use-toast";
import { getUser } from "@/hooks/getLoggedinUser";

const StripePayment = dynamic(() => import("@/components/booking/stripe-payment"), { ssr: false });

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number | string | null | undefined) =>
  `Rs. ${Number(n || 0).toLocaleString()}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const sk = (s: string) => (s || "").toLowerCase();

const TIME_LABELS: Record<string, string> = {
  "09:00": "9 AM – 12 PM",
  "14:00": "2 PM – 6 PM",
  "18:00": "6 PM – 11 PM",
};

// Determine which payment action applies to a booking
function resolvePaymentAction(booking: any): {
  type: "awaiting_down" | "remaining" | "done" | "none";
  amount: number;
  label: string;
} {
  const status  = sk(booking.status);
  const payment = sk(booking.paymentStatus);

  if (status === "awaiting payment" && payment === "pending") {
    return { type: "awaiting_down", amount: Number(booking.downPayment || 0), label: "Pay Down Payment" };
  }
  if (status === "pending" && payment === "pending") {
    return { type: "awaiting_down", amount: Number(booking.downPayment || 0), label: "Pay Down Payment" };
  }
  if (status === "confirmed" && payment === "partial") {
    const remaining = Number(booking.totalAmount || 0) - Number(booking.downPayment || 0);
    return { type: "remaining", amount: remaining, label: "Pay Remaining" };
  }
  if (payment === "paid" || status === "completed") {
    return { type: "done", amount: Number(booking.totalAmount || 0), label: "Paid" };
  }
  return { type: "none", amount: 0, label: "" };
}

// ── page wrapper ────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <PaymentsPageContent />
    </Suspense>
  );
}

// ── main content ────────────────────────────────────────────────────────────
function PaymentsPageContent() {
  const { user } = getUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionVerifiedRef = useRef(false);

  const [bookings, setBookings]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<"pending" | "history">("pending");
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Handle Stripe return
  useEffect(() => {
    const sessionId   = searchParams.get("session_id");
    const bookingId   = searchParams.get("bookingId");
    const paymentType = searchParams.get("paymentType");
    const cancelled   = searchParams.get("cancelled");

    if (cancelled) {
      toast({ title: "Payment Cancelled", description: "You cancelled the payment. You can try again anytime.", variant: "destructive" });
      router.replace("/user/payments");
      return;
    }
    if (sessionId && !sessionVerifiedRef.current) {
      sessionVerifiedRef.current = true;
      verifyStripeSession(sessionId, bookingId ? Number(bookingId) : undefined, paymentType || undefined);
    }
  }, [searchParams]);

  const verifyStripeSession = async (sessionId: string, bookingId?: number, paymentType?: string) => {
    try {
      toast({ title: "Verifying Payment", description: "Please wait while we confirm your payment..." });
      const result = await PaymentAPI.verifyCheckoutSession(sessionId, bookingId, paymentType);
      if (!result.alreadyProcessed) {
        const pType = result.paymentType || paymentType || "down_payment";
        try {
          if (pType === "down_payment")       await PaymentAPI.processDownPayment(result.bookingId);
          else if (pType === "remaining_payment") await PaymentAPI.processRemainingPayment(result.bookingId);
          else if (pType === "full_payment")  await PaymentAPI.processFullPayment(result.bookingId);
        } catch (e) { /* non-critical */ }
        toast({ title: "Payment Successful!", description: `Your payment of ${fmt(result.amount)} has been processed.` });
      } else {
        toast({ title: "Already Processed", description: "This payment was already recorded." });
      }
      await fetchBookings();
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message || "Could not verify payment. Please contact support.", variant: "destructive" });
    } finally {
      router.replace("/user/payments");
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await PaymentAPI.getUserBookings();
      // Merge pending + history back into raw-ish list for unified rendering
      const all = [
        ...res.pendingPayments.map(p => ({ ...p, _resolved: resolvePaymentAction(p) })),
        ...res.paymentHistory.map(p  => ({ ...p, _resolved: resolvePaymentAction(p) })),
      ];
      setBookings(all);
    } catch {
      toast({ title: "Error", description: "Failed to fetch payments.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pending = useMemo(() =>
    bookings.filter(b => ["awaiting_down", "remaining"].includes(b._resolved?.type)),
    [bookings]
  );
  const history = useMemo(() =>
    bookings.filter(b => b._resolved?.type === "done"),
    [bookings]
  );

  const totalDue = pending.reduce((s, b) => s + (b._resolved?.amount || 0), 0);
  const totalPaid = history.reduce((s, b) => s + Number(b.totalAmount || 0), 0);

  const handlePay = (booking: any) => {
    const action = booking._resolved;
    if (!action || !action.amount) return;

    const paymentType: 'down_payment' | 'remaining_payment' | 'full_payment' =
      action.type === "remaining" ? "remaining_payment" : "down_payment";

    setSelectedPayment({
      id: booking.id || booking.bookingId,
      bookingId: booking.bookingId || booking.id,
      customerName: booking.customerName,
      bookingDate: booking.bookingDate,
      businesses: booking.businesses || [],
      paymentType,
      amount: action.amount,
      currency: "usd",
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      totalAmount: booking.totalAmount,
    });
    setPaymentModalOpen(true);
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="h-8 w-40 skeleton-shimmer rounded-lg mb-2" />
            <div className="h-4 w-64 skeleton-shimmer rounded" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />)}
          </div>
          <div className="h-12 skeleton-shimmer rounded-xl" />
          {[1,2,3].map(i => <div key={i} className="h-44 skeleton-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-500 mt-1 text-sm">Track pending payments and view your payment history</p>
          </div>
          <Button onClick={fetchBookings} disabled={loading} variant="outline" size="sm" className="flex items-center gap-2 border-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pending Payments", value: pending.length,       icon: Clock,        iconBg: "bg-amber-50 text-amber-600",   val: "text-amber-600"   },
            { label: "Amount Due",        value: fmt(totalDue),        icon: Wallet,       iconBg: "bg-red-50 text-red-500",       val: "text-red-500"     },
            { label: "Completed",         value: history.length,       icon: CheckCircle2, iconBg: "bg-emerald-50 text-emerald-600", val: "text-emerald-600" },
            { label: "Total Paid",        value: fmt(totalPaid),       icon: TrendingUp,   iconBg: "bg-blue-50 text-blue-600",     val: "text-blue-600"    },
          ].map(({ label, value, icon: Icon, iconBg, val }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-xl font-bold mt-1 ${val}`}>{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex gap-1">
          {[
            { key: "pending" as const, label: "Pending Payments", count: pending.length },
            { key: "history" as const, label: "Payment History",  count: history.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Pending Payments ── */}
        {activeTab === "pending" && (
          pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500 text-sm">You have no pending payments right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((booking) => {
                const action = booking._resolved;
                const isRemaining = action.type === "remaining";
                const accentColor = isRemaining ? "border-l-blue-500 bg-blue-50/20" : "border-l-amber-500 bg-amber-50/20";
                const btnColor    = isRemaining
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700";
                const badgeBg     = isRemaining ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200";

                return (
                  <div key={booking.bookingId || booking.id}
                    className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${accentColor} overflow-hidden`}
                  >
                    <div className="p-5 sm:p-6">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Booking #{booking.bookingId || booking.id}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeBg}`}>
                              {isRemaining ? <Clock className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                              {isRemaining ? "Remaining Due" : "Down Payment Due"}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900">
                            {booking.businesses?.[0]?.name || booking.customerName || "Booking"}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">Booked on {fmtDate(booking.createdAt)}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-gray-900">{fmt(action.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            of {fmt(booking.totalAmount)} total
                          </p>
                        </div>
                      </div>

                      {/* Date / location */}
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          {fmtDate(booking.bookingDate)}
                        </span>
                        {booking.bookingTime && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            {TIME_LABELS[booking.bookingTime] || booking.bookingTime}
                          </span>
                        )}
                        {booking.businesses?.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            {booking.businesses.map((b: any) => b.name).join(", ")}
                          </span>
                        )}
                      </div>

                      {/* Payment breakdown */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4 grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Total</p>
                          <p className="font-bold text-gray-900 mt-0.5">{fmt(booking.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Down Payment</p>
                          <p className="font-bold text-gray-900 mt-0.5">{fmt(booking.downPayment || booking.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Remaining</p>
                          <p className="font-bold text-gray-900 mt-0.5">
                            {fmt(Number(booking.totalAmount || 0) - Number(booking.downPayment || booking.amount || 0))}
                          </p>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        <Button
                          onClick={() => router.push(`/user/bookings/${booking.bookingId || booking.id}`)}
                          variant="outline"
                          size="sm"
                          className="h-10 px-4 text-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          View Details
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                        <Button
                          onClick={() => handlePay(booking)}
                          size="sm"
                          className={`h-10 px-5 text-sm text-white font-semibold flex-1 ${btnColor}`}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {action.label} — {fmt(action.amount)}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Payment History ── */}
        {activeTab === "history" && (
          history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment history yet</h3>
              <p className="text-gray-500 text-sm">Your completed payments will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((booking) => (
                <div key={booking.bookingId || booking.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5"
                >
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Booking #{booking.bookingId || booking.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Paid
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {booking.businesses?.[0]?.name || booking.customerName || "Booking"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(booking.bookingDate)}
                      </span>
                      {booking.businesses?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {booking.businesses.map((b: any) => b.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-600">{fmt(booking.totalAmount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(booking.createdAt)}</p>
                    <Button
                      onClick={() => router.push(`/user/bookings/${booking.bookingId || booking.id}`)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 mt-1 -mr-1"
                    >
                      Details <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Stripe Payment Modal ── */}
      {selectedPayment && (
        <StripePayment
          isOpen={paymentModalOpen}
          onClose={() => { setPaymentModalOpen(false); setSelectedPayment(null); }}
          bookingId={selectedPayment.bookingId}
          customerEmail={user?.email || ""}
          paymentType={selectedPayment.paymentType}
          amount={selectedPayment.amount}
          currency={selectedPayment.currency}
          businessName={selectedPayment.businesses[0]?.name || "Business"}
          onPaymentSuccess={() => {
            setPaymentModalOpen(false);
            setSelectedPayment(null);
            fetchBookings();
            toast({ title: "Success", description: "Payment processed successfully." });
          }}
          onPaymentFailure={() => { setPaymentModalOpen(false); setSelectedPayment(null); }}
        />
      )}
    </div>
  );
}

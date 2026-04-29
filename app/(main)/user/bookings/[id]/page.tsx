"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, Clock, MapPin, User, Phone, Mail, ArrowLeft,
  Trash2, CreditCard, Package, Building2, FileText,
  CheckCircle2, XCircle, Timer, AlertTriangle, Info,
  Wallet, ChevronRight, Star, MessageSquare,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BookingDetail {
  id: number;
  bookingId: number;
  businessId: number;
  packageId: number;
  menuId: number | null;
  totalAmount: number;
  downPayment: number;
  specialRequests: string | null;
  business: { id: number; name: string; city: string; subArea: string; description?: string };
  package: { id: number; name: string; price: number; features?: string[] } | null;
  menu: { id: number; title: string; price: number } | null;
}

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  downPayment: number;
  additionalRequests: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  bookingDetails: BookingDetail[];
}

const STATUS_CONFIG: Record<string, {
  label: string; icon: React.ElementType;
  headerBg: string; badge: string; dot: string;
}> = {
  confirmed:          { label: "Confirmed",        icon: CheckCircle2, headerBg: "from-emerald-600 to-emerald-700", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "awaiting payment": { label: "Awaiting Payment", icon: CreditCard,   headerBg: "from-amber-500 to-amber-600",    badge: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500"   },
  pending:            { label: "Pending",           icon: Timer,        headerBg: "from-blue-600 to-blue-700",      badge: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500"    },
  completed:          { label: "Completed",         icon: CheckCircle2, headerBg: "from-purple-600 to-purple-700", badge: "bg-purple-100 text-purple-700 border-purple-200",     dot: "bg-purple-500"  },
  cancelled:          { label: "Cancelled",         icon: XCircle,      headerBg: "from-red-500 to-red-600",       badge: "bg-red-100 text-red-600 border-red-200",             dot: "bg-red-400"     },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Unpaid",   color: "bg-amber-100 text-amber-700 border-amber-200"     },
  paid:     { label: "Paid",     color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  partial:  { label: "Partial",  color: "bg-blue-100 text-blue-700 border-blue-200"         },
  refunded: { label: "Refunded", color: "bg-purple-100 text-purple-700 border-purple-200"   },
  failed:   { label: "Failed",   color: "bg-red-100 text-red-600 border-red-200"            },
};

const TIME_LABELS: Record<string, string> = {
  "09:00": "Morning · 9 AM – 12 PM",
  "14:00": "Afternoon · 2 PM – 6 PM",
  "18:00": "Evening · 6 PM – 11 PM",
};

const fmt = (n: number | string | null | undefined) =>
  `Rs. ${Number(n || 0).toLocaleString()}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const fmtShort = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

function sk(s: string) { return (s || "").toLowerCase(); }

export default function BookingDetailPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (user && bookingId) fetchBooking();
      else setIsLoadingBooking(false);
    }
  }, [user, isLoading, bookingId]);

  const fetchBooking = async () => {
    setIsLoadingBooking(true);
    try {
      const res = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);
      const found = (res.data?.data || []).find((b: Booking) => String(b.id) === String(bookingId));
      if (found) setBooking(found);
      else throw new Error("not found");
    } catch {
      toast({ title: "Error", description: "Failed to load booking details.", variant: "destructive" });
    } finally {
      setIsLoadingBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      if (sk(booking.status) === "awaiting payment") {
        await axiosInstance.delete(`${BACKEND_URL}api/v1/bookings/${booking.id}/cancel-pending`);
        toast({ title: "Booking Cancelled", description: `Booking #${booking.id} has been cancelled.` });
        router.push("/user/bookings");
      } else {
        await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${booking.id}/cancel`);
        toast({ title: "Booking Cancelled", description: `Booking #${booking.id} has been cancelled.` });
        fetchBooking();
      }
    } catch {
      toast({ title: "Error", description: "Failed to cancel booking.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
    }
  };

  // ── Skeletons ──
  if (isLoading || isLoadingBooking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-40 skeleton-shimmer" />
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-44 skeleton-shimmer rounded-2xl" />)}
          </div>
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="h-44 skeleton-shimmer rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please log in to view booking details.</p>
          <Button onClick={() => router.push("/login")} className="bg-purple-600 hover:bg-purple-700 text-white">Log In</Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Booking not found.</p>
          <Button onClick={() => router.push("/user/bookings")} variant="outline">Back to Bookings</Button>
        </div>
      </div>
    );
  }

  const statusKey = sk(booking.status);
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const payCfg = PAYMENT_CONFIG[sk(booking.paymentStatus)] || PAYMENT_CONFIG.pending;
  const isCancellable = !["cancelled", "completed"].includes(statusKey);
  const isAwaitingPayment = statusKey === "awaiting payment";
  const remaining = Number(booking.totalAmount || 0) - Number(booking.downPayment || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Coloured page header ── */}
      <div className={`bg-gradient-to-r ${cfg.headerBg} text-white`}>
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-8">
          <button
            onClick={() => router.push("/user/bookings")}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            My Bookings
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/60 text-sm font-medium">Booking #{booking.id}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {booking.bookingDetails?.[0]?.business?.name || "Booking Details"}
              </h1>
              <p className="text-white/70 mt-1 text-sm">Booked on {fmtShort(booking.createdAt)}</p>
            </div>

            <div className="flex gap-2">
              {isAwaitingPayment && (
                <Button
                  size="sm"
                  className="bg-white text-amber-600 hover:bg-white/90 font-semibold shadow-lg"
                >
                  <Wallet className="w-4 h-4 mr-1.5" />
                  Pay Now
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
              {isCancellable && (
                <Button
                  onClick={() => setCancelDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT / MAIN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Event info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
                <Calendar className="w-4.5 h-4.5 text-purple-500" />
                Event Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Event Date</p>
                    <p className="text-base font-semibold text-gray-900 mt-0.5">{fmtDate(booking.bookingDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Time Slot</p>
                    <p className="text-base font-semibold text-gray-900 mt-0.5">
                      {TIME_LABELS[booking.bookingTime] || booking.bookingTime}
                    </p>
                  </div>
                </div>
              </div>

              {booking.additionalRequests?.trim() && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Special Requests</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                    {booking.additionalRequests}
                  </p>
                </div>
              )}
            </div>

            {/* Customer info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
                <User className="w-4.5 h-4.5 text-purple-500" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: User,  label: "Name",  value: booking.customerName  },
                  { icon: Mail,  label: "Email", value: booking.customerEmail },
                  { icon: Phone, label: "Phone", value: booking.customerPhone },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendors & packages */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
                <Building2 className="w-4.5 h-4.5 text-purple-500" />
                Vendors & Services
              </h2>

              {(booking.bookingDetails || []).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No vendor details available.</p>
              ) : (
                <div className="space-y-4">
                  {booking.bookingDetails.map((detail) => (
                    <div key={detail.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                      {/* vendor header */}
                      <div className="flex items-start justify-between gap-4 p-4 bg-gray-50/60">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-base">{detail.business?.name}</p>
                          {(detail.business?.city || detail.business?.subArea) && (
                            <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {[detail.business.city, detail.business.subArea].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-purple-600 text-base">{fmt(detail.totalAmount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Down: <span className="font-semibold text-gray-600">{fmt(detail.downPayment)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Package */}
                        {detail.package && (
                          <div className="flex items-start gap-3 p-3 bg-purple-50/40 rounded-xl">
                            <Package className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900">{detail.package.name}</p>
                              {Array.isArray(detail.package.features) && detail.package.features.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {detail.package.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Menu */}
                        {detail.menu && (
                          <div className="flex items-center gap-3 p-3 bg-blue-50/40 rounded-xl">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900">{detail.menu.title}</p>
                            </div>
                            <p className="text-sm font-semibold text-blue-600 flex-shrink-0">{fmt(detail.menu.price)}</p>
                          </div>
                        )}

                        {/* Special requests */}
                        {detail.specialRequests?.trim() && (
                          <div className="flex items-start gap-2 p-3 bg-amber-50/40 rounded-xl">
                            <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-700 leading-relaxed">{detail.specialRequests}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT / SIDEBAR ── */}
          <div className="space-y-5">

            {/* Payment summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                <CreditCard className="w-4.5 h-4.5 text-purple-500" />
                Payment Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-semibold text-gray-900">{fmt(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Down Payment Due</span>
                  <span className="font-semibold text-gray-900">{fmt(booking.downPayment)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Remaining Balance</span>
                  <span className="font-semibold text-gray-900">{fmt(remaining)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Payment Status</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${payCfg.color}`}>
                    {payCfg.label}
                  </span>
                </div>
                {booking.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Method</span>
                    <span className="font-semibold text-gray-900 capitalize">{booking.paymentMethod}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Now Due</span>
                <span className="text-xl font-bold text-purple-600">{fmt(booking.downPayment)}</span>
              </div>

              {isAwaitingPayment && (
                <Button className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-sm">
                  <Wallet className="w-4 h-4 mr-2" />
                  Pay {fmt(booking.downPayment)}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                <Clock className="w-4.5 h-4.5 text-purple-500" />
                Timeline
              </h2>
              <div className="space-y-4">
                {[
                  { dot: "bg-emerald-500", title: "Booking Created",  sub: fmtShort(booking.createdAt) },
                  { dot: cfg.dot,          title: `Status: ${cfg.label}`, sub: fmtShort(booking.updatedAt) },
                  ...(booking.cancellationReason?.trim()
                    ? [{ dot: "bg-red-400", title: "Cancellation Reason", sub: booking.cancellationReason }]
                    : []
                  ),
                ].map(({ dot, title, sub }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
              <Button
                onClick={() => router.push(`/vendors`)}
                variant="outline"
                className="w-full justify-start border-gray-200 text-gray-600 hover:bg-gray-50 text-sm h-10"
              >
                <Star className="w-4 h-4 mr-2 text-purple-400" />
                Browse More Vendors
              </Button>
              {isCancellable && (
                <Button
                  onClick={() => setCancelDialogOpen(true)}
                  variant="outline"
                  className="w-full justify-start border-red-200 text-red-500 hover:bg-red-50 text-sm h-10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel dialog ── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancel Booking #{booking.id}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any payments made may be subject to the vendor's refund policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} className="rounded-xl">Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? "Cancelling…" : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

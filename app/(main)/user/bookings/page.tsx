"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, Clock, MapPin, User, Phone, CreditCard,
  Eye, Trash2, RefreshCw, AlertTriangle, Package,
  CheckCircle2, XCircle, Timer, Wallet, TrendingUp,
  ChevronRight, Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  business: { id: number; name: string; city: string; subArea: string };
  package: { id: number; name: string; price: number } | null;
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
  createdAt: string;
  bookingDetails: BookingDetail[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; card: string; badge: string; dot: string }> = {
  confirmed:       { label: "Confirmed",       icon: CheckCircle2, card: "border-l-emerald-500 bg-emerald-50/30",  badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "awaiting payment": { label: "Awaiting Payment", icon: CreditCard,    card: "border-l-amber-500 bg-amber-50/30",    badge: "bg-amber-100 text-amber-700 border-amber-200",   dot: "bg-amber-500"   },
  pending:         { label: "Pending",         icon: Timer,        card: "border-l-blue-500 bg-blue-50/30",      badge: "bg-blue-100 text-blue-700 border-blue-200",      dot: "bg-blue-500"    },
  completed:       { label: "Completed",       icon: CheckCircle2, card: "border-l-purple-500 bg-purple-50/30",  badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500"  },
  cancelled:       { label: "Cancelled",       icon: XCircle,      card: "border-l-red-400 bg-red-50/20",        badge: "bg-red-100 text-red-600 border-red-200",          dot: "bg-red-400"     },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Unpaid",   color: "text-amber-600 bg-amber-50 border-amber-200"  },
  paid:     { label: "Paid",     color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  partial:  { label: "Partial",  color: "text-blue-600 bg-blue-50 border-blue-200"    },
  refunded: { label: "Refunded", color: "text-purple-600 bg-purple-50 border-purple-200" },
  failed:   { label: "Failed",   color: "text-red-600 bg-red-50 border-red-200"        },
};

const TIME_LABELS: Record<string, string> = {
  "09:00": "9 AM – 12 PM",
  "14:00": "2 PM – 6 PM",
  "18:00": "6 PM – 11 PM",
};

const fmt = (n: number) => `Rs. ${Number(n || 0).toLocaleString()}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

function statusKey(s: string) { return (s || "").toLowerCase(); }

export default function BookingsPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (user) fetchBookings();
      else setIsLoadingBookings(false);
    }
  }, [user, isLoading]);

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);
      setBookings(res.data?.data || []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const stats = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter(b => ["confirmed", "completed"].includes(statusKey(b.status))).length,
    pending:   bookings.filter(b => ["pending", "awaiting payment"].includes(statusKey(b.status))).length,
    spent:     bookings.filter(b => statusKey(b.status) !== "cancelled").reduce((s, b) => s + Number(b.totalAmount || 0), 0),
  }), [bookings]);

  const tabs = [
    { key: "all",              label: "All",              count: bookings.length },
    { key: "awaiting payment", label: "Awaiting Payment", count: bookings.filter(b => statusKey(b.status) === "awaiting payment").length },
    { key: "confirmed",        label: "Confirmed",        count: bookings.filter(b => statusKey(b.status) === "confirmed").length },
    { key: "pending",          label: "Pending",          count: bookings.filter(b => statusKey(b.status) === "pending").length },
    { key: "completed",        label: "Completed",        count: bookings.filter(b => statusKey(b.status) === "completed").length },
    { key: "cancelled",        label: "Cancelled",        count: bookings.filter(b => statusKey(b.status) === "cancelled").length },
  ];

  const filtered = useMemo(() =>
    activeTab === "all" ? bookings : bookings.filter(b => statusKey(b.status) === activeTab),
    [bookings, activeTab]
  );

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      if (statusKey(bookingToCancel.status) === "awaiting payment") {
        await axiosInstance.delete(`${BACKEND_URL}api/v1/bookings/${bookingToCancel.id}/cancel-pending`);
      } else {
        await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${bookingToCancel.id}/cancel`);
      }
      toast({ title: "Booking Cancelled", description: `Booking #${bookingToCancel.id} cancelled.` });
      fetchBookings();
    } catch {
      toast({ title: "Error", description: "Failed to cancel booking.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    }
  };

  // ── Loading skeleton ──
  if (isLoading || isLoadingBookings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="h-8 w-48 skeleton-shimmer rounded-lg mb-2" />
            <div className="h-4 w-72 skeleton-shimmer rounded" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
          </div>
          <div className="h-12 skeleton-shimmer rounded-xl" />
          {[1,2,3].map(i => <div key={i} className="h-48 skeleton-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your bookings.</p>
          <Button onClick={() => router.push("/login")} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage and track all your event bookings</p>
          </div>
          <Button
            onClick={fetchBookings}
            disabled={isLoadingBookings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingBookings ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Bookings",   value: stats.total,     icon: Calendar,    color: "bg-purple-50 text-purple-600",  num: "text-gray-900" },
            { label: "Confirmed",        value: stats.confirmed, icon: CheckCircle2,color: "bg-emerald-50 text-emerald-600", num: "text-emerald-600" },
            { label: "Pending / Awaiting", value: stats.pending,  icon: Timer,       color: "bg-amber-50 text-amber-600",    num: "text-amber-600" },
            { label: "Total Value",      value: fmt(stats.spent),icon: TrendingUp,  color: "bg-blue-50 text-blue-600",      num: "text-blue-600" },
          ].map(({ label, value, icon: Icon, color, num }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${num}`}>{value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Status tabs ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            tab.key === "all" || tab.count > 0 ? (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ) : null
          ))}
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === "all" ? "No bookings yet" : `No ${activeTab} bookings`}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {activeTab === "all"
                ? "Start planning your perfect event by browsing vendors."
                : "Try a different filter above."}
            </p>
            {activeTab === "all" && (
              <Button
                onClick={() => router.push("/vendors")}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                Browse Vendors
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const sk = statusKey(booking.status);
              const cfg = STATUS_CONFIG[sk] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const payKey = statusKey(booking.paymentStatus);
              const payCfg = PAYMENT_CONFIG[payKey] || PAYMENT_CONFIG.pending;
              const isCancellable = !["cancelled", "completed"].includes(sk);
              const vendors = booking.bookingDetails || [];
              const primaryVendor = vendors[0];

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${cfg.card} overflow-hidden`}
                >
                  <div className="p-5 sm:p-6">
                    {/* ── Top row ── */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            #{booking.id}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${payCfg.color}`}>
                            {payCfg.label}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {primaryVendor?.business?.name || booking.customerName}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Booked on {fmtDate(booking.createdAt)}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-purple-600">{fmt(booking.totalAmount)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Down: <span className="font-semibold text-gray-600">{fmt(booking.downPayment)}</span>
                        </p>
                      </div>
                    </div>

                    {/* ── Date / time / location row ── */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        {fmtDate(booking.bookingDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        {TIME_LABELS[booking.bookingTime] || booking.bookingTime}
                      </span>
                      {primaryVendor?.business?.city && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          {primaryVendor.business.city}
                          {primaryVendor.business.subArea ? `, ${primaryVendor.business.subArea}` : ""}
                        </span>
                      )}
                    </div>

                    {/* ── Customer info ── */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {booking.customerName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {booking.customerPhone}
                      </span>
                    </div>

                    {/* ── Vendors / packages ── */}
                    {vendors.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                        {vendors.map(detail => (
                          <div key={detail.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs font-medium text-gray-700 truncate">
                                {detail.business?.name || "—"}
                              </span>
                              {detail.package?.name && (
                                <span className="text-xs text-gray-400">· {detail.package.name}</span>
                              )}
                              {detail.menu?.title && (
                                <span className="text-xs text-gray-400">· {detail.menu.title}</span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-purple-600 flex-shrink-0">
                              {fmt(detail.totalAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/user/bookings/${booking.id}`)}
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-xs border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Details
                        </Button>
                        {isCancellable && (
                          <Button
                            onClick={() => { setBookingToCancel(booking); setCancelDialogOpen(true); }}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-xs border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Pay Now prompt */}
                      {sk === "awaiting payment" && (
                        <Button
                          onClick={() => router.push(`/user/bookings/${booking.id}`)}
                          size="sm"
                          className="h-9 px-4 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm"
                        >
                          <Wallet className="w-3.5 h-3.5 mr-1.5" />
                          Pay Now
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cancel dialog ── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancel Booking #{bookingToCancel?.id}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Any payments made may be subject to the refund policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} className="rounded-xl">Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
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

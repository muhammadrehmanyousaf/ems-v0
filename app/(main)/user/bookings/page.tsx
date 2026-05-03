"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  CreditCard,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Wallet,
  TrendingUp,
  ChevronRight,
  Building2,
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

import {
  PageContainer,
  PageHeader,
  KpiCard,
  EmptyState,
} from "@/components/user-dashboard";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; tone: string; accent: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    tone: "border-bridal-sage/45 bg-bridal-sage/15 text-[#3F6B43]",
    accent: "border-l-bridal-sage",
  },
  "awaiting payment": {
    label: "Awaiting payment",
    icon: CreditCard,
    tone: "border-bridal-gold/45 bg-bridal-gold/12 text-bridal-gold-dark",
    accent: "border-l-bridal-gold",
  },
  pending: {
    label: "Pending",
    icon: Timer,
    tone: "border-border bg-muted text-muted-foreground",
    accent: "border-l-muted-foreground/40",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "border-bridal-rose/45 bg-bridal-blush text-bridal-mauve",
    accent: "border-l-bridal-mauve",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    tone: "border-bridal-coral/35 bg-bridal-coral/12 text-bridal-coral",
    accent: "border-l-bridal-coral",
  },
};

const PAYMENT_CONFIG: Record<string, { label: string; tone: string }> = {
  pending: {
    label: "Unpaid",
    tone: "border-bridal-gold/40 bg-bridal-gold/10 text-bridal-gold-dark",
  },
  paid: {
    label: "Paid",
    tone: "border-bridal-sage/45 bg-bridal-sage/15 text-[#3F6B43]",
  },
  partial: {
    label: "Partial",
    tone: "border-bridal-rose/45 bg-bridal-blush text-bridal-mauve",
  },
  refunded: {
    label: "Refunded",
    tone: "border-border bg-muted text-muted-foreground",
  },
  failed: {
    label: "Failed",
    tone: "border-bridal-coral/35 bg-bridal-coral/12 text-bridal-coral",
  },
};

const TIME_LABELS: Record<string, string> = {
  "09:00": "9 AM – 12 PM",
  "14:00": "2 PM – 6 PM",
  "18:00": "6 PM – 11 PM",
};

const fmt = (n: number) => `Rs. ${Number(n || 0).toLocaleString()}`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function statusKey(s: string) {
  return (s || "").toLowerCase();
}

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
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/bookings/simple-user-bookings`,
      );
      setBookings(res.data?.data || []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: bookings.length,
      confirmed: bookings.filter((b) =>
        ["confirmed", "completed"].includes(statusKey(b.status)),
      ).length,
      pending: bookings.filter((b) =>
        ["pending", "awaiting payment"].includes(statusKey(b.status)),
      ).length,
      spent: bookings
        .filter((b) => statusKey(b.status) !== "cancelled")
        .reduce((s, b) => s + Number(b.totalAmount || 0), 0),
    }),
    [bookings],
  );

  const tabs = [
    { key: "all", label: "All", count: bookings.length },
    {
      key: "awaiting payment",
      label: "Awaiting payment",
      count: bookings.filter((b) => statusKey(b.status) === "awaiting payment").length,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      count: bookings.filter((b) => statusKey(b.status) === "confirmed").length,
    },
    {
      key: "pending",
      label: "Pending",
      count: bookings.filter((b) => statusKey(b.status) === "pending").length,
    },
    {
      key: "completed",
      label: "Completed",
      count: bookings.filter((b) => statusKey(b.status) === "completed").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: bookings.filter((b) => statusKey(b.status) === "cancelled").length,
    },
  ];

  const filtered = useMemo(
    () =>
      activeTab === "all"
        ? bookings
        : bookings.filter((b) => statusKey(b.status) === activeTab),
    [bookings, activeTab],
  );

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      if (statusKey(bookingToCancel.status) === "awaiting payment") {
        await axiosInstance.delete(
          `${BACKEND_URL}api/v1/bookings/${bookingToCancel.id}/cancel-pending`,
        );
      } else {
        await axiosInstance.patch(
          `${BACKEND_URL}api/v1/bookings/${bookingToCancel.id}/cancel`,
        );
      }
      toast({
        title: "Booking cancelled",
        description: `Booking #${bookingToCancel.id} cancelled.`,
      });
      fetchBookings();
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel booking.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    }
  };

  const headerActions = (
    <Button
      onClick={fetchBookings}
      disabled={isLoadingBookings}
      variant="outline"
      size="sm"
      className="gap-1.5"
    >
      <RefreshCw className={cn("size-3.5", isLoadingBookings && "animate-spin")} />
      Refresh
    </Button>
  );

  const eyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Bookings</span>
    </>
  );

  if (isLoading || isLoadingBookings) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="My bookings"
          description="Track and manage every event booking in one place."
          actions={headerActions}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <KpiCard key={i} label="" value={0} isLoading />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </PageContainer>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Calendar className="size-6" />}
          title="Sign in required"
          description="Please log in to view your bookings."
          action={
            <Button onClick={() => router.push("/login")} size="sm">
              Log in
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="My bookings"
        description="Track and manage every event booking in one place."
        actions={headerActions}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total bookings"
          value={stats.total}
          icon={<Calendar className="size-4" />}
          caption={stats.total === 1 ? "1 record" : `${stats.total} records`}
        />
        <KpiCard
          label="Confirmed"
          value={stats.confirmed}
          icon={<CheckCircle2 className="size-4" />}
          caption="Confirmed or completed"
        />
        <KpiCard
          label="Pending"
          value={stats.pending}
          icon={<Timer className="size-4" />}
          caption="Pending or awaiting payment"
          invertTrendColor
        />
        <KpiCard
          label="Total value"
          value={fmt(stats.spent)}
          icon={<TrendingUp className="size-4" />}
          caption="Lifetime spend"
        />
      </div>

      {/* Status tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto bg-muted/50 p-1 flex flex-wrap gap-1 justify-start">
          {tabs.map((tab) =>
            tab.key === "all" || tab.count > 0 ? (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[12.5px]"
              >
                {tab.label}
                {tab.count > 0 ? (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                      activeTab === tab.key
                        ? "bg-bridal-cream text-bridal-gold-dark"
                        : "bg-muted-foreground/10 text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </TabsTrigger>
            ) : null,
          )}
        </TabsList>
      </Tabs>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-6" />}
          title={
            activeTab === "all"
              ? "No bookings yet"
              : `No ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} bookings`
          }
          description={
            activeTab === "all"
              ? "Start planning your perfect event by browsing vendors."
              : "Try a different filter above."
          }
          action={
            activeTab === "all" ? (
              <Button onClick={() => router.push("/vendors")} size="sm">
                Browse vendors
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
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
              <Card
                key={booking.id}
                className={cn(
                  "overflow-hidden border-l-4 transition-shadow hover:shadow-md",
                  cfg.accent,
                )}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em] tabular-nums">
                          #{booking.id}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border",
                            cfg.tone,
                          )}
                        >
                          <StatusIcon className="size-3" />
                          {cfg.label}
                        </span>
                        <span
                          className={cn(
                            "text-[10.5px] font-medium uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border",
                            payCfg.tone,
                          )}
                        >
                          {payCfg.label}
                        </span>
                      </div>
                      <h3 className="font-display italic text-[18px] text-foreground truncate">
                        {primaryVendor?.business?.name || booking.customerName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Booked on {fmtDate(booking.createdAt)}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-display italic text-[22px] text-foreground tabular-nums leading-none">
                        {fmt(booking.totalAmount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Down{" "}
                        <span className="font-medium text-foreground tabular-nums">
                          {fmt(booking.downPayment)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground mb-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-bridal-gold" />
                      {fmtDate(booking.bookingDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-bridal-gold" />
                      {TIME_LABELS[booking.bookingTime] || booking.bookingTime}
                    </span>
                    {primaryVendor?.business?.city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-bridal-gold" />
                        {primaryVendor.business.city}
                        {primaryVendor.business.subArea
                          ? `, ${primaryVendor.business.subArea}`
                          : ""}
                      </span>
                    )}
                  </div>

                  {/* Customer */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-muted-foreground mb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-3" />
                      {booking.customerName}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3" />
                      {booking.customerPhone}
                    </span>
                  </div>

                  {/* Vendor list */}
                  {vendors.length > 0 && (
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 mb-4 space-y-2">
                      {vendors.map((detail) => (
                        <div
                          key={detail.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="size-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-[12.5px] font-medium text-foreground truncate">
                              {detail.business?.name || "—"}
                            </span>
                            {detail.package?.name && (
                              <span className="text-[12px] text-muted-foreground truncate">
                                · {detail.package.name}
                              </span>
                            )}
                            {detail.menu?.title && (
                              <span className="text-[12px] text-muted-foreground truncate">
                                · {detail.menu.title}
                              </span>
                            )}
                          </div>
                          <span className="text-[12.5px] font-medium text-foreground tabular-nums flex-shrink-0">
                            {fmt(detail.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/user/bookings/${booking.id}`)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                      >
                        <Eye className="size-3.5" />
                        Details
                      </Button>
                      {isCancellable && (
                        <Button
                          onClick={() => {
                            setBookingToCancel(booking);
                            setCancelDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-bridal-coral/30 text-bridal-coral hover:bg-bridal-coral/10 hover:text-bridal-coral hover:border-bridal-coral/45"
                        >
                          <Trash2 className="size-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>

                    {sk === "awaiting payment" && (
                      <Button
                        onClick={() => router.push(`/user/bookings/${booking.id}`)}
                        size="sm"
                        className="gap-1.5"
                      >
                        <Wallet className="size-3.5" />
                        Pay now
                        <ChevronRight className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-bridal-coral" />
              Cancel booking #{bookingToCancel?.id}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Any payments made may be subject to the refund
              policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-bridal-coral hover:bg-bridal-coral/90 text-bridal-ivory"
            >
              {isCancelling ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

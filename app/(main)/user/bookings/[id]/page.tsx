"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Trash2,
  CreditCard,
  Package,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Timer,
  AlertTriangle,
  Info,
  Wallet,
  ChevronRight,
  Star,
} from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
import { cn } from "@/lib/utils";

import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/user-dashboard";
import { InstallmentsCard } from "@/components/bookings/installments-card";
import { ChangeRequestsCard } from "@/components/bookings/change-requests-card";
import { DisputeCard } from "@/components/bookings/dispute-card";
// BK-100.7 — inline review prompt. Renders only on Completed bookings;
// auto-focuses if `?action=review` is in the URL (C15 email link).
import { ReviewPromptCard } from "@/components/bookings/review-prompt-card";

interface BookingDetail {
  id: number;
  bookingId: number;
  businessId: number;
  packageId: number;
  menuId: number | null;
  totalAmount: number;
  downPayment: number;
  specialRequests: string | null;
  business: {
    id: number;
    name: string;
    city: string;
    subArea: string;
    description?: string;
  };
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

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; tone: string; dot: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    tone: "border-bridal-sage/45 bg-bridal-sage/15 text-[#3F6B43]",
    dot: "bg-bridal-sage",
  },
  "awaiting payment": {
    label: "Awaiting payment",
    icon: CreditCard,
    tone: "border-bridal-gold/45 bg-bridal-gold/12 text-bridal-gold-dark",
    dot: "bg-bridal-gold",
  },
  pending: {
    label: "Pending",
    icon: Timer,
    tone: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "border-bridal-rose/45 bg-bridal-blush text-bridal-mauve",
    dot: "bg-bridal-mauve",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    tone: "border-bridal-coral/35 bg-bridal-coral/12 text-bridal-coral",
    dot: "bg-bridal-coral",
  },
};

const PAYMENT_CONFIG: Record<string, { label: string; tone: string }> = {
  pending: {
    label: "Unpaid",
    tone: "border-bridal-gold/45 bg-bridal-gold/10 text-bridal-gold-dark",
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
  "09:00": "Morning · 9 AM – 12 PM",
  "14:00": "Afternoon · 2 PM – 6 PM",
  "18:00": "Evening · 6 PM – 11 PM",
};

const fmt = (n: number | string | null | undefined) =>
  `Rs. ${Number(n || 0).toLocaleString()}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const fmtShort = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function sk(s: string) {
  return (s || "").toLowerCase();
}

export default function BookingDetailPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = (params?.id as string) ?? "";
  // BK-100.7 — auto-scroll/focus the review card when the customer
  // arrives from the C15 prompt email (`...?action=review`).
  const wantsReview = searchParams?.get("action") === "review";

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

  // Refetch booking when the tab regains focus or visibility. Catches the
  // common "I just paid on Stripe and clicked back, why is it still
  // Pending?" case — the webhook may have landed while the page was idle.
  // The refetch is silent (no spinner, no error toast) so it never disrupts
  // the user mid-interaction.
  useEffect(() => {
    if (!user || !bookingId) return;
    const refetchSilently = async () => {
      try {
        const res = await axiosInstance.get(
          `${BACKEND_URL}api/v1/bookings/simple-user-bookings`,
        );
        const found = (res.data?.data || []).find(
          (b: Booking) => String(b.id) === String(bookingId),
        );
        if (found) setBooking(found);
      } catch {
        /* swallow — focus refetch is best-effort */
      }
    };
    const onFocus = () => refetchSilently();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetchSilently();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, bookingId]);

  const fetchBooking = async () => {
    setIsLoadingBooking(true);
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/bookings/simple-user-bookings`,
      );
      const found = (res.data?.data || []).find(
        (b: Booking) => String(b.id) === String(bookingId),
      );
      if (found) setBooking(found);
      else throw new Error("not found");
    } catch {
      toast({
        title: "Error",
        description: "Failed to load booking details.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      if (sk(booking.status) === "awaiting payment") {
        await axiosInstance.delete(
          `${BACKEND_URL}api/v1/bookings/${booking.id}/cancel-pending`,
        );
        toast({
          title: "Booking cancelled",
          description: `Booking #${booking.id} has been cancelled.`,
        });
        router.push("/user/bookings");
      } else {
        await axiosInstance.patch(
          `${BACKEND_URL}api/v1/bookings/${booking.id}/cancel`,
        );
        toast({
          title: "Booking cancelled",
          description: `Booking #${booking.id} has been cancelled.`,
        });
        fetchBooking();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel booking.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
    }
  };

  const eyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Bookings</span>
    </>
  );

  if (isLoading || isLoadingBooking) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="Booking details"
          description="Loading…"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Calendar className="size-6" />}
          title="Sign in required"
          description="Please log in to view booking details."
          action={
            <Button onClick={() => router.push("/login")} size="sm">
              Log in
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="Booking not found"
          description="We couldn't find this booking. It may have been removed."
          action={
            <Button onClick={() => router.push("/user/bookings")} variant="outline" size="sm">
              <ArrowLeft className="size-3.5 mr-1.5" />
              Back to bookings
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const statusKey = sk(booking.status);
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const payCfg = PAYMENT_CONFIG[sk(booking.paymentStatus)] || PAYMENT_CONFIG.pending;
  const isCancellable = !["cancelled", "completed"].includes(statusKey);
  const isAwaitingPayment = statusKey === "awaiting payment";
  const paymentKey = sk(booking?.paymentStatus || "");
  const isPartiallyPaid = paymentKey === "partial";
  const isFullyPaid = paymentKey === "paid";
  const showPayCta = !isFullyPaid && (isAwaitingPayment || isPartiallyPaid);
  const dueAmount = isPartiallyPaid
    ? Math.max(Number(booking?.totalAmount || 0) - Number(booking?.downPayment || 0), 0)
    : Number(booking?.downPayment || booking?.totalAmount || 0);
  const payLabel = isPartiallyPaid ? "Pay remaining" : "Pay now";
  const remaining =
    Number(booking.totalAmount || 0) - Number(booking.downPayment || 0);
  const primaryVendorName =
    booking.bookingDetails?.[0]?.business?.name || "Booking details";

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        onClick={() => router.push("/user/bookings")}
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All bookings
      </Button>
      {showPayCta ? (
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => router.push(`/user/bookings/${booking?.id}/pay`)}
        >
          <Wallet className="size-3.5" />
          {payLabel}
          <ChevronRight className="size-3" />
        </Button>
      ) : null}
      {isCancellable ? (
        <Button
          onClick={() => setCancelDialogOpen(true)}
          size="sm"
          variant="outline"
          className="gap-1.5 border-bridal-coral/30 text-bridal-coral hover:bg-bridal-coral/10 hover:text-bridal-coral hover:border-bridal-coral/45"
        >
          <Trash2 className="size-3.5" />
          Cancel
        </Button>
      ) : null}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <>
            <span>My account</span>
            <span className="size-1 rounded-full bg-muted-foreground/40" />
            <span>Bookings</span>
            <span className="size-1 rounded-full bg-muted-foreground/40" />
            <span className="tabular-nums">#{booking.id}</span>
          </>
        }
        title={primaryVendorName}
        description={
          <span className="inline-flex items-center gap-2 flex-wrap">
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
            <span className="text-muted-foreground">
              · Booked on {fmtShort(booking.createdAt)}
            </span>
          </span>
        }
        actions={headerActions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Event details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-md bg-bridal-cream border border-border flex items-center justify-center flex-shrink-0">
                  <Calendar className="size-4 text-bridal-gold-dark" />
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-muted-foreground">
                    Event date
                  </p>
                  <p className="font-display italic text-[16px] text-foreground mt-1">
                    {fmtDate(booking.bookingDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-md bg-bridal-cream border border-border flex items-center justify-center flex-shrink-0">
                  <Clock className="size-4 text-bridal-gold-dark" />
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-muted-foreground">
                    Time slot
                  </p>
                  <p className="font-display italic text-[16px] text-foreground mt-1">
                    {TIME_LABELS[booking.bookingTime] || booking.bookingTime}
                  </p>
                </div>
              </div>
            </div>

            {booking.additionalRequests?.trim() ? (
              <div className="mt-5 pt-5 border-t border-border/60">
                <p className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-muted-foreground mb-2">
                  Special requests
                </p>
                <p className="text-[13.5px] text-foreground/85 bg-muted/30 rounded-md p-3 leading-relaxed">
                  {booking.additionalRequests}
                </p>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Customer information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: User, label: "Name", value: booking.customerName },
                { icon: Mail, label: "Email", value: booking.customerEmail },
                { icon: Phone, label: "Phone", value: booking.customerPhone },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="size-9 rounded-md bg-muted border border-border flex items-center justify-center flex-shrink-0">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-[13.5px] font-medium text-foreground truncate mt-0.5">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Vendors & services">
            {(booking.bookingDetails || []).length === 0 ? (
              <p className="text-muted-foreground text-[13px] text-center py-6">
                No vendor details available.
              </p>
            ) : (
              <div className="space-y-3">
                {booking.bookingDetails.map((detail) => (
                  <div
                    key={detail.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4 p-4 bg-muted/30 border-b border-border/60">
                      <div className="min-w-0">
                        <p className="font-display italic text-[18px] text-foreground">
                          {detail.business?.name}
                        </p>
                        {(detail.business?.city || detail.business?.subArea) ? (
                          <p className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground mt-0.5">
                            <MapPin className="size-3" />
                            {[detail.business.city, detail.business.subArea]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display italic text-[18px] text-foreground tabular-nums leading-none">
                          {fmt(detail.totalAmount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Down{" "}
                          <span className="font-medium text-foreground tabular-nums">
                            {fmt(detail.downPayment)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {detail.package ? (
                        <div className="flex items-start gap-3 p-3 bg-bridal-cream rounded-md border border-bridal-gold/30">
                          <Package className="size-4 text-bridal-gold-dark mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13.5px] font-medium text-foreground">
                              {detail.package.name}
                            </p>
                            {Array.isArray(detail.package.features) &&
                            detail.package.features.length > 0 ? (
                              <ul className="mt-2 space-y-1">
                                {detail.package.features.map((f, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-1.5 text-[12px] text-foreground/85"
                                  >
                                    <CheckCircle2 className="size-3 text-[#3F6B43] flex-shrink-0 mt-0.5" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {detail.menu ? (
                        <div className="flex items-center gap-3 p-3 bg-bridal-blush/40 rounded-md border border-bridal-rose/30">
                          <FileText className="size-4 text-bridal-mauve flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13.5px] font-medium text-foreground">
                              {detail.menu.title}
                            </p>
                          </div>
                          <p className="text-[13.5px] font-medium text-bridal-mauve flex-shrink-0 tabular-nums">
                            {fmt(detail.menu.price)}
                          </p>
                        </div>
                      ) : null}

                      {detail.specialRequests?.trim() ? (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-md border border-border/60">
                          <Info className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-[12px] text-foreground/85 leading-relaxed">
                            {detail.specialRequests}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          <SectionCard title="Payment summary">
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total amount</span>
                <span className="font-medium text-foreground tabular-nums">
                  {fmt(booking.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Down payment</span>
                <span className="font-medium text-foreground tabular-nums">
                  {fmt(booking.downPayment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium text-foreground tabular-nums">
                  {fmt(remaining)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={cn(
                    "text-[10.5px] uppercase tracking-[0.18em] font-medium px-2 py-0.5 rounded-full border",
                    payCfg.tone,
                  )}
                >
                  {payCfg.label}
                </span>
              </div>
              {booking.paymentMethod ? (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium text-foreground capitalize">
                    {booking.paymentMethod}
                  </span>
                </div>
              ) : null}
            </div>

            {showPayCta ? (
              <div className="mt-4 pt-4 border-t border-border/60 flex items-end justify-between">
                <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-muted-foreground">
                  Now due
                </span>
                <span className="font-display italic text-[24px] text-foreground tabular-nums leading-none">
                  {fmt(dueAmount)}
                </span>
              </div>
            ) : null}

            {showPayCta ? (
              <Button
                className="w-full mt-4 gap-1.5"
                size="sm"
                onClick={() => router.push(`/user/bookings/${booking.id}/pay`)}
              >
                <Wallet className="size-3.5" />
                {isPartiallyPaid
                  ? `Pay remaining ${fmt(dueAmount)}`
                  : `Pay ${fmt(booking.downPayment || booking.totalAmount)}`}
                <ChevronRight className="size-3" />
              </Button>
            ) : null}
          </SectionCard>

          {/* BK-042 — payment schedule (down + remaining; legacy bookings hide). */}
          <InstallmentsCard bookingId={booking.id} />

          {/* BK-054/55/56 — mid-booking change requests (guest count / slot / package / extras). */}
          <ChangeRequestsCard
            bookingId={booking.id}
            canRequest={
              statusKey !== "cancelled" && statusKey !== "completed"
            }
          />

          {/* BK-067 — post-completion dispute window (default 7d). */}
          <DisputeCard
            bookingId={booking.id}
            isCompleted={statusKey === "completed"}
          />

          {/* BK-100.7 — inline review prompt. Renders only when the
              booking is Completed. Backend re-enforces the gate so
              this is purely a UX hint. Auto-scrolls into view when
              the customer arrives via the C15 email link
              (`...?action=review`). Backend Booking.status is stored
              title-case ("Completed") matching the ENUM. */}
          <ReviewPromptCard
            bookingId={booking.id}
            bookingStatus={booking.status || ""}
            vendors={(booking.bookingDetails || []).map((d) => ({
              businessId: d.businessId,
              businessName: d.business?.name || "Vendor",
              // alreadyReviewed is unknown until we fetch reviews —
              // backend's POST /reviews dedups on (user, business,
              // booking) and returns a clean 400 if dup. The card
              // surfaces that as friendly inline copy.
              alreadyReviewed: false,
            }))}
            autoFocus={wantsReview}
          />

          <SectionCard title="Timeline">
            <div className="space-y-3.5">
              {[
                {
                  dot: "bg-bridal-sage",
                  title: "Booking created",
                  sub: fmtShort(booking.createdAt),
                },
                {
                  dot: cfg.dot,
                  title: `Status: ${cfg.label}`,
                  sub: fmtShort(booking.updatedAt),
                },
                ...(booking.cancellationReason?.trim()
                  ? [
                      {
                        dot: "bg-bridal-coral",
                        title: "Cancellation reason",
                        sub: booking.cancellationReason,
                      },
                    ]
                  : []),
              ].map(({ dot, title, sub }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "size-2 rounded-full mt-1.5 flex-shrink-0 ring-4 ring-background",
                      dot,
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {title}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <Card className="p-2 space-y-1">
            <Button
              onClick={() => router.push(`/vendors`)}
              variant="ghost"
              className="w-full justify-start gap-2 text-[13px]"
            >
              <Star className="size-4 text-muted-foreground" />
              Browse more vendors
            </Button>
            {isCancellable ? (
              <Button
                onClick={() => setCancelDialogOpen(true)}
                variant="ghost"
                className="w-full justify-start gap-2 text-[13px] text-bridal-coral hover:text-bridal-coral hover:bg-bridal-coral/10"
              >
                <Trash2 className="size-4" />
                Cancel booking
              </Button>
            ) : null}
          </Card>
        </div>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-bridal-coral" />
              Cancel booking #{booking.id}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any payments made may be subject to the
              vendor's refund policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
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

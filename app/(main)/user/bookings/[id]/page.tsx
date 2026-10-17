"use client";

import { dateOnlyOf, fmtYmd } from "@/lib/utils/ymd"
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
import Link from "next/link";
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
// WW-RECORD-MODE — status of payments the customer reported, between their
// transfer and the venue confirming it.
import { PaymentClaimStatusCard } from "@/components/bookings/payment-claim-status-card";
// WW-REQUIREMENTS — what the customer asked for, and what the venue said back.
import { RequirementsCard } from "@/components/bookings/requirements-card";
import { ChangeRequestsCard } from "@/components/bookings/change-requests-card";
import { DisputeCard } from "@/components/bookings/dispute-card";
// BK-100.7 — inline review prompt. Renders only on Completed bookings;
// auto-focuses if `?action=review` is in the URL (C15 email link).
import { ReviewPromptCard } from "@/components/bookings/review-prompt-card";
// BK-100.9 — postpone-without-cancel (Pakistani Islamic mourning custom).
import { PostponeBookingDialog } from "@/components/bookings/postpone-booking-dialog";
// BK-038 — customer "Change date" reschedule.
import { RescheduleBookingDialog } from "@/components/bookings/reschedule-booking-dialog";
// EPIC 5 · §3 — customer "Request a refund".
import { RefundRequestCard } from "@/components/bookings/refund-request-card";
import { RefundSettlementCard } from "@/components/bookings/refund-settlement-card";
// QA #4 — show the refund the customer would get back inside the cancel dialog.
import { getRefundPreview, requestCancellation, type RefundPreview } from "@/lib/api/bookingOrder";
import { refundParts, refundPin } from "@/lib/refund-total";
import { bookingSlotText } from "@/lib/booking/slot-vocabulary";
import { useLiveRefresh } from "@/lib/hooks/useLiveRefresh";
import { bookingMoney } from "@/lib/utils/booking-money";
import { PaymentInstructionsAPI } from "@/lib/api/paymentInstructions";
import { paymentNotDueYet, customerDepositLine } from "@/lib/payment-status";
import { BookingAPI, type DepositPosition } from "@/lib/api/bookings";
import { dayTextCustomer } from "@/lib/utils/qist";
import { loginUrl } from "@/lib/auth/go-login"
import { cancelRouteFor, cancelErrorMessage, isPaymentAlreadyReceived, isClosedBookingStatus } from "@/lib/bookings/cancel-route";

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
  // BK-100.53 — optional service-location fields. NULL on legacy
  // bookings; rendered conditionally.
  serviceLocationMode?:
    | "at_vendor"
    | "at_customer_home"
    | "at_customer_plot"
    | "at_third_party"
    | null;
  serviceLocationAddress?: string | null;
  serviceLocationNotes?: string | null;
  // BK-100.9 — postpone-without-cancel state. NULL on bookings that
  // haven't been postponed; otherwise carries the deadline + reason.
  postponedAt?: string | null;
  postponedUntilAt?: string | null;
  postponeReason?: string | null;
  // BK-100.2 — optional umbrella link. NULL on unlinked bookings.
  umbrellaId?: number | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; tone: string; dot: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    tone: "border-status-success-line bg-status-success-soft text-status-success",
    dot: "bg-bridal-sage",
  },
  "awaiting payment": {
    label: "Awaiting payment",
    icon: CreditCard,
    tone: "border-status-warning-line bg-status-warning-soft text-status-warning",
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
    tone: "border-status-info-line bg-status-info-soft text-status-info",
    dot: "bg-bridal-mauve",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    tone: "border-status-danger-line bg-status-danger-soft text-status-danger",
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
    tone: "border-status-success-line bg-status-success-soft text-status-success",
  },
  partial: {
    label: "Partial",
    tone: "border-status-info-line bg-status-info-soft text-status-info",
  },
  // WW-PARTIALREFUND — see the note on the same entry in ../page.tsx. Without
  // it the fallback names a partly-refunded booking "Unpaid".
  "partially refunded": {
    label: "Partly refunded",
    tone: "border-bridal-mauve/45 bg-muted text-bridal-charcoal",
  },
  refunded: {
    label: "Refunded",
    tone: "border-border bg-muted text-muted-foreground",
  },
  failed: {
    label: "Failed",
    tone: "border-status-danger-line bg-status-danger-soft text-status-danger",
  },
};

// SLOTS step 10 — one vocabulary. This map could not name a vendor's own
// slot, so a booking made against "Dinner event" read as a bare "19:00" on
// the customer's own booking page.

const fmt = (n: number | string | null | undefined) =>
  `Rs. ${Number(n || 0).toLocaleString()}`;

const fmtDate = (s: string) =>
  dateOnlyOf(s) ? fmtYmd(s, "long", null, "en-US") : new Date(s).toLocaleDateString("en-US", { // WP23: a calendar day is printed from the string
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

/**
 * Hours the vendor stored, said the way a person would say it. A venue that set
 * 72 means "three days" to the couple reading it, and 36 means "a day and a
 * half" -- rounding either to "1 day" would misstate a deadline.
 */
function noticeText(hours: number): string {
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = hours / 24;
  if (Number.isInteger(days)) return `${days} day${days === 1 ? "" : "s"}`;
  return `${Math.floor(days)} day${Math.floor(days) === 1 ? "" : "s"} ${hours % 24} hour${hours % 24 === 1 ? "" : "s"}`;
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
  // CUSTOMER-059 - "couldn't load" is not "not found".
  const [loadFailed, setLoadFailed] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // QA #4 — refund the customer would receive if they cancel now (per the
  // vendor's policy). null when the refund engine is off (404) or nothing was
  // paid — the dialog then shows the generic policy line instead.
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [refundPreviewLoading, setRefundPreviewLoading] = useState(false);
  /**
   * WW-CANCELWINDOW — the venue's notice period has closed for this booking.
   *
   * The server is the authority and refuses with 409 CANCEL_WINDOW_CLOSED
   * regardless; this only decides what the dialog OFFERS, so the customer is
   * told the rule up front instead of pressing a button that fails. Both paths
   * end in the same place, which is why the 409 is handled too.
   */
  const [windowClosed, setWindowClosed] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  // What is due NOW comes from the server (the one authority on what is owed and to whom), the same figure the
  // Pay page asks for, so the summary, the button and the Pay page can never show different amounts.
  const [dueNow, setDueNow] = useState<number | null>(null);
  const [dueState, setDueState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  // PAY-UI_CUSTOMER-010: set when the server's figure is only the NEXT qist, not due yet (a venue that asks no advance).
  const [nextPayment, setNextPayment] = useState<{ amount: number; dueDate: string | null } | null>(null);
  useEffect(() => {
    if (!booking) return;
    if (isClosedBookingStatus((booking.status || "").toLowerCase()) || bookingMoney(booking as never).outstanding <= 0) {
      setDueNow(null); setNextPayment(null); setDueState("idle"); return;
    }
    let live = true;
    setDueState("loading");
    PaymentInstructionsAPI.get(booking.id)
      .then((d) => {
        if (!live) return;
        const notYet = paymentNotDueYet(d);
        setNextPayment(notYet);
        setDueNow(notYet ? 0 : Number(d?.amountDue ?? 0));
        setDueState("ready");
      })
      .catch(() => { if (live) setDueState("failed"); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id, booking?.status, booking?.paymentStatus, booking?.downPayment, booking?.totalAmount]);
  // PAY-UI_CUSTOMER-011: the refundable deposit, read-only (the customer may read GET /bookings/:id/deposit).
  const [deposit, setDeposit] = useState<DepositPosition | null>(null);
  useEffect(() => {
    if (!booking?.id) return;
    let live = true;
    BookingAPI.getDeposit(booking.id).then((p) => { if (live) setDeposit(p); }).catch(() => { if (live) setDeposit(null); });
    return () => { live = false; };
  }, [booking?.id, booking?.status]);
  useEffect(() => {
    if (!cancelDialogOpen || !booking) { setRefundPreview(null); return; }
    let cancelled = false;
    setRefundPreviewLoading(true);
    getRefundPreview(booking.id)
      .then((p) => {
        if (cancelled) return;
        setRefundPreview(p);
        const notice = p?.minNoticeHours ?? null;
        const left = p?.hoursUntilEvent ?? null;
        // Mirrors the server rule exactly: the window binds only a booking the
        // customer has committed to, so an unpaid one is never trapped by it.
        const committed = sk(booking.status) === "confirmed" || (p?.totalPaid ?? 0) > 0;
        setWindowClosed(!!notice && notice > 0 && left != null && left < notice && committed);
      })
      .catch(() => { if (!cancelled) setRefundPreview(null); })
      .finally(() => { if (!cancelled) setRefundPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [cancelDialogOpen, booking]);

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

  // CUSTOMER-036 - follow the venue's payment without a reload (socket + 60 s poll).
  useLiveRefresh(() => {
    axiosInstance
      .get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`)
      .then((res) => {
        const found = (res.data?.data || []).find((b: Booking) => String(b.id) === String(bookingId));
        if (found) setBooking(found);
      })
      .catch(() => { /* best-effort */ });
  }, !!user && !!bookingId);

  const fetchBooking = async () => {
    setIsLoadingBooking(true);
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/bookings/simple-user-bookings`,
      );
      const found = (res.data?.data || []).find(
        (b: Booking) => String(b.id) === String(bookingId),
      );
      setLoadFailed(false);
      if (found) setBooking(found);
      // else: the list loaded and this booking is not in it - that IS "not found".
    } catch {
      // CUSTOMER-059 - a network blip / 5xx is not "this booking was removed".
      setLoadFailed(true);
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
    let keepDialogOpen = false;
    try {
      const refundFlow = async () => {
        // PAY-CLOCK-014: pin the refund the customer was shown. If the figure
        // moved before the click (a tier boundary passed) the server answers
        // 409 REFUND_CHANGED and cancels nothing.
        // WP26: the pin is the POLICY part (the figure the server computes and compares), not the total shown.
        const shown = refundPreview ? refundPin(refundPreview) : undefined;
        await axiosInstance.patch(
          `${BACKEND_URL}api/v1/bookings/${booking.id}/cancel`,
          shown !== undefined ? { expectedRefund: shown } : undefined,
        );
        toast({
          title: "Booking cancelled",
          description: `Booking #${booking.id} has been cancelled.`,
        });
        fetchBooking();
      };

      if (cancelRouteFor(booking) === "delete") {
        try {
          await axiosInstance.delete(
            `${BACKEND_URL}api/v1/bookings/${booking.id}/cancel-pending`,
          );
          toast({
            title: "Booking cancelled",
            description: `Booking #${booking.id} has been cancelled.`,
          });
          router.push("/user/bookings");
        } catch (deleteError: unknown) {
          // A payment landed between this screen loading and the click. The
          // booking is owed a refund, so finish on the refund path rather than
          // failing at the customer — the previous code reported nothing here.
          if (!isPaymentAlreadyReceived(deleteError)) throw deleteError;
          await refundFlow();
        }
      } else {
        await refundFlow();
      }
    } catch (e: any) {
      /**
       * The venue's notice period closed between the dialog opening and this
       * click — or the preview never loaded and we offered the wrong thing.
       * Switch the dialog to the request route instead of reporting a failure
       * the customer can do nothing about.
       */
      if (e?.response?.status === 409 && e?.response?.data?.data?.code === "REFUND_CHANGED") {
        const d = e.response.data.data;
        const now = Number(d?.refund);
        setRefundPreview((p) => (p && Number.isFinite(now) ? { ...p, preview: { ...p.preview, refund: now } } : p));
        // The refund moved because the tier moved, so the forfeit line and the
        // breakdown moved with it: take the whole fresh preview, not just the figure.
        // WP26: the toast names the same TOTAL the dialog shows (policy refund + price-drop + declined-line), so it waits for the
        // fresh preview; the server's `d.refund` is only the policy part.
        const fresh = await getRefundPreview(booking.id).catch(() => null);
        if (fresh) setRefundPreview(fresh);
        const nowShown = fresh ? refundParts(fresh).total : now;
        toast({
          title: "Refund amount changed",
          description: Number.isFinite(nowShown)
            ? `The refund is now ${fmt(nowShown)}. Nothing was cancelled; check the new amount and confirm again.`
            : "The refund amount changed. Nothing was cancelled; check the new amount and confirm again.",
          variant: "destructive",
        });
        keepDialogOpen = true;
        return;
      }
      if (e?.response?.status === 409 && e?.response?.data?.data?.code === "CANCEL_WINDOW_CLOSED") {
        setWindowClosed(true);
        setIsCancelling(false);
        // PAY-UI_CUSTOMER-006: the finally below used to close the dialog anyway,
        // so the "ask the venue" mode never appeared.
        keepDialogOpen = true;
        return; // keep the dialog open, now in "ask the venue" mode
      }
      toast({
        title: "Error",
        description: cancelErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      if (!keepDialogOpen) setCancelDialogOpen(false);
    }
  };

  /**
   * Ask the venue to cancel. Records the ask against the booking and puts it in
   * front of the vendor; only they can grant it, and granting returns the money
   * in full through the vendor-cancellation path.
   */
  const handleRequestCancellation = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const out = await requestCancellation(booking.id, cancelReason.trim() || undefined);
      setRequestSent(true);
      toast({
        title: out?.alreadyOpen ? "Already with the venue" : "Request sent",
        description: out?.alreadyOpen
          ? "You've already asked to cancel this booking. The venue will reply here."
          : "The venue has been asked to cancel this booking.",
      });
      setCancelDialogOpen(false);
      fetchBooking();
    } catch {
      toast({
        title: "Couldn't send the request",
        description: "Please try again, or contact the venue directly.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
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
            <Button onClick={() => router.push(loginUrl())} size="sm">
              Log in
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!booking && loadFailed) {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="We couldn't load this booking"
          description="This looks like a connection problem, not a removed booking. Try again in a moment."
          action={
            <Button onClick={() => void fetchBooking()} size="sm" data-testid="booking-retry">
              Try again
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
  // The chip describes the amounts printed beside it, so a stale flag can never contradict them (open bookings only:
  // refunded / cancelled keep their own wording).
  const flagKey = sk(booking.paymentStatus);
  const derivedKey = ["pending", "partial", "paid"].includes(flagKey) ? bookingMoney(booking as never).status.toLowerCase() : flagKey;
  const payCfg = PAYMENT_CONFIG[derivedKey] || PAYMENT_CONFIG[flagKey] || PAYMENT_CONFIG.pending;
  const isCancellable = !["cancelled", "completed"].includes(statusKey);
  const isAwaitingPayment = statusKey === "awaiting payment";
  const paymentKey = sk(booking?.paymentStatus || "");
  // Received / owed come from the amounts (lib/utils/booking-money), never from the status flag.
  const money = bookingMoney(booking as never);
  const isPartiallyPaid = money.status === "Partial";
  const isFullyPaid = money.status === "Paid";
  /**
   * A closed booking never asks for more money.
   *
   * `showPayCta` was decided from paymentStatus alone. A cancelled booking that
   * had taken a deposit still reads "Partial" — paymentStatus records what was
   * collected, not whether the booking is alive — so a CANCELLED booking kept a
   * full-size "Pay remaining Rs 2,021,500" button and a "Now due" figure beside
   * it. The money is owed BACK to this customer at that point, not by them, and
   * the button was live: they could have paid two million rupees into a booking
   * that no longer exists.
   *
   * (Its mirror image is why a part-paid booking could not be cancelled: that
   * path read booking status and ignored paymentStatus. Both facts matter, and
   * neither is sufficient on its own.)
   */
  // Shared with /pay so the two screens cannot disagree about "closed".
  const isClosedStatus = isClosedBookingStatus(statusKey);
  /**
   * ...and the mirror of that: an OPEN booking with money still outstanding has
   * to offer a way to pay it.
   *
   * The old rule fired on `awaiting payment || partial`, which are the two
   * states that happen to *name* money. A booking the vendor had confirmed but
   * which had never been paid is `Confirmed` + `Pending` — it names no money, so
   * the couple were shown Postpone, Change date and Cancel, and no way to pay
   * at all. The same silence covered `Completed` + `Partial`: the event had
   * happened, the balance was outstanding, and the only party who could settle
   * it had no button. That is the customer half of the collections gap the
   * vendor worklist now surfaces.
   *
   * So the question is the real one — is this booking open, and is anything
   * still owed — with `Pending` deliberately excluded: until the vendor accepts,
   * there is nothing to pay into.
   */
  const outstanding = money.outstanding;
  const PAYABLE_STATUSES = ["awaiting payment", "confirmed", "completed"];
  const showPayCta =
    !isClosedStatus &&
    !isFullyPaid &&
    outstanding > 0 &&
    (PAYABLE_STATUSES.includes(statusKey) || isPartiallyPaid);
  // Nothing is due right now when the server says so (for example the advance is waived), even though a balance
  // remains for later. While the server answers, fall back to the balance; if it cannot, the balance is still true.
  const dueAmount = dueState === "ready" && dueNow != null ? dueNow : outstanding;
  const nothingDueNow = dueState === "ready" && (dueNow ?? 0) <= 0;
  const payLabel = isPartiallyPaid ? "Pay remaining" : "Pay now";
  const remaining = outstanding;
  const depositLine = customerDepositLine(deposit);
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
      {showPayCta && !nothingDueNow ? (
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
        <>
          {/* BK-100.9 — postpone-without-cancel. Shown next to Cancel
              so the customer always sees the kinder alternative. */}
          <PostponeBookingDialog
            bookingId={booking.id}
            bookingStatus={booking.status}
            eventDate={booking.bookingDate}
            alreadyPostponed={!!booking.postponedAt}
            onPostponed={fetchBooking}
            triggerVariant="button"
          />
          {/* BK-038 — customer "Change date" reschedule. A reprice can move money,
              so the backend re-validates and re-quotes on every request. */}
          <RescheduleBookingDialog
            bookingId={booking.id}
            bookingStatus={booking.status}
            currentDate={booking.bookingDate}
            currentTime={booking.bookingTime}
            onRescheduled={fetchBooking}
            triggerVariant="button"
          />
          <Button
            onClick={() => setCancelDialogOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5 border-bridal-coral/30 text-bridal-coral-dark hover:bg-bridal-coral/10 hover:text-bridal-coral-dark hover:border-bridal-coral/45"
          >
            <Trash2 className="size-3.5" />
            Cancel
          </Button>
        </>
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

      {/* BK-100.2 — umbrella context banner. When this booking is
          linked to a wedding-week umbrella, surface a tap-to-open
          link so the customer can jump into the umbrella view. */}
      {booking.umbrellaId && (
        <div className="mb-4 rounded-lg border border-bridal-gold/45 bg-bridal-cream p-3.5">
          <Link
            href={`/user/umbrellas/${booking.umbrellaId}`}
            className="flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-md bg-bridal-gold/15 border border-bridal-gold/35 flex items-center justify-center flex-shrink-0">
                <Star className="size-4 text-bridal-gold-dark" />
              </div>
              <div>
                <p className="text-sm font-medium text-bridal-charcoal">
                  Part of your wedding-week umbrella
                </p>
                <p className="text-xs text-bridal-text-soft">
                  Tap to see every event + vendor in one view
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-bridal-gold-dark group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* BK-100.9 — postponed-state banner. Shows above the detail
          grid so the customer + any family member opening the link
          immediately understands the booking is paused. */}
      {booking.postponedAt && (
        <div className="mb-5 rounded-lg border border-status-warning-line bg-status-warning-soft p-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-md bg-status-warning-soft border border-status-warning-line flex items-center justify-center flex-shrink-0">
              <Timer className="size-4 text-status-warning" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-medium text-status-warning">
                This booking is postponed
              </p>
              {booking.postponedUntilAt && (
                <p className="text-xs text-status-warning">
                  Set a new date by {fmtShort(booking.postponedUntilAt)} via reschedule. Your deposit stays safe in the meantime.
                </p>
              )}
              {/* BK-038 — the actual "set a new date" control the banner references. */}
              {!["cancelled", "completed"].includes(statusKey) ? (
                <div className="pt-1">
                  <RescheduleBookingDialog
                    bookingId={booking.id}
                    bookingStatus={booking.status}
                    currentDate={booking.bookingDate}
                    currentTime={booking.bookingTime}
                    onRescheduled={fetchBooking}
                    triggerLabel="Set a new date"
                    triggerVariant="link"
                  />
                </div>
              ) : null}
              {booking.postponeReason && (
                <p className="text-xs text-status-warning italic mt-1 leading-relaxed">
                  &ldquo;{booking.postponeReason}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
                    {bookingSlotText(booking, "customer") || "—"}
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

            {/* BK-100.53 — service-location block. Renders only when
                set; legacy bookings without a mode render nothing here
                so the existing card layout is unchanged. */}
            {booking.serviceLocationMode && booking.serviceLocationMode !== "at_vendor" ? (
              <div className="mt-5 pt-5 border-t border-border/60">
                <p className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-muted-foreground mb-2">
                  Service location
                </p>
                <div className="bg-muted/30 rounded-md p-3 space-y-1.5">
                  <p className="text-[13.5px] text-foreground/85 font-medium">
                    {(() => {
                      switch (booking.serviceLocationMode) {
                        case "at_customer_home":
                          return "At customer's home";
                        case "at_customer_plot":
                          return "At customer's plot / lawn";
                        case "at_third_party":
                          return "At a third-party venue";
                        default:
                          return "At vendor's place";
                      }
                    })()}
                  </p>
                  {booking.serviceLocationAddress && (
                    <p className="text-[13px] text-foreground/80 leading-relaxed">
                      {booking.serviceLocationAddress}
                    </p>
                  )}
                  {booking.serviceLocationNotes && (
                    <p className="text-[12px] text-muted-foreground italic leading-relaxed">
                      {booking.serviceLocationNotes}
                    </p>
                  )}
                </div>
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
                        {(detail as { status?: string }).status === "declined" ? (
                          <p className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                            Could not take your booking
                          </p>
                        ) : null}
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
                        <p
                          className={`font-display italic text-[18px] text-foreground tabular-nums leading-none${
                            (detail as { status?: string }).status === "declined" ? " line-through opacity-60" : ""
                          }`}
                        >
                          {(detail as { status?: string }).status === "declined"
                            ? fmt((detail as { declinedAmount?: number | string }).declinedAmount ?? 0)
                            : fmt(detail.totalAmount)}
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
                                    <CheckCircle2 className="size-3 text-status-success flex-shrink-0 mt-0.5" />
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
                <span className="text-muted-foreground">Paid so far</span>
                <span className="font-medium text-foreground tabular-nums">
                  {fmt(money.received)}
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
              {depositLine ? (
                <div className="pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Refundable deposit</span>
                    <span className="font-medium text-foreground tabular-nums">{fmt(depositLine.amount)}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{depositLine.note}</p>
                </div>
              ) : null}
            </div>

            {showPayCta && dueState === "loading" ? (
              <div className="mt-4 pt-4 border-t border-border/60 text-[12px] text-muted-foreground">Checking what is due…</div>
            ) : null}

            {showPayCta && nothingDueNow ? (
              <div className="mt-4 pt-4 border-t border-border/60 text-[12.5px] leading-snug text-muted-foreground">
                {nextPayment ? (
                  <>
                    Nothing is due right now. Your next payment, <span className="font-medium text-foreground tabular-nums">{fmt(nextPayment.amount)}</span>
                    {nextPayment.dueDate ? <> is due on {dayTextCustomer(nextPayment.dueDate)}.</> : <> is due later.</>}
                  </>
                ) : (
                  <>Nothing is due right now. The remaining <span className="font-medium text-foreground tabular-nums">{fmt(outstanding)}</span> is due before your event. Your venue will tell you when.</>
                )}
              </div>
            ) : null}

            {showPayCta && dueState !== "loading" && !nothingDueNow && dueAmount > 0 ? (
              <div className="mt-4 pt-4 border-t border-border/60 flex items-end justify-between">
                <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-muted-foreground">
                  Now due
                </span>
                <span className="font-display italic text-[24px] text-foreground tabular-nums leading-none">
                  {fmt(dueAmount)}
                </span>
              </div>
            ) : null}

            {showPayCta && dueState !== "loading" && !nothingDueNow && dueAmount > 0 ? (
              <Button
                className="w-full mt-4 gap-1.5"
                size="sm"
                onClick={() => router.push(`/user/bookings/${booking.id}/pay`)}
              >
                <Wallet className="size-3.5" />
                {isPartiallyPaid ? `Pay remaining ${fmt(dueAmount)}` : `Pay ${fmt(dueAmount)}`}
                <ChevronRight className="size-3" />
              </Button>
            ) : null}
          </SectionCard>

          {/* WW-RECORD-MODE — what happened to a payment the customer reported. */}
          {/* WW-REQUIREMENTS — the customer sees the same rows the vendor does,
              including which are still unanswered. */}
          <RequirementsCard bookingId={booking.id} role="customer" />

          <PaymentClaimStatusCard bookingId={booking.id} />

          {/* BK-042 — payment schedule (down + remaining; legacy bookings hide). */}
          <InstallmentsCard bookingId={booking.id} />

          {/* BK-054/55/56 — mid-booking change requests (guest count / slot / package / extras). */}
          <ChangeRequestsCard
            bookingId={booking.id}
            canRequest={
              statusKey !== "cancelled" && statusKey !== "completed"
            }
            /* WW-QIST — an instalment plan has to add up to what is still owed,
               so the card is given the number rather than guessing it. */
            outstanding={outstanding}
            eventDate={booking.bookingDate}
          />

          {/* BK-067 — post-completion dispute window (default 7d). */}
          <DisputeCard
            bookingId={booking.id}
            isCompleted={statusKey === "completed"}
          />

          {/* EPIC 5 · §3 — customer refund request. The old comment here said the
              endpoint was vendor/admin-scoped; that is out of date. raiseRefundRequest
              routes a genuine customer on their OWN booking to
              raiseRefundRequestAsCustomer BEFORE the vendor gate, and
              DISPUTE_ENGINE_ENABLED is globally enabled in production — so the
              build-time flag that hid this card has been removed. Raising a request
              moves NO money: it freezes the calculation for the vendor to decide.
              Shown only where sensible: an active booking with money paid. */}
          <RefundRequestCard
            bookingId={booking.id}
            canRequest={
              !["cancelled", "completed"].includes(statusKey) &&
              ["paid", "partial"].includes(paymentKey)
            }
          />

          {/* WW-SETTLE — the other half. RefundRequestCard above only ASKS for a
              refund; this is where the family sees whether the venue has paid it
              and says so. It matters most on a cancelled booking, which is
              exactly where the card above stops rendering — so it is placed
              outside that gate and self-hides when there is nothing to show. */}
          <RefundSettlementCard bookingId={booking.id} />

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
                className="w-full justify-start gap-2 text-[13px] text-bridal-coral-dark hover:text-bridal-coral-dark hover:bg-bridal-coral/10"
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
              <AlertTriangle className="size-5 text-bridal-coral-dark" />
              {windowClosed ? `Ask the venue to cancel #${booking.id}?` : `Cancel booking #${booking.id}?`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {windowClosed ? (
                  <>
                    <p>
                      This booking is too close to the event date to cancel
                      online. {refundPreview?.minNoticeHours ? (
                        <>
                          {refundPreview.policyName || "The venue"} needs at least{" "}
                          <strong className="text-bridal-charcoal">{noticeText(refundPreview.minNoticeHours)}</strong>{" "}
                          notice.
                        </>
                      ) : null}
                    </p>
                    <p>
                      You can ask the venue to cancel it for you. They decide,
                      and you&apos;ll see their answer here.
                    </p>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Why do you need to cancel? (optional, but it helps)"
                      className="w-full rounded-md border border-bridal-gold/45 bg-bridal-ivory p-2 text-sm text-bridal-charcoal placeholder:text-bridal-text-soft focus:outline-none focus:ring-2 focus:ring-bridal-gold/50"
                    />
                  </>
                ) : (
                  <p>
                    This action cannot be undone. Any payments made may be
                    subject to the vendor&apos;s refund policy.
                  </p>
                )}
                {/* QA #4 — show the actual refund per the vendor's policy so the
                    customer decides with the real number, not a vague warning.
                    Hidden when the refund engine is off or nothing was paid. */}
                {refundPreviewLoading && (
                  <p className="text-xs text-bridal-text-soft">Checking your refund…</p>
                )}
                {refundPreview && (refundPreview.totalPaid > 0 || (refundPreview.unledgeredAdvance ?? 0) > 0 || refundParts(refundPreview).hasExtras) && (
                  <div className="rounded-md border border-bridal-gold/45 bg-bridal-cream p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-bridal-charcoal">You&apos;ll get back</span>
                      {/* WP26: the TOTAL the customer receives (policy refund + price-drop + declined-line), not the policy part alone */}
                      <span className="font-semibold text-status-success" data-refund-total>{fmt(refundParts(refundPreview).total)}</span>
                    </div>
                    {/* one short line per component, only when money beyond the policy refund is owed */}
                    {refundParts(refundPreview).hasExtras && (
                      <div className="mt-1 space-y-0.5 text-xs text-bridal-text-soft" data-refund-components>
                        {refundParts(refundPreview).policy > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Refund per the venue&apos;s policy</span>
                            <span>{fmt(refundParts(refundPreview).policy)}</span>
                          </div>
                        )}
                        {refundParts(refundPreview).priceDrop > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Paid above the reduced price</span>
                            <span>{fmt(refundParts(refundPreview).priceDrop)}</span>
                          </div>
                        )}
                        {refundParts(refundPreview).declinedLine > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Held for a service the venue declined</span>
                            <span>{fmt(refundParts(refundPreview).declinedLine)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {refundPreview.preview.forfeit > 0 && (
                      <div className="mt-1 flex items-center justify-between text-xs text-bridal-text-soft">
                        {/*
                          `policy.labelEn` is the ENGINE's label for the tier
                          shape, which for a vendor's own saved schedule is the
                          generic "Policy" — rendering "per Policy policy".
                          `policyName` is what the policy is actually called
                          ("Default", "Aam", whatever the vendor named theirs),
                          which is the only version of this sentence a customer
                          could act on.
                        */}
                        <span>Venue keeps (per {refundPreview.policyName || refundPreview.policy.labelEn} policy)</span>
                        <span>{fmt(refundPreview.preview.forfeit)}</span>
                      </div>
                    )}
                    {/* WP29: the policy in plain words (Non-Refundable / Partially Refundable / the standard schedule),
                        from the same resolver that computed the figure above */}
                    {refundPreview.policySummary?.detail && (
                      <p className="mt-1.5 text-[11px] text-bridal-text-soft leading-relaxed" data-policy-summary>
                        {/* the standard schedule's own sentence already names it; the others lead with their headline */}
                        {refundPreview.policySummary.kind !== "standard" && <span className="font-medium">{refundPreview.policySummary.headline}. </span>}
                        {refundPreview.policySummary.detail}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-bridal-text-soft leading-relaxed">
                      {/* Whole days only. daysBefore arrives as an exact float
                          (19.40760377314815) and was rendered raw, on the screen
                          where the customer decides about money. */}
                      Cancelling {Math.round(refundPreview.daysBefore)} day
                      {Math.round(refundPreview.daysBefore) === 1 ? "" : "s"} before the
                      event. The refund is processed per the vendor&apos;s policy.
                    </p>
                    {/* Say the deadline while it can still be acted on, rather
                        than only once it has passed and the answer is no. */}
                    {!windowClosed && !!refundPreview.minNoticeHours && (
                      <p className="mt-1 text-[11px] text-bridal-text-soft leading-relaxed">
                        You can cancel online up to {noticeText(refundPreview.minNoticeHours)} before the event.
                      </p>
                    )}
                    {/* WP16: an advance the booking shows as paid but the venue never recorded is not part of
                        the refund; say so in one line rather than let the figure look short. */}
                    {(refundPreview.unledgeredAdvance ?? 0) > 0 && (
                      <p className="mt-1 text-[11px] text-bridal-text-soft leading-relaxed" data-unledgered-advance>
                        {fmt(refundPreview.unledgeredAdvance as number)} shown as paid on this booking isn&apos;t recorded as received by the venue, so it isn&apos;t in this refund. Ask the venue to confirm it.
                      </p>
                    )}
                  </div>
                )}
                {/* BK-100.2 Layer 2c — surface umbrella context when
                    the booking is part of a wedding-week umbrella. The
                    umbrella's bundle-savings tier is computed from
                    active siblings; cancelling one event may drop the
                    surviving siblings to a lower tier (but does NOT
                    retroactively change their snapshots — historical
                    pricing is preserved). */}
                {booking.umbrellaId && (
                  <div className="rounded-md border border-bridal-gold/45 bg-bridal-cream p-3 text-sm">
                    <p className="font-medium text-bridal-charcoal">
                      Part of your wedding-week umbrella
                    </p>
                    <p className="text-xs text-bridal-text-soft mt-1 leading-relaxed">
                      Other linked events stay scheduled — only this booking is
                      cancelled. If you want to cancel the whole wedding,
                      open the umbrella and use{" "}
                      <Link
                        href={`/user/umbrellas/${booking.umbrellaId}`}
                        className="underline decoration-bridal-gold-dark/50 hover:text-bridal-gold-dark"
                      >
                        cancel everything
                      </Link>{" "}
                      from there.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Radix closes the dialog on every action click. Hold it open and let
                // the handlers close it: handleCancel keeps it open on REFUND_CHANGED /
                // CANCEL_WINDOW_CLOSED (PAY-UI_CUSTOMER-006, RD-7) and closes it on
                // success or any other answer.
                e.preventDefault();
                if (windowClosed) { void handleRequestCancellation(); return; }
                void handleCancel();
              }}
              disabled={isCancelling || requestSent}
              className="bg-bridal-coral-dark hover:bg-bridal-coral-dark/95 text-white"
            >
              {isCancelling
                ? (windowClosed ? "Sending…" : "Cancelling…")
                : (windowClosed ? "Ask the venue" : "Yes, cancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

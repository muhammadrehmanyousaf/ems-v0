"use client";

import { dateOnlyOf, fmtYmd } from "@/lib/utils/ymd"
import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  CreditCard,
  Wallet,
  RefreshCw,
  Calendar,
  Building2,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PaymentAPI } from "@/lib/api/payments";
import { toast } from "@/components/ui/use-toast";
import { getUser } from "@/hooks/getLoggedinUser";
import { bookingSlotText } from "@/lib/booking/slot-vocabulary";

import {
  PageContainer,
  PageHeader,
  KpiCard,
  EmptyState,
} from "@/components/user-dashboard";
import { bookingMoney } from "@/lib/utils/booking-money";
import { customerPaymentFromView } from "@/lib/payment-status";

const fmt = (n: number | string | null | undefined) =>
  `Rs. ${Number(n || 0).toLocaleString()}`;

const fmtDate = (s: string) =>
  dateOnlyOf(s) ? fmtYmd(s, "short", null, "en-US") : new Date(s).toLocaleDateString("en-US", { // WP23: a calendar day is printed from the string
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const sk = (s: string) => (s || "").toLowerCase();

// SLOTS step 10 — one vocabulary; see lib/booking/slot-vocabulary.

function resolvePaymentAction(booking: any): {
  type: "awaiting_down" | "remaining" | "done" | "none";
  amount: number;
  label: string;
} {
  // WP08 / PAY-UI_CUSTOMER-002: the server's own figure (`paymentView`, from the schedule) decides
  // what is due and whether the booking is paid up; the derivation below is the fallback.
  const fromServer = customerPaymentFromView(booking);
  if (fromServer) return fromServer;
  const status = sk(booking.status);
  // Amounts decide what is owed, never the status flag; money columns arrive as strings ("0.00"), so no `||` on them.
  const money = bookingMoney(booking);
  const payment = sk(booking.paymentStatus) === "refunded" ? "refunded" : money.status.toLowerCase();

  if (status === "awaiting payment" && payment === "pending") {
    return { type: "awaiting_down", amount: money.outstanding, label: "Pay now" };
  }
  if (status === "pending" && payment === "pending") {
    return { type: "awaiting_down", amount: money.outstanding, label: "Pay now" };
  }
  if (status === "confirmed" && payment === "partial") {
    return { type: "remaining", amount: money.outstanding, label: "Pay remaining" };
  }
  if (payment === "paid" || status === "completed") {
    return {
      type: "done",
      amount: money.booked,
      label: "Paid",
    };
  }
  return { type: "none", amount: 0, label: "" };
}

/**
 * The three figures a booking row prints. The server's `paymentView` (WP08) is the source when the
 * booking carries one: it is read from the same schedule the pay page uses and already follows a
 * struck final bill, so "Total", "Paid so far" and "Remaining" cannot disagree with the "Pay now"
 * amount above them. Without a view the legacy arithmetic stays.
 */
function figuresOf(booking: any): { total: number; received: number; outstanding: number } {
  const v = booking?.paymentView;
  const n = (x: unknown) => (x === null || x === undefined || x === "" ? NaN : Number(x));
  if (v && !v.cancelled && [n(v.total), n(v.received), n(v.outstanding)].every(Number.isFinite)) {
    return { total: n(v.total), received: n(v.received), outstanding: n(v.outstanding) };
  }
  const m = bookingMoney(booking);
  return { total: Number(booking?.totalAmount || 0), received: m.received, outstanding: m.outstanding };
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-bridal-gold" />
          </div>
        </PageContainer>
      }
    >
      <PaymentsPageContent />
    </Suspense>
  );
}

function PaymentsPageContent() {
  const { user } = getUser();
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  /**
   * WW-DIRECT-PAY — the Stripe Checkout return handler is gone.
   *
   * It read `?session_id` / `?cancelled` off the URL, called
   * `verifyCheckoutSession`, then poked processDownPayment /
   * processRemainingPayment / processFullPayment to record what Stripe had
   * taken. Every one of those parameters was written by Stripe redirecting
   * back here, and there is no Checkout Session to return from any more.
   *
   * Nothing replaces it because nothing needs to: a customer now transfers to
   * the venue and reports it on /user/bookings/[id]/pay, and the VENDOR
   * confirming that claim is what records the payment. There is no moment when
   * this page has to reconcile a third party's result.
   */

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await PaymentAPI.getUserBookings();
      const all = [
        ...res.pendingPayments.map((p) => ({
          ...p,
          _resolved: resolvePaymentAction(p),
        })),
        ...res.paymentHistory.map((p) => ({
          ...p,
          _resolved: resolvePaymentAction(p),
        })),
      ];
      setBookings(all);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch payments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pending = useMemo(
    () =>
      bookings.filter((b) =>
        ["awaiting_down", "remaining"].includes(b._resolved?.type),
      ),
    [bookings],
  );
  const history = useMemo(
    () => bookings.filter((b) => b._resolved?.type === "done"),
    [bookings],
  );

  const totalDue = pending.reduce((s, b) => s + (b._resolved?.amount || 0), 0);
  const totalPaid = history.reduce((s, b) => s + (b.paymentView ? figuresOf(b).received : Number(b.totalAmount || 0)), 0);

  /**
   * WW-DIRECT-PAY — send them to the one pay surface instead of a modal.
   *
   * This opened a Stripe Elements modal, with `currency: "usd"` — which is on
   * its own the whole story: Stripe does not onboard Pakistani businesses, so
   * that modal could never move money to a venue, and it quoted a currency no
   * venue on the platform is paid in.
   *
   * The platform now takes no payments. `/user/bookings/[id]/pay` is the single
   * screen that knows what is owed, which of the venue's accounts to show, and
   * whether the vendor has even accepted yet — none of which this page has. So
   * it routes there rather than growing a second, thinner copy of that logic
   * which would drift out of step with it.
   */
  const handlePay = (booking: any) => {
    const id = booking.bookingId || booking.id;
    if (!id) return;
    router.push(`/user/bookings/${id}/pay`);
  };

  const eyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Payments</span>
    </>
  );

  const headerActions = (
    <Button
      onClick={fetchBookings}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-1.5"
    >
      <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
      Refresh
    </Button>
  );

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="Payments"
          description="Track pending payments and view your payment history."
          actions={headerActions}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <KpiCard key={i} label="" value={0} isLoading />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="Payments"
        description="Track pending payments and view your payment history."
        actions={headerActions}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pending payments"
          value={pending.length}
          icon={<Clock className="size-4" />}
          invertTrendColor
        />
        <KpiCard
          label="Amount due"
          value={fmt(totalDue)}
          icon={<Wallet className="size-4" />}
          invertTrendColor
        />
        <KpiCard
          label="Completed"
          value={history.length}
          icon={<CheckCircle2 className="size-4" />}
        />
        <KpiCard
          label="Total paid"
          value={fmt(totalPaid)}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="h-auto bg-muted/50 p-1 grid grid-cols-2 gap-1">
          <TabsTrigger
            value="pending"
            className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[12.5px]"
          >
            Pending payments
            {pending.length > 0 ? (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                  activeTab === "pending"
                    ? "bg-bridal-cream text-bridal-gold-dark"
                    : "bg-muted-foreground/10 text-muted-foreground",
                )}
              >
                {pending.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[12.5px]"
          >
            Payment history
            {history.length > 0 ? (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                  activeTab === "history"
                    ? "bg-bridal-cream text-bridal-gold-dark"
                    : "bg-muted-foreground/10 text-muted-foreground",
                )}
              >
                {history.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "pending" &&
        (pending.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="size-6" />}
            title="All caught up"
            description="You have no pending payments right now."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[1400px]:grid-cols-2">
            {pending.map((booking) => {
              const action = booking._resolved;
              const isRemaining = action.type === "remaining";
              const accent = isRemaining
                ? "border-l-bridal-mauve"
                : "border-l-bridal-gold";
              const badgeTone = isRemaining
                ? "border-status-info-line bg-status-info-soft text-status-info"
                : "border-status-warning-line bg-status-warning-soft text-status-warning";

              return (
                <Card
                  key={booking.bookingId || booking.id}
                  className={cn(
                    "border-l-4 overflow-hidden transition-shadow hover:shadow-md",
                    accent,
                  )}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em] tabular-nums">
                            Booking #{booking.bookingId || booking.id}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border",
                              badgeTone,
                            )}
                          >
                            {isRemaining ? (
                              <Clock className="size-3" />
                            ) : (
                              <Wallet className="size-3" />
                            )}
                            {isRemaining ? "Remaining due" : "Down payment due"}
                          </span>
                        </div>
                        <h3 className="font-display italic text-[18px] text-foreground">
                          {booking.businesses?.[0]?.name ||
                            booking.customerName ||
                            "Booking"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Booked on {fmtDate(booking.createdAt)}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-display italic text-[26px] text-foreground tabular-nums leading-none">
                          {fmt(action.amount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          of <span className="tabular-nums">{fmt(figuresOf(booking).total)}</span> total
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-bridal-gold" />
                        {fmtDate(booking.bookingDate)}
                      </span>
                      {bookingSlotText(booking, "customer") ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-bridal-gold" />
                          {bookingSlotText(booking, "customer")}
                        </span>
                      ) : null}
                      {booking.businesses?.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-bridal-gold" />
                          {booking.businesses.map((b: any) => b.name).join(", ")}
                        </span>
                      ) : null}
                    </div>

                    <div className="rounded-lg bg-muted/30 border border-border/60 p-3 mb-4 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground">
                          Total
                        </p>
                        <p className="font-display italic text-[16px] text-foreground tabular-nums mt-0.5">
                          {fmt(figuresOf(booking).total)}
                        </p>
                      </div>
                      <div className="border-x border-border/60">
                        <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground">
                          Paid so far
                        </p>
                        <p className="font-display italic text-[16px] text-foreground tabular-nums mt-0.5">
                          {fmt(figuresOf(booking).received)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground">
                          Remaining
                        </p>
                        <p className="font-display italic text-[16px] text-foreground tabular-nums mt-0.5">
                          {fmt(figuresOf(booking).outstanding)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/60">
                      <Button
                        onClick={() =>
                          router.push(`/user/bookings/${booking.bookingId || booking.id}`)
                        }
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                      >
                        Details
                        <ArrowRight className="size-3" />
                      </Button>
                      {/* F5-1: on a phone the label plus the amount no longer fits beside Details; the row wraps instead of cutting the amount */}
                      <Button
                        onClick={() => handlePay(booking)}
                        size="sm"
                        className="gap-1.5 flex-1 min-w-[14rem]"
                      >
                        <CreditCard className="size-3.5" />
                        {action.label} — {fmt(action.amount)}
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {activeTab === "history" &&
        (history.length === 0 ? (
          <EmptyState
            icon={<Clock className="size-6" />}
            title="No payment history yet"
            description="Your completed payments will appear here."
          />
        ) : (
          <div className="space-y-2">
            {history.map((booking) => (
              <Card
                key={booking.bookingId || booking.id}
                className="p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bridal-sage/15 text-status-success">
                  <CheckCircle2 className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em] tabular-nums">
                      Booking #{booking.bookingId || booking.id}
                    </span>
                    <span className="text-[10.5px] uppercase tracking-[0.18em] font-medium px-2 py-0.5 rounded-full border border-status-success-line bg-status-success-soft text-status-success">
                      Paid
                    </span>
                  </div>
                  <p className="font-display italic text-[16px] text-foreground truncate">
                    {booking.businesses?.[0]?.name ||
                      booking.customerName ||
                      "Booking"}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {fmtDate(booking.bookingDate)}
                    </span>
                    {booking.businesses?.length > 0 ? (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Building2 className="size-3" />
                        {booking.businesses.map((b: any) => b.name).join(", ")}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-display italic text-[18px] text-status-success tabular-nums leading-none">
                    {fmt(figuresOf(booking).total)}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground mt-1">
                    {fmtDate(booking.createdAt)}
                  </p>
                  <Button
                    onClick={() =>
                      router.push(`/user/bookings/${booking.bookingId || booking.id}`)
                    }
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground mt-1 -mr-1"
                  >
                    Details <ChevronRight className="size-3 ml-0.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ))}

    </PageContainer>
  );
}

"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import type { PendingPayment } from "@/lib/types";
import dynamic from "next/dynamic";
import { toast } from "@/components/ui/use-toast";
import { getUser } from "@/hooks/getLoggedinUser";

import {
  PageContainer,
  PageHeader,
  KpiCard,
  EmptyState,
} from "@/components/user-dashboard";

const StripePayment = dynamic(
  () => import("@/components/booking/stripe-payment"),
  { ssr: false },
);

const fmt = (n: number | string | null | undefined) =>
  `Rs. ${Number(n || 0).toLocaleString()}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const sk = (s: string) => (s || "").toLowerCase();

const TIME_LABELS: Record<string, string> = {
  "09:00": "9 AM – 12 PM",
  "14:00": "2 PM – 6 PM",
  "18:00": "6 PM – 11 PM",
};

function resolvePaymentAction(booking: any): {
  type: "awaiting_down" | "remaining" | "done" | "none";
  amount: number;
  label: string;
} {
  const status = sk(booking.status);
  const payment = sk(booking.paymentStatus);

  if (status === "awaiting payment" && payment === "pending") {
    return {
      type: "awaiting_down",
      amount: Number(booking.downPayment || 0),
      label: "Pay down payment",
    };
  }
  if (status === "pending" && payment === "pending") {
    return {
      type: "awaiting_down",
      amount: Number(booking.downPayment || 0),
      label: "Pay down payment",
    };
  }
  if (status === "confirmed" && payment === "partial") {
    const remaining =
      Number(booking.totalAmount || 0) - Number(booking.downPayment || 0);
    return { type: "remaining", amount: remaining, label: "Pay remaining" };
  }
  if (payment === "paid" || status === "completed") {
    return {
      type: "done",
      amount: Number(booking.totalAmount || 0),
      label: "Paid",
    };
  }
  return { type: "none", amount: 0, label: "" };
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
  const searchParams = useSearchParams();
  const sessionVerifiedRef = useRef(false);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    const sessionId = searchParams?.get("session_id");
    const bookingId = searchParams?.get("bookingId");
    const paymentType = searchParams?.get("paymentType");
    const cancelled = searchParams?.get("cancelled");

    if (cancelled) {
      toast({
        title: "Payment cancelled",
        description: "You cancelled the payment. You can try again anytime.",
        variant: "destructive",
      });
      router.replace("/user/payments");
      return;
    }
    if (sessionId && !sessionVerifiedRef.current) {
      sessionVerifiedRef.current = true;
      verifyStripeSession(
        sessionId,
        bookingId ? Number(bookingId) : undefined,
        paymentType || undefined,
      );
    }
  }, [searchParams]);

  const verifyStripeSession = async (
    sessionId: string,
    bookingId?: number,
    paymentType?: string,
  ) => {
    try {
      toast({
        title: "Verifying payment",
        description: "Please wait while we confirm your payment…",
      });
      const result = await PaymentAPI.verifyCheckoutSession(
        sessionId,
        bookingId,
        paymentType,
      );
      if (!result.alreadyProcessed) {
        const pType = result.paymentType || paymentType || "down_payment";
        try {
          if (pType === "down_payment")
            await PaymentAPI.processDownPayment(result.bookingId);
          else if (pType === "remaining_payment")
            await PaymentAPI.processRemainingPayment(result.bookingId);
          else if (pType === "full_payment")
            await PaymentAPI.processFullPayment(result.bookingId);
        } catch {
          /* non-critical */
        }
        toast({
          title: "Payment successful",
          description: `Your payment of ${fmt(result.amount)} has been processed.`,
        });
      } else {
        toast({
          title: "Already processed",
          description: "This payment was already recorded.",
        });
      }
      await fetchBookings();
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.message || "Could not verify payment. Please contact support.",
        variant: "destructive",
      });
    } finally {
      router.replace("/user/payments");
    }
  };

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
  const totalPaid = history.reduce((s, b) => s + Number(b.totalAmount || 0), 0);

  const handlePay = (booking: any) => {
    const action = booking._resolved;
    if (!action || !action.amount) return;
    const paymentType: "down_payment" | "remaining_payment" | "full_payment" =
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
          <div className="space-y-3">
            {pending.map((booking) => {
              const action = booking._resolved;
              const isRemaining = action.type === "remaining";
              const accent = isRemaining
                ? "border-l-bridal-mauve"
                : "border-l-bridal-gold";
              const badgeTone = isRemaining
                ? "border-bridal-rose/45 bg-bridal-blush text-bridal-mauve"
                : "border-bridal-gold/45 bg-bridal-gold/12 text-bridal-gold-dark";

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
                          of <span className="tabular-nums">{fmt(booking.totalAmount)}</span> total
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-bridal-gold" />
                        {fmtDate(booking.bookingDate)}
                      </span>
                      {booking.bookingTime ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-bridal-gold" />
                          {TIME_LABELS[booking.bookingTime] || booking.bookingTime}
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
                          {fmt(booking.totalAmount)}
                        </p>
                      </div>
                      <div className="border-x border-border/60">
                        <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground">
                          Down payment
                        </p>
                        <p className="font-display italic text-[16px] text-foreground tabular-nums mt-0.5">
                          {fmt(booking.downPayment || booking.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground">
                          Remaining
                        </p>
                        <p className="font-display italic text-[16px] text-foreground tabular-nums mt-0.5">
                          {fmt(
                            Number(booking.totalAmount || 0) -
                              Number(booking.downPayment || booking.amount || 0),
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-border/60">
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
                      <Button
                        onClick={() => handlePay(booking)}
                        size="sm"
                        className="gap-1.5 flex-1"
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bridal-sage/15 text-[#3F6B43]">
                  <CheckCircle2 className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em] tabular-nums">
                      Booking #{booking.bookingId || booking.id}
                    </span>
                    <span className="text-[10.5px] uppercase tracking-[0.18em] font-medium px-2 py-0.5 rounded-full border border-bridal-sage/45 bg-bridal-sage/15 text-[#3F6B43]">
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
                  <p className="font-display italic text-[18px] text-[#3F6B43] tabular-nums leading-none">
                    {fmt(booking.totalAmount)}
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

      {selectedPayment ? (
        <StripePayment
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPayment(null);
          }}
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
            toast({
              title: "Success",
              description: "Payment processed successfully.",
            });
          }}
          onPaymentFailure={() => {
            setPaymentModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      ) : null}
    </PageContainer>
  );
}

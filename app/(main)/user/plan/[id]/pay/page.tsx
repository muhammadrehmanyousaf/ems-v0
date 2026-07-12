"use client";

/**
 * Shaadi Plan — "Pay for my whole wedding" (unified pay flow).
 *
 * A plan checkout creates one Booking per function, each in "Awaiting Payment".
 * Historically the customer had to open each booking's own pay page and settle
 * its down-payment separately. This screen gives them ONE experience: the whole
 * wedding's total due + a per-function breakdown, then it walks them through
 * paying each function in sequence by REUSING the exact same Stripe Elements pay
 * component a single booking uses (BookingPaymentScreen / PaymentMethodChooser).
 *
 * Correctness note — there is NO combined charge. Each function is paid through
 * its own PaymentIntent and settles via the UNCHANGED per-booking webhook (keyed
 * on bookingId), so every booking ends up correctly Partial/Paid via the proven
 * path. We only render ONE pay form at a time (the active function) so exactly
 * one intent is ever in flight. Outcomes are honest per function: paid ✓,
 * reserved (cash) or, on a decline, the form surfaces the error and the customer
 * retries in place before we advance.
 *
 * Flag-gated (mount effect) + hidden when off; the legacy single-booking pay
 * page is untouched.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  PartyPopper,
  Wallet,
  CalendarHeart,
  CreditCard,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { useWeddingPlanFlag } from "@/lib/wedding-plan";
import {
  WeddingPlansAPI,
  type PlanPaymentSummary,
  type PlanPayableBooking,
} from "@/lib/api/weddingPlans";
import { eventTypeLabel, fmtPlanDate, fmtPKR } from "@/lib/wedding-plan-events";
// Reuse the EXACT per-booking pay machinery — the Stripe Elements card screen,
// plus the cash / JazzCash chooser when those flags are on (same selection the
// single-booking pay page makes). Never fakes success.
import BookingPaymentScreen from "@/components/booking/steps-v2/booking-payment-screen";
import PaymentMethodChooser, {
  type PaymentOutcome,
} from "@/components/booking/payment-method-chooser";
import { CASH_BOOKING_ENABLED, PK_PAYMENTS_ENABLED } from "@/lib/payment-flags";

type Resolved = "paid" | "reserved";

function bookingLabel(b: PlanPayableBooking): string {
  const ev = eventTypeLabel(b.eventType);
  const vendor = b.vendorName || `Vendor for booking #${b.bookingId}`;
  return `${vendor} · ${ev}`;
}

export default function PlanPayPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUser();
  const enabled = useWeddingPlanFlag();
  const [mounted, setMounted] = React.useState(false);
  const planId = Number(params?.id);

  const [summary, setSummary] = React.useState<PlanPaymentSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [outcomeById, setOutcomeById] = React.useState<Record<number, Resolved>>({});

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/user/plan/${planId}/pay`);
    }
  }, [isAuthenticated, isLoading, router, planId]);

  const load = React.useCallback(async () => {
    if (!user || !enabled) return;
    if (!Number.isFinite(planId)) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await WeddingPlansAPI.paymentSummary(planId);
      setSummary(s);
      // Start on the first still-payable function.
      const firstPayable = s?.bookings.find((b) => b.payable);
      setActiveId(firstPayable ? firstPayable.bookingId : null);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't load your wedding payments";
      toast({ title: "Couldn't load", description: msg, variant: "destructive" });
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [user, enabled, planId]);

  React.useEffect(() => {
    if (user && enabled) load();
  }, [user, enabled, load]);

  // --- Derived ------------------------------------------------------------
  const payables = React.useMemo(
    () => (summary?.bookings ?? []).filter((b) => b.payable),
    [summary],
  );

  const isResolved = React.useCallback(
    (b: PlanPayableBooking) => outcomeById[b.bookingId] != null,
    [outcomeById],
  );

  const remaining = React.useMemo(
    () => payables.filter((b) => !isResolved(b)),
    [payables, isResolved],
  );

  const resolvedCount = payables.length - remaining.length;
  const dueRemaining = remaining.reduce((s, b) => s + b.dueNow, 0);
  const allDone = payables.length > 0 && remaining.length === 0;

  // When the active function is resolved, advance to the next still-unpaid one.
  const advance = React.useCallback(
    (afterId: number) => {
      const nextUnpaid = payables.find(
        (b) => b.bookingId !== afterId && outcomeById[b.bookingId] == null,
      );
      setActiveId(nextUnpaid ? nextUnpaid.bookingId : null);
    },
    [payables, outcomeById],
  );

  const onFunctionResolved = React.useCallback(
    (b: PlanPayableBooking, outcome?: PaymentOutcome) => {
      const resolved: Resolved = outcome === "cash_reserved" ? "reserved" : "paid";
      setOutcomeById((prev) => ({ ...prev, [b.bookingId]: resolved }));
      if (resolved === "reserved") {
        toast({
          title: "Function reserved",
          description:
            "Pay in cash with your vendor — this function stays pending until they record it.",
        });
      } else {
        toast({
          title: "Payment received",
          description: `${eventTypeLabel(b.eventType)} is settled.`,
        });
      }
      advance(b.bookingId);
    },
    [advance],
  );

  // --- Guard rails --------------------------------------------------------
  if (!mounted) {
    return (
      <PageContainer>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!enabled) {
    return (
      <PageContainer>
        <PageHeader title="Not available" />
        <Button variant="outline" onClick={() => router.push("/user/plan")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back
        </Button>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!summary) {
    return (
      <PageContainer>
        <PageHeader title="Plan not found" />
        <Button variant="outline" onClick={() => router.push("/user/plan")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to plans
        </Button>
      </PageContainer>
    );
  }

  const planHref = `/user/plan/${planId}`;

  // Nothing owed at all — either never checked out, or everything is already paid.
  if (payables.length === 0) {
    const everythingPaid = summary.aggregate.settledCount > 0;
    return (
      <PageContainer>
        <PageHeader
          eyebrow={
            <Link
              href={planHref}
              className="inline-flex items-center gap-1 text-bridal-gold-dark hover:text-bridal-charcoal"
            >
              <ArrowLeft className="h-3 w-3" />
              {summary.planTitle || "Your Wedding"}
            </Link>
          }
          title={everythingPaid ? "Your wedding is paid" : "Nothing to pay yet"}
        />
        <SectionCard>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bridal-sage/20 text-[#3F6B43]">
              {everythingPaid ? (
                <PartyPopper className="h-5 w-5" />
              ) : (
                <CalendarHeart className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[13px] text-bridal-text-soft leading-relaxed">
                {everythingPaid
                  ? "Every booked function has been paid. Vendors have been notified."
                  : "Book your functions from the plan first, then come back here to pay for your whole wedding in one flow."}
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href={planHref}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Back to plan
                </Link>
              </Button>
            </div>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  const activeBooking = activeId
    ? payables.find((b) => b.bookingId === activeId) ?? null
    : null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Link
            href={planHref}
            className="inline-flex items-center gap-1 text-bridal-gold-dark hover:text-bridal-charcoal"
          >
            <ArrowLeft className="h-3 w-3" />
            {summary.planTitle || "Your Wedding"}
          </Link>
        }
        title="Pay for my wedding"
        description="Settle every function together. Each is paid on the same secure rail as a single booking — pay one, and we move you to the next."
      />

      {allDone ? (
        <SectionCard>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bridal-sage/20 text-[#3F6B43]">
              <PartyPopper className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display italic text-[22px] text-bridal-charcoal leading-tight">
                All done for now
              </h2>
              <p className="text-[13px] text-bridal-text-soft mt-1 leading-relaxed">
                You&apos;ve handled every function that was due. It can take a few
                moments for each confirmation to land — refresh your plan to see
                the updated status.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={planHref}>View my plan</Link>
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — the active pay form */}
          <div className="lg:col-span-2 space-y-4">
            {activeBooking ? (
              <SectionCard
                title={bookingLabel(activeBooking)}
                description={`${fmtPlanDate(activeBooking.bookingDate)} — ${
                  activeBooking.paymentType === "remaining_payment"
                    ? "remaining balance"
                    : "down payment to confirm"
                }`}
              >
                {(() => {
                  const paymentProps = {
                    // key by bookingId (below) so switching function remounts the
                    // form → exactly one PaymentIntent is ever in flight.
                    bookingId: activeBooking.bookingId,
                    amount: activeBooking.dueNow,
                    paymentType: activeBooking.paymentType ?? "down_payment",
                    customerEmail: activeBooking.customerEmail ?? undefined,
                    customerName: activeBooking.customerName ?? undefined,
                    vendorName: activeBooking.vendorName ?? undefined,
                    bookingDate: activeBooking.bookingDate ?? undefined,
                    onSuccess: (outcome?: PaymentOutcome) =>
                      onFunctionResolved(activeBooking, outcome),
                    // Skip to the next function without paying this one.
                    onCancel:
                      remaining.length > 1
                        ? () => advance(activeBooking.bookingId)
                        : () => router.push(planHref),
                  };
                  return CASH_BOOKING_ENABLED || PK_PAYMENTS_ENABLED ? (
                    <PaymentMethodChooser key={activeBooking.bookingId} {...paymentProps} />
                  ) : (
                    <BookingPaymentScreen key={activeBooking.bookingId} {...paymentProps} />
                  );
                })()}
              </SectionCard>
            ) : (
              <SectionCard title="Choose a function to pay">
                <p className="text-sm text-bridal-text-soft">
                  Pick a function from the list to pay it now.
                </p>
              </SectionCard>
            )}
          </div>

          {/* Right — the whole-wedding breakdown */}
          <div className="space-y-4">
            <SectionCard title="Your wedding total">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-bridal-text-soft inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    Due now
                  </span>
                  <span className="font-display italic text-[18px] text-bridal-charcoal tabular-nums">
                    {fmtPKR(dueRemaining)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-bridal-text-soft">Functions paid</span>
                  <span className="font-medium text-bridal-charcoal tabular-nums">
                    {resolvedCount} / {payables.length}
                  </span>
                </div>
                <p className="text-[11px] text-bridal-text-soft leading-relaxed pt-1">
                  Each function is charged on its own — the whole-wedding discount
                  was already applied when you booked. Paying here confirms each
                  vendor.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Functions">
              <ul className="space-y-2">
                {payables.map((b) => {
                  const outcome = outcomeById[b.bookingId];
                  const isActive = b.bookingId === activeId;
                  return (
                    <li
                      key={b.bookingId}
                      className={`rounded-md border px-3 py-2.5 transition-colors ${
                        outcome
                          ? "border-bridal-sage/45 bg-bridal-sage/10"
                          : isActive
                            ? "border-bridal-gold/55 bg-bridal-cream"
                            : "border-bridal-beige bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-bridal-charcoal truncate">
                            {eventTypeLabel(b.eventType)}
                          </p>
                          <p className="text-[11px] text-bridal-text-soft truncate">
                            {b.vendorName || `Booking #${b.bookingId}`} ·{" "}
                            {fmtPlanDate(b.bookingDate)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium text-bridal-charcoal tabular-nums">
                            {fmtPKR(b.dueNow)}
                          </p>
                          {outcome === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#3F6B43]">
                              <CheckCircle2 className="h-3 w-3" />
                              Paid
                            </span>
                          ) : outcome === "reserved" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-bridal-gold-dark">
                              <Banknote className="h-3 w-3" />
                              Reserved
                            </span>
                          ) : isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-bridal-gold-dark">
                              <CreditCard className="h-3 w-3" />
                              Paying now
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveId(b.bookingId)}
                              className="inline-flex items-center gap-0.5 text-[11px] text-bridal-text-soft hover:text-bridal-charcoal"
                            >
                              Pay this
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>

            <p className="text-[10.5px] text-bridal-text-soft italic leading-relaxed px-1">
              Payments are handled by Stripe, the same as a single booking. If a
              card is declined, you can retry that function right here; the others
              are unaffected.
            </p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

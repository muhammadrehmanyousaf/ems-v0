"use client";

/**
 * Shaadi Plan — "Pay for my whole wedding" (unified pay flow).
 *
 * A plan checkout creates one Booking per function, each in "Awaiting Payment".
 * Historically the customer had to open each booking's own pay page and settle
 * its down-payment separately. This screen gives them ONE experience: the whole
 * wedding's total due + a per-function breakdown, then it walks them through
 * paying each function in sequence by REUSING the exact same pay screen a
 * single booking uses.
 *
 * WW-DIRECT-PAY — that screen is no longer Stripe Elements. It was, and the
 * paragraph here used to describe PaymentIntents and a settlement webhook;
 * none of that exists now. Stripe cannot onboard Pakistani businesses, so a
 * card payment could never reach the venue, and the platform has stopped
 * taking money entirely. The customer transfers to each venue directly — bank,
 * JazzCash or Easypaisa — and reports the reference and a screenshot for that
 * venue to confirm.
 *
 * Correctness note — there is still NO combined charge, and it matters more
 * than before: each function is a separate venue with its own account and its
 * own BK- reference. One screen is rendered at a time (the active function) so
 * a customer can never transfer against one venue's account while another
 * venue's reference is on screen.
 *
 * Outcomes are honest per function: a reported transfer is REPORTED, not paid.
 * Nothing here marks a function settled — the venue does that when the money
 * shows up in their account.
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
import {
  WeddingPlansAPI,
  type PlanPaymentSummary,
  type PlanPayableBooking,
} from "@/lib/api/weddingPlans";
import { eventTypeLabel, fmtPlanDate, fmtPKR } from "@/lib/wedding-plan-events";
/**
 * WW-DIRECT-PAY — the same record-mode screen a single booking uses.
 *
 * This reused `PaymentMethodChooser`, which fronted Stripe Elements. Stripe
 * does not onboard Pakistani businesses, so a card payment could never reach
 * the venue; the platform now takes no money at all and the customer pays each
 * venue directly, filing a reference and a screenshot for that venue to
 * confirm. Reusing the per-booking screen keeps that identical whether a
 * customer pays one function or five.
 */
import BankTransferScreen from "@/components/booking/steps/bank-transfer-screen";

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
    if (!user) return;
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
  }, [user, planId]);

  React.useEffect(() => {
    if (user) load();
  }, [user, load]);

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

  /**
   * WW-DIRECT-PAY — marking a function "reported" rather than "paid".
   *
   * This was `onFunctionResolved`, fired by the card screen's `onSuccess` with
   * a Stripe outcome. There is no such callback now, and there could not be an
   * honest one: reporting a transfer moves no money and settles nothing — the
   * venue confirms it later, out of band. Saying "Payment received" here would
   * have been the same untruth the old cash path was careful to avoid.
   *
   * Kept as an explicit action instead, so the list still tracks which
   * functions the customer has dealt with in this sitting.
   */
  const markReported = React.useCallback(
    (b: PlanPayableBooking) => {
      setOutcomeById((prev) => ({ ...prev, [b.bookingId]: "reserved" }));
      toast({
        title: "Transfer reported",
        description: `${eventTypeLabel(b.eventType)} stays pending until the venue confirms it.`,
      });
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
                {/* Keyed by bookingId so switching function remounts the
                    screen — it fetches that booking's own instructions, and a
                    stale account or reference from the previous function must
                    never linger on screen while someone transfers money. */}
                <BankTransferScreen
                  key={activeBooking.bookingId}
                  bookingId={activeBooking.bookingId}
                  amount={activeBooking.dueNow}
                  paymentType={activeBooking.paymentType ?? "down_payment"}
                  customerEmail={activeBooking.customerEmail ?? undefined}
                  bookingDate={activeBooking.bookingDate ?? undefined}
                />

                {/* Moving on is an explicit act now, not a payment callback.
                    Reporting a transfer settles nothing on the spot — the venue
                    confirms it later — so there is no success event to advance
                    the list for us, and inventing one would tell the customer
                    a function was paid when it is only reported. */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => markReported(activeBooking)}>
                    I&apos;ve reported this one — next function
                  </Button>
                  {remaining.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => advance(activeBooking.bookingId)}>
                      Skip for now
                    </Button>
                  )}
                </div>
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
              You pay each venue directly, the same as a single booking. If a
              card is declined, you can retry that function right here; the others
              are unaffected.
            </p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

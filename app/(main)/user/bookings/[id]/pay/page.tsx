"use client";

/**
 * WW-DIRECT-PAY — where a customer pays, after the vendor has accepted.
 *
 * ── What this page was, and why it could not stay ─────────────────────────
 *
 * It rendered `PaymentMethodChooser`, which fronted Stripe. That could never
 * complete for a Pakistani venue — Stripe does not onboard Pakistani
 * businesses, so there was no account for the money to land in — and the
 * platform has since stopped taking payments at all. The customer pays the
 * venue directly and files the reference and a screenshot afterwards.
 *
 * ── Why the page is not simply deleted ────────────────────────────────────
 *
 * This is the ONLY place a customer can pay after leaving the booking flow,
 * and under the request-mode flow that is the normal path: they submit, the
 * vendor accepts hours later, and they come back here. Deleting it would
 * strand every accepted booking with nowhere to pay.
 *
 * ── Why it no longer computes the amount itself ───────────────────────────
 *
 * It derived the amount from `booking.downPayment`, which used to hold the
 * REQUIRED advance. That column now holds money RECEIVED and starts at zero,
 * so the old arithmetic would have quoted Rs 0 — or, through its
 * `down > 0 ? down : total` fallback, the entire booking total to someone who
 * owed a 10% deposit. The server's `payment-instructions` endpoint is the one
 * authority on what is owed and to whom; this page asks it and renders the
 * answer.
 */

import React, { useEffect, useState } from "react";
import { errorMessage } from "@/lib/utils/api-error";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import {
  PaymentInstructionsAPI,
  type PaymentInstructions,
} from "@/lib/api/paymentInstructions";
import BankTransferScreen from "@/components/booking/steps/bank-transfer-screen";

export default function PayBookingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = Number((params?.id as string) || 0);
  const { isAuthenticated, isLoading } = useUser();

  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/user/bookings/${bookingId}/pay`);
      return;
    }
    if (!bookingId) {
      setError("Invalid booking id");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await PaymentInstructionsAPI.get(bookingId);
        if (!cancelled) setInstructions(data);
      } catch (e: any) {
        if (!cancelled) setError(errorMessage(e, "Failed to load this booking"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, bookingId, router]);

  const back = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/user/bookings/${bookingId}`)}
      className="gap-1.5 mb-4"
    >
      <ArrowLeft className="size-3.5" />
      Back to booking
    </Button>
  );

  if (loading || isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-10 w-40 mb-6" />
        <Skeleton className="h-[420px] w-full rounded-md" />
      </div>
    );
  }

  if (error || !instructions) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
        {back}
        <div className="rounded-md border border-bridal-coral/40 bg-bridal-coral/15 p-6 text-center">
          <p className="font-bridal text-[13px] text-bridal-coral">
            {error || "Booking unavailable."}
          </p>
        </div>
      </div>
    );
  }

  /**
   * The vendor has not answered yet, so nothing is owed.
   *
   * The server refuses a claim in this state, and asking for money against a
   * booking the venue may still decline is the failure that flag exists to
   * prevent — it would then have to be refunded by hand.
   */
  if (instructions.awaitingVendorApproval) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
        {back}
        <div className="rounded-md border border-bridal-beige bg-bridal-cream p-6 text-center">
          <Clock className="mx-auto mb-3 h-6 w-6 text-bridal-gold-dark" />
          <p className="font-display italic text-[20px] text-bridal-charcoal mb-1.5">
            The venue is reviewing your request
          </p>
          <p className="font-bridal text-[13px] text-bridal-text-soft">
            We&apos;ll ask you for the advance once they&apos;ve accepted — there&apos;s nothing to
            pay yet, and your date is held in the meantime.
          </p>
          <Button onClick={() => router.push(`/user/bookings/${bookingId}`)} size="sm" className="mt-4">
            View booking
          </Button>
        </div>
      </div>
    );
  }

  // `paymentType: null` is the server saying this booking is settled. Trusted
  // over any local re-derivation from the amount columns, which is how the old
  // page came to re-request a deposit on a refunded booking.
  if (!instructions.paymentType || !(instructions.amountDue > 0)) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
        {back}
        <div className="rounded-md border border-bridal-sage/45 bg-bridal-sage/15 p-6 text-center">
          <p className="font-display italic text-[20px] text-bridal-charcoal mb-2">
            There&apos;s nothing left to pay on this booking.
          </p>
          <Button onClick={() => router.push(`/user/bookings/${bookingId}`)} size="sm" className="mt-3">
            View booking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bridal-ivory pb-24 lg:pb-12">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {back}
        {/* The same screen the booking flow ends on, so a customer who pays
            later sees exactly what they would have seen at the time — the
            venue's own accounts, the reference, and the "I've transferred"
            form. It fetches its own instructions, so the figures here can
            never drift from the ones it submits against. */}
        <BankTransferScreen
          bookingId={bookingId}
          amount={instructions.amountDue}
          paymentType={instructions.paymentType}
        />
      </div>
    </main>
  );
}

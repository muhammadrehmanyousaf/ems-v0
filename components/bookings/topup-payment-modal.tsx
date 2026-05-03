"use client";

/**
 * BK-054 top-up — Stripe Elements modal for paying the positive diff on an
 * approved change request.
 *
 * Flow:
 *   1. Parent calls `BookingAPI.initiateTopUp(bookingId, requestId)` and
 *      passes the resulting `{ clientSecret, amount }` into this modal.
 *   2. Stripe Elements loads with the PaymentIntent client secret.
 *   3. On submit, `stripe.confirmPayment` runs against the Stripe servers.
 *   4. The Stripe webhook on the backend marks the PI succeeded, sets
 *      `topUpPaidAt`, then re-runs `approveRequest` with `skipTopUpCheck:true`
 *      to apply the change. By the time `onSuccess` fires here we just need
 *      to refetch the change-requests list — the row has already flipped to
 *      `approved` server-side.
 *
 * The component fetches the publishable key via `PaymentAPI.getStripeConfig`
 * on mount; falls back to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` if the API
 * returns nothing (mirrors the codebase's existing behaviour).
 */

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe as StripeJS } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CreditCard,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PaymentAPI } from "@/lib/api/payments";
import { BookingAPI } from "@/lib/api/bookings";

interface TopUpPaymentModalProps {
  open: boolean;
  onClose: () => void;
  clientSecret: string;
  amount: number;
  bookingId: number;
  requestId: number;
  onSuccess: () => void;
}

function formatPKR(n: number): string {
  if (!Number.isFinite(n)) return "Rs. —";
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
  }
}

// Poll the change-requests list for this booking until the row flips to
// `approved` (or `topUpPaidAt` is set, which is the earlier signal) — handles
// the webhook race window after `confirmPayment` returns success but before
// the server has run `approveRequest({ skipTopUpCheck: true })`. Backoff:
// 800ms, 1200ms, 1500ms, 2000ms, 2500ms, 3000ms, 3000ms — total ~14s. After
// timeout we still resolve "ok" because the customer's money is captured;
// the change will land on next page-load.
async function pollUntilApplied(
  bookingId: number,
  requestId: number,
  signal: AbortSignal,
): Promise<"applied" | "paid" | "timeout"> {
  const delaysMs = [800, 1200, 1500, 2000, 2500, 3000, 3000];
  for (const delay of delaysMs) {
    if (signal.aborted) return "timeout";
    await new Promise((r) => setTimeout(r, delay));
    if (signal.aborted) return "timeout";
    try {
      const res = await BookingAPI.getChangeRequests(bookingId);
      const row = res?.requests?.find((r) => r.id === requestId);
      if (!row) continue;
      if (row.status === "approved") return "applied";
      if (row.topUpPaidAt) return "paid";
    } catch {
      // network blip — keep polling.
    }
  }
  return "timeout";
}

function TopUpPaymentForm({
  bookingId,
  requestId,
  amount,
  onSuccess,
  onCancel,
}: {
  bookingId: number;
  requestId: number;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  // BK-054-TOPUP follow-up — after Stripe confirms the payment, we poll the
  // change-request row until the webhook has flipped status to `approved`
  // (or set `topUpPaidAt` if it landed before the re-approve). 3DS cards
  // arrive asynchronously and a flat 1.5s timeout was showing stale
  // "still pending" rows on slower bank challenges.
  const [phase, setPhase] = useState<
    "form" | "submitting" | "polling" | "applied"
  >("form");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setPhase("submitting");
    setError(null);
    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url:
            typeof window !== "undefined"
              ? `${window.location.origin}${window.location.pathname}?topup=ok`
              : "/",
        },
        redirect: "if_required",
      });
      if (confirmError) {
        const msg = confirmError.message || "Payment could not be completed";
        setError(msg);
        setPhase("form");
        toast({
          title: "Payment failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }
      // Stripe says paid. Poll until the webhook has run approveRequest +
      // flipped the row to approved. Backoff = ~14s total before falling
      // through with a softer toast.
      setPhase("polling");
      const ctrl = new AbortController();
      const result = await pollUntilApplied(bookingId, requestId, ctrl.signal);
      setPhase("applied");
      if (result === "applied") {
        toast({
          title: "Change applied",
          description: "Your booking is updated.",
        });
      } else if (result === "paid") {
        toast({
          title: "Top-up received",
          description:
            "Payment cleared. The booking change will apply in a moment.",
        });
      } else {
        toast({
          title: "Top-up received",
          description:
            "Payment cleared. The vendor will see the update within a few minutes.",
        });
      }
      onSuccess();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Unexpected error during payment";
      setError(msg);
      setPhase("form");
    } finally {
      setSubmitting(false);
    }
  };

  // Distinct UI state during the post-payment poll — communicates that the
  // customer's money is already captured + we're just waiting for the
  // server-side change to apply. Prevents the "did it work?" reload reflex.
  if (phase === "polling") {
    return (
      <div className="py-6 text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-bridal-gold-dark" />
        <p className="text-sm font-medium">Confirming with vendor…</p>
        <p className="text-xs text-muted-foreground">
          Your payment cleared. We&apos;re applying the change to your booking
          now — this usually takes a few seconds.
        </p>
      </div>
    );
  }

  if (phase === "applied") {
    return (
      <div className="py-6 text-center space-y-3">
        <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-600" />
        <p className="text-sm font-medium">All set</p>
        <p className="text-xs text-muted-foreground">
          Closing in a moment…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error ? (
        <p className="text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        Secured by Stripe — your card details never touch our servers.
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing…
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {formatPKR(amount)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function TopUpPaymentModal({
  open,
  onClose,
  clientSecret,
  amount,
  bookingId,
  requestId,
  onSuccess,
}: TopUpPaymentModalProps) {
  const [stripePromise, setStripePromise] = useState<Promise<StripeJS | null> | null>(
    null,
  );
  const [keyError, setKeyError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        let key: string | undefined;
        try {
          const cfg = await PaymentAPI.getStripeConfig();
          key = cfg?.publishableKey;
        } catch {
          // fall through to env var
        }
        if (!key) {
          key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        }
        if (!key) {
          if (!cancelled) {
            setKeyError(
              "Stripe is not configured. Please contact support to complete the top-up.",
            );
          }
          return;
        }
        if (!cancelled) setStripePromise(loadStripe(key));
      } catch (e: unknown) {
        if (!cancelled) {
          setKeyError(
            e instanceof Error ? e.message : "Failed to load payment form",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const elementsOptions = useMemo(
    () => ({ clientSecret, appearance: { theme: "stripe" as const } }),
    [clientSecret],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay top-up of {formatPKR(amount)}</DialogTitle>
          <DialogDescription>
            Pay the price difference for your approved change. Your booking
            updates automatically once the payment lands.
          </DialogDescription>
        </DialogHeader>
        {keyError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{keyError}</span>
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : !stripePromise ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading payment form…
          </div>
        ) : (
          <Elements stripe={stripePromise} options={elementsOptions}>
            <TopUpPaymentForm
              bookingId={bookingId}
              requestId={requestId}
              amount={amount}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TopUpPaymentModal;

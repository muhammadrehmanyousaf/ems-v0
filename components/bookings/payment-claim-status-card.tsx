"use client";

/**
 * WW-RECORD-MODE — the customer's view of a payment they reported.
 *
 * The customer transfers to the venue's own account and taps "I've sent the
 * payment". Between that moment and the venue confirming, the booking looks
 * exactly as it did before — still awaiting payment — and without this card the
 * customer has no way to tell whether their report registered at all. That gap
 * is precisely when someone gives up on the product and messages the venue on
 * WhatsApp instead.
 *
 * Renders nothing when there is nothing to report, so an ordinary booking is
 * unaffected.
 */

import { useQuery } from "@tanstack/react-query";
import { PaymentInstructionsAPI, type PaymentClaim } from "@/lib/api/paymentInstructions";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank transfer",
  raast: "Raast",
  ibft: "IBFT",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  cash: "Cash",
};

const fmt = (n: number | string) =>
  `Rs ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const when = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-PK", {
      day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
};

export function PaymentClaimStatusCard({ bookingId }: { bookingId: number }) {
  const { data: claims } = useQuery<PaymentClaim[]>({
    queryKey: ["payment-claims", bookingId],
    queryFn: () => PaymentInstructionsAPI.list(bookingId),
    // The vendor confirms out-of-band, so poll gently while anything is open.
    refetchInterval: (q) =>
      (q.state.data || []).some((c: PaymentClaim) => c.status === "pending") ? 60_000 : false,
  });

  if (!claims || claims.length === 0) return null;

  return (
    <SectionCard title="Payments you've reported">
      <div className="space-y-3">
        {claims.map((claim) => (
          <div key={claim.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base font-semibold tabular-nums">{fmt(claim.amount)}</span>
              <span className="text-sm text-muted-foreground">
                {METHOD_LABELS[claim.method] || claim.method}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{when(claim.claimedAt)}</span>
            </div>

            {claim.transactionRef && (
              <p className="mt-1 text-sm text-muted-foreground">
                Ref <span className="font-medium tabular-nums text-foreground">{claim.transactionRef}</span>
              </p>
            )}

            {claim.status === "pending" && (
              <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Waiting for the venue to find it in their account. Your date is held
                  meanwhile — transfers can take a few hours to show.
                </span>
              </p>
            )}

            {claim.status === "confirmed" && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed by the venue
              </p>
            )}

            {/* A rejection has to say what to do next, not just that something
                went wrong — the customer may well have paid. */}
            {claim.status === "rejected" && (
              <div className="mt-2 flex items-start gap-1.5 text-sm">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                <span>
                  <span className="font-medium text-destructive">
                    The venue couldn&apos;t find this payment.
                  </span>{" "}
                  {claim.reviewNotes}
                  <span className="mt-1 block text-muted-foreground">
                    Check the account number and reference on your transfer, then report
                    it again with the receipt.
                  </span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

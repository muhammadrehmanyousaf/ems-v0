"use client";

/**
 * Shaadi Plan — honest per-line checkout outcome (spec §6).
 *
 * The orchestrator books best-effort, one Booking per event, and returns
 * three buckets: `booked` (✓), `skipped` (a gone slot / not chosen — the
 * customer can retry that function), and `failed` (a real error). This
 * screen shows exactly what happened — it NEVER fakes success. Partial
 * failure is expected and safe: some functions book, the rest are handed
 * back to the customer with the reason.
 */

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  PartyPopper,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/user-dashboard";
import {
  type CheckoutOutcome,
  type PlanItem,
} from "@/lib/api/weddingPlans";
import { fmtPKR } from "@/lib/wedding-plan-events";

interface CheckoutOutcomeViewProps {
  outcome: CheckoutOutcome;
  /** Map of itemId → line, so we can name the vendor/function per row. */
  itemsById: Record<number, PlanItem>;
  /** Vendor display name resolver (falls back to "Vendor #id"). */
  labelForItem: (itemId: number) => string;
  /** Back to the builder to retry skipped functions. */
  onRetry?: () => void;
  planId: number;
}

export function CheckoutOutcomeView({
  outcome,
  labelForItem,
  onRetry,
  planId,
}: CheckoutOutcomeViewProps) {
  const bookedCount = outcome.booked.length;
  const skippedCount = outcome.skipped.length;
  const failedCount = outcome.failed.length;
  const allBooked = bookedCount > 0 && skippedCount === 0 && failedCount === 0;
  const nothingBooked = bookedCount === 0;

  return (
    <div className="space-y-4">
      {/* Headline — honest about partial success */}
      <SectionCard>
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              allBooked
                ? "bg-bridal-sage/20 text-[#3F6B43]"
                : nothingBooked
                  ? "bg-bridal-coral/15 text-bridal-coral"
                  : "bg-bridal-gold/15 text-bridal-gold-dark"
            }`}
          >
            {allBooked ? (
              <PartyPopper className="h-5 w-5" />
            ) : nothingBooked ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display italic text-[22px] text-bridal-charcoal leading-tight">
              {allBooked
                ? "Your wedding is booked"
                : nothingBooked
                  ? "Nothing could be booked"
                  : `${bookedCount} function${bookedCount === 1 ? "" : "s"} booked`}
            </h2>
            <p className="text-[13px] text-bridal-text-soft mt-1 leading-relaxed">
              {allBooked
                ? "Every function you chose is confirmed. Vendors have been notified."
                : nothingBooked
                  ? "None of the chosen functions could be booked right now — see the reasons below and try again."
                  : "Some functions booked and some didn't. Here's exactly what happened — you can retry the rest."}
            </p>
            {outcome.discountPercent != null && outcome.discountPercent > 0 && (
              <p className="text-[12px] text-bridal-gold-dark mt-2 font-medium">
                {outcome.discountPercent}% whole-wedding discount applied
                {outcome.totals?.discount != null &&
                  ` — you saved ${fmtPKR(outcome.totals.discount)}`}
                .
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Booked ✓ */}
      {bookedCount > 0 && (
        <SectionCard
          title={`Booked (${bookedCount})`}
          description="Confirmed — each has its own booking, payments and dispute window."
        >
          <ul className="space-y-2">
            {outcome.booked.map((b) => (
              <li
                key={b.itemId}
                className="flex items-center justify-between gap-3 rounded-md border border-bridal-sage/40 bg-bridal-sage/10 px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-sm text-bridal-charcoal min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-[#3F6B43] shrink-0" />
                  <span className="truncate">{labelForItem(b.itemId)}</span>
                </span>
                {b.bookingId ? (
                  <Link
                    href={`/user/bookings/${b.bookingId}`}
                    className="inline-flex items-center gap-1 text-[11px] text-bridal-gold-dark hover:text-bridal-charcoal shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Booking #{b.bookingId}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Skipped ⤳ retry */}
      {skippedCount > 0 && (
        <SectionCard
          title={`Couldn't book — you can retry (${skippedCount})`}
          description="Usually the slot was taken while you were checking out. Nothing was charged for these."
        >
          <ul className="space-y-2">
            {outcome.skipped.map((s) => (
              <li
                key={s.itemId}
                className="flex items-center justify-between gap-3 rounded-md border border-bridal-gold/40 bg-bridal-cream px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-sm text-bridal-charcoal min-w-0">
                  <RefreshCw className="h-4 w-4 text-bridal-gold-dark shrink-0" />
                  <span className="truncate">{labelForItem(s.itemId)}</span>
                </span>
                <span className="text-[11px] text-bridal-text-soft shrink-0">
                  {humanReason(s.reason)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Failed ✗ */}
      {failedCount > 0 && (
        <SectionCard
          title={`Failed (${failedCount})`}
          description="Something went wrong booking these — please try again or contact support."
        >
          <ul className="space-y-2">
            {outcome.failed.map((f) => (
              <li
                key={f.itemId}
                className="rounded-md border border-bridal-coral/40 bg-bridal-coral/5 px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-sm text-bridal-charcoal">
                  <XCircle className="h-4 w-4 text-bridal-coral shrink-0" />
                  <span className="truncate">{labelForItem(f.itemId)}</span>
                </span>
                {f.error && (
                  <p className="text-[11px] text-bridal-coral mt-1 ml-6 italic">
                    {f.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {(skippedCount > 0 || failedCount > 0) && (
          <Button variant="outline" className="gap-1.5" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Back to plan to retry
          </Button>
        )}
        <Button asChild variant={allBooked ? "default" : "ghost"}>
          <Link href={`/user/plan/${planId}`}>
            {allBooked ? "View my plan" : "Done"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Map a machine reason code to a short, honest human string. */
function humanReason(reason: string): string {
  switch (reason) {
    case "slot_unavailable":
    case "slot_gone":
      return "Slot just taken";
    case "no_price":
    case "missing_price":
      return "Needs an agreed price";
    case "not_selected":
      return "Not selected";
    case "no_date":
      return "Function needs a date";
    default:
      return reason || "Skipped";
  }
}

export default CheckoutOutcomeView;

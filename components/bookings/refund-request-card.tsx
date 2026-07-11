"use client";

/**
 * EPIC 5 · §3 (customer surface) — "Request a refund" card.
 *
 * Lets a customer raise a refund request against a booking, wired to the
 * existing refund-request engine (POST /api/v1/bookings/:id/refund-requests).
 * Mirrors the shape of DisputeCard.
 *
 * IMPORTANT — gated OFF by default (lib/customer-refund-request-flag.ts). The
 * backend endpoint is presently VENDOR/admin-scoped: loadOwnedBooking requires
 * the caller to be in booking.vendorIds and the cancellation policy resolves
 * from the vendor's business, so a customer caller receives 403/404. This card
 * therefore degrades gracefully — on a refusal it shows a friendly "not
 * available yet" message and points to the dispute flow — and never renders on
 * prod until both the flag is enabled AND the backend authz is extended to the
 * customer-by-email path.
 */

import { useState } from "react";
import { Loader2, ReceiptText, Info } from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { BookingAPI, type RefundReason } from "@/lib/api/bookings";

interface RefundRequestCardProps {
  bookingId: number | string;
  /** Parent decides "where sensible" — e.g. money paid + not cancelled. */
  canRequest?: boolean;
}

// Only the reasons that make sense for a customer to pick.
const CUSTOMER_REASONS: Array<{ value: RefundReason; label: string }> = [
  { value: "customer_cancel", label: "I need to cancel my booking" },
  { value: "force_majeure", label: "Emergency / circumstances beyond my control" },
];

export function RefundRequestCard({ bookingId, canRequest = true }: RefundRequestCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState<RefundReason>("customer_cancel");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!canRequest) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await BookingAPI.raiseRefundRequest(Number(bookingId), { reason });
      toast({
        title: "Refund request sent",
        description:
          "Your vendor and our team will review it against the cancellation policy and get back to you.",
      });
      setShowForm(false);
      setSubmitted(true);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 404 || status === 403
          ? "Refund requests aren't available for this booking yet. If the event has passed, you can open a dispute instead."
          : (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Couldn't send your refund request — please try again.";
      toast({ title: "Couldn't request a refund", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SectionCard
        title="Refund requested"
        description="We're reviewing your request against the cancellation policy."
      >
        <p className="text-[13px] text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          You&apos;ll be notified once your vendor or our team responds. Any
          approved refund follows the vendor&apos;s cancellation policy.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Need a refund?"
      description="Request a refund against this booking's cancellation policy."
    >
      {showForm ? (
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label className="text-[12px]">Reason</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RefundReason)}
              disabled={submitting}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2 disabled:opacity-60"
            >
              {CUSTOMER_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            The refund amount is calculated from the vendor&apos;s cancellation
            policy and how close the event is — it may be partial.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Send refund request
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
          className="gap-1.5"
        >
          <ReceiptText className="h-3.5 w-3.5" />
          Request a refund
        </Button>
      )}
    </SectionCard>
  );
}

export default RefundRequestCard;

"use client";

/**
 * WW-BOOKING-MODE — the vendor's accept / decline on a booking request.
 *
 * `PATCH /bookings/:id/approve` has existed since BK-081 — vendor-ownership
 * checks, the BK-081 state-machine transition, the lot — and has never been
 * reachable from any interface. A venue that wanted to review a request before
 * confirming had no way to say yes, which is why the flow stayed instant-book.
 *
 * Renders only while the booking is genuinely awaiting a decision. A confirmed
 * or cancelled booking shows nothing, so this does not clutter the sheet for
 * the ordinary case.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookingsAPI } from "@/lib/api/dashboard";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/utils/api-error";

interface Props {
  bookingId: number;
  status?: string | null;
  /**
   * The vendor's own line on this booking. Declining is per-line by design
   * (BK-030): a photographer turning down a multi-vendor cart must not cancel
   * the venue as well. Without it, only accept is offered.
   */
  bookingDetailsId?: number | null;
  customerName?: string | null;
  eventDate?: string | null;
  /**
   * WW-APPROVE-VS-CONFIRM — when this vendor accepted. Non-null hides the card.
   *
   * Required because acceptance no longer moves a request-mode booking to
   * `Confirmed`: it stays `Awaiting Payment` until the advance lands, which is
   * a status still in AWAITING. Without this the card would sit there asking
   * for a decision the vendor already made, and a second click would 400.
   */
  vendorApprovedAt?: string | null;
  /**
   * Called after a decision lands. Surfaces that host a booking through
   * useEffect rather than react-query do not see the query invalidation, so
   * without this the card stays on screen after the vendor accepts and the
   * obvious next click 400s.
   */
  onChanged?: () => void;
}

/** Statuses where a vendor decision is still meaningful. */
const AWAITING = ["Pending", "Awaiting Payment"];

export function VendorApprovalCard({
  bookingId,
  status,
  bookingDetailsId,
  customerName,
  eventDate,
  vendorApprovedAt,
  onChanged,
}: Props) {
  const qc = useQueryClient();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["bookings"] });

  const approveMut = useMutation({
    mutationFn: () => BookingsAPI.approveBooking(bookingId),
    onSuccess: () => {
      toast.success("Accepted. The customer can now pay the advance.");
      invalidate();
      onChanged?.();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't accept this booking")),
  });

  const declineMut = useMutation({
    mutationFn: () =>
      BookingsAPI.declineBookingLine(bookingId, bookingDetailsId as number, reason.trim()),
    onSuccess: () => {
      toast.success("Declined. The customer has been told.");
      setDeclining(false);
      setReason("");
      invalidate();
      onChanged?.();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't decline this booking")),
  });

  // Already accepted — the decision is made, even though a request-mode
  // booking legitimately stays in an AWAITING status until the advance lands.
  if (vendorApprovedAt) return null;
  if (!AWAITING.includes(String(status || ""))) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        <h3 className="text-sm font-semibold">Booking request — your decision</h3>
      </div>

      <p className="mt-1.5 text-sm text-muted-foreground">
        {customerName ? `${customerName} has ` : "A customer has "}
        requested{eventDate ? ` ${eventDate}` : " this date"}. Their date is held and
        nothing has been charged. Accepting asks them for the advance.
      </p>

      {!declining && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={approveMut.isPending}
            onClick={() => approveMut.mutate()}
          >
            {approveMut.isPending
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <Check className="mr-1.5 h-3.5 w-3.5" />}
            Accept this booking
          </Button>

          {/* Decline is per-line, so it needs the vendor's own line id. Without
              one the safe move is to offer nothing rather than a button that
              would 400 — or worse, cancel a line that isn't theirs. */}
          {bookingDetailsId ? (
            <Button size="sm" variant="outline" onClick={() => setDeclining(true)}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Can&apos;t take this date
            </Button>
          ) : null}
        </div>
      )}

      {declining && (
        <div className="mt-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Why? The customer sees this.
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="e.g. that date is already held for another family — the 20th is open"
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={reason.trim().length < 3 || declineMut.isPending}
              onClick={() => declineMut.mutate()}
            >
              {declineMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Send decline
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeclining(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

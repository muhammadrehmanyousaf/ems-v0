"use client";

/**
 * BK-036 — the venue cancels.
 *
 * `PATCH /bookings/:id/vendor-cancel` has existed with its whole apparatus —
 * vendor-ownership check, a forced 100% refund override, payout cancellation,
 * balance claw-back — and no interface ever called it. The frontend even knows
 * about the policy flag (`vendorCancelOverridesToFull` in lib/api/dashboard.ts)
 * while nothing invokes the endpoint it governs.
 *
 * The consequence is not cosmetic. A venue that genuinely has to cancel — the
 * hall double-booked, a flood, a death in the owner's family — had no way to do
 * it. The only route out was asking the CUSTOMER to cancel, which applies the
 * customer's cancellation policy and forfeits the customer's advance. The family
 * pays for the venue's problem, which is exactly backwards, and it is the sort
 * of thing that ends up on Facebook.
 *
 * Deliberately heavy: a reason is required, the consequence is spelled out in
 * money, and the confirm names the amount. Cancelling someone's wedding venue
 * should not be a one-click action.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosConfig";
import { errorMessage } from "@/lib/utils/api-error";

const MIN_REASON = 10;

function pkr(v: number | string | null | undefined): string {
  const n = Number(v);
  return Number.isFinite(n) ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "—";
}

export function VendorCancelCard({
  bookingId,
  status,
  customerName,
  eventDate,
  amountPaid,
  onChanged,
}: {
  bookingId: number;
  status?: string | null;
  customerName?: string | null;
  eventDate?: string | null;
  /** What the customer has actually paid — what must go back to them. */
  amountPaid?: number | string | null;
  /** See VendorApprovalCard — this page reloads through a callback, not a query. */
  onChanged?: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      axiosInstance.patch(`/api/v1/bookings/${bookingId}/vendor-cancel`, { reason: reason.trim() }),
    onSuccess: () => {
      toast.success("Cancelled. The customer has been told and their payment is refunded in full.");
      setOpen(false);
      setReason("");
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["settlement", bookingId] });
      onChanged?.();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't cancel this booking")),
  });

  // Nothing to cancel once it is already over or already cancelled.
  if (["Cancelled", "Completed"].includes(String(status || ""))) return null;

  const paid = Number(amountPaid) || 0;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Can&apos;t honour this booking?</h3>
      </div>

      {!open ? (
        <>
          <p className="mt-1.5 text-sm text-muted-foreground">
            If the venue has to pull out — double-booked, flooded, a death in the family — cancel it
            here. Do <strong>not</strong> ask the customer to cancel: that applies their cancellation
            policy and they lose their advance for something that isn&apos;t their fault.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-destructive hover:text-destructive"
            onClick={() => setOpen(true)}
          >
            Cancel this booking
          </Button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="font-medium">This cannot be undone.</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-muted-foreground">
              <li>
                {customerName || "The customer"} is told immediately
                {eventDate ? `, and ${eventDate} is released` : ""}.
              </li>
              <li>
                {paid > 0
                  ? <>They are refunded <strong>{pkr(paid)}</strong> in full — your cancellation policy does not apply when the venue cancels.</>
                  : <>They are refunded in full. Your cancellation policy does not apply when the venue cancels.</>}
              </li>
              <li>Any payout scheduled to you for this booking is cancelled.</li>
            </ul>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Why? The customer reads this.
            </span>
            <textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The hall was damaged in last week's storm and won't be repaired in time. We're very sorry."
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
            />
          </label>
          {reason.trim().length > 0 && reason.trim().length < MIN_REASON && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Give them a real explanation — this is their wedding.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={reason.trim().length < MIN_REASON || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {paid > 0 ? `Cancel and refund ${pkr(paid)}` : "Cancel this booking"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setReason(""); }}>
              Keep the booking
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorCancelCard;

"use client";

/**
 * BK-100.9 — Postpone-without-cancel dialog.
 *
 * Surfaces a culturally-sensitive way for the customer to suspend the
 * booking without forfeiting the deposit. Pakistani Islamic mourning
 * custom: after death in immediate family, weddings are postponed
 * 3-40 days (40 is the cultural default for close-family deaths).
 *
 * The dialog deliberately does NOT collect a new date here — that's
 * the whole point of "postpone vs reschedule". A family in mourning
 * should not be forced to pick a new wedding date in the same hour.
 * The new date is set later via the existing reschedule endpoint.
 *
 * Backend contract (lib/api/bookings.ts BookingAPI.postpone):
 *   POST /api/v1/bookings/:id/postpone
 *   body: { reason: string, mourningWindowDays?: number (3..90) }
 *
 * Backend rejects:
 *   - reason < 15 chars (REASON_TOO_SHORT)
 *   - window outside [3, 90] (WINDOW_OUT_OF_RANGE)
 *   - status outside {Pending, Awaiting Payment, Confirmed} (POSTPONE_BAD_STATUS)
 *   - event already passed (EVENT_ALREADY_PASSED)
 *   - already postponed (ALREADY_POSTPONED)
 *   - non-customer non-admin caller (403)
 */

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarOff, Heart, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BookingAPI } from "@/lib/api/bookings";
import { cn } from "@/lib/utils";

interface PostponeBookingDialogProps {
  bookingId: number;
  bookingStatus: string;
  /** ISO date string of the booked event. The dialog disables itself
      when the event has already passed; backend re-enforces. */
  eventDate?: string | null;
  /** Already postponed? Disables the trigger. */
  alreadyPostponed?: boolean;
  /** Callback after a successful postpone. Parent should refetch the
      booking so postponedAt / postponedUntilAt appear. */
  onPostponed?: () => void;
  /** Optional CTA label override; default "Postpone instead". */
  triggerLabel?: string;
  /** Render the trigger as a full button vs. a link-style inline anchor. */
  triggerVariant?: "button" | "link";
}

const REASON_MIN = 15;
const REASON_MAX = 1000;

// Pakistani mourning custom presets (per the analysis doc §2.2).
// 40 days is the cultural default for close-family deaths; we surface
// 3 / 14 / 40 / 90 as one-tap chips so the customer doesn't have to
// type a number while grieving.
const WINDOW_PRESETS: Array<{ days: number; label: string; sub: string }> = [
  { days: 3, label: "3 days", sub: "Islamic minimum mourning" },
  { days: 14, label: "2 weeks", sub: "Bride / groom illness" },
  { days: 40, label: "40 days", sub: "Close-family bereavement" },
  { days: 90, label: "3 months", sub: "Extended circumstances" },
];

function humaniseError(code?: string): string {
  switch (code) {
    case "REASON_TOO_SHORT":
      return `Please provide a more detailed reason (at least ${REASON_MIN} characters).`;
    case "WINDOW_OUT_OF_RANGE":
      return "Please choose a postponement window between 3 and 90 days.";
    case "POSTPONE_BAD_STATUS":
      return "This booking can't be postponed in its current status.";
    case "EVENT_ALREADY_PASSED":
      return "You can't postpone an event that already happened. Consider opening a dispute or cancelling.";
    case "ALREADY_POSTPONED":
      return "This booking is already postponed. Set a new date via reschedule to resume.";
    default:
      return code || "Couldn't postpone this booking.";
  }
}

export function PostponeBookingDialog({
  bookingId,
  bookingStatus,
  eventDate,
  alreadyPostponed,
  onPostponed,
  triggerLabel = "Postpone instead",
  triggerVariant = "button",
}: PostponeBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [windowDays, setWindowDays] = useState(40);
  const [submitting, setSubmitting] = useState(false);

  const canPostponeStatus = ["Pending", "Awaiting Payment", "Confirmed"].includes(
    bookingStatus || "",
  );
  const eventInFuture = (() => {
    if (!eventDate) return false;
    const d = new Date(eventDate);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() >= Date.now() - 24 * 60 * 60 * 1000; // 24h grace
  })();
  const triggerDisabled = !canPostponeStatus || !eventInFuture || !!alreadyPostponed;

  const reasonLen = reason.trim().length;
  const canSubmit =
    reasonLen >= REASON_MIN &&
    reasonLen <= REASON_MAX &&
    windowDays >= 3 &&
    windowDays <= 90 &&
    !submitting;

  const handleClose = (next: boolean) => {
    if (submitting && !next) return;
    setOpen(next);
    if (!next) {
      setReason("");
      setWindowDays(40);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await BookingAPI.postpone(bookingId, {
        reason: reason.trim(),
        mourningWindowDays: windowDays,
      });
      toast({
        title: "Booking postponed",
        description:
          "Your deposit stays safe. We'll let your vendor know. You can set a new date any time within your chosen window.",
      });
      handleClose(false);
      onPostponed?.();
    } catch (err) {
      const data = (err as { response?: { data?: { message?: string } } })
        ?.response?.data;
      toast({
        title: "Couldn't postpone",
        description: humaniseError(data?.message),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {triggerVariant === "link" ? (
        <button
          type="button"
          disabled={triggerDisabled}
          onClick={() => setOpen(true)}
          className={cn(
            "text-sm text-bridal-gold-dark hover:text-bridal-charcoal underline-offset-4 hover:underline transition-colors",
            triggerDisabled && "opacity-40 cursor-not-allowed hover:no-underline",
          )}
        >
          {triggerLabel}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={triggerDisabled}
          onClick={() => setOpen(true)}
          className="gap-1.5"
        >
          <CalendarOff className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-bridal-gold-dark" />
              Postpone your booking
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-neutral-600 space-y-2">
                <p className="flex items-start gap-2">
                  <Heart className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                  <span>
                    Postponement <strong>keeps your deposit safe</strong> and pauses your booking — distinct from cancelling.
                  </span>
                </p>
                <p className="text-xs text-neutral-500 flex items-start gap-2">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  You won&apos;t pick a new date here — your vendor will reach out to coordinate during your chosen window. Set the new date later via &quot;Reschedule&quot; when you&apos;re ready.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="postpone-reason" className="text-sm font-medium">
                What happened? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="postpone-reason"
                placeholder="Share enough context for our team to verify — e.g. 'My grandfather passed away last night; we need 40 days for mourning before resuming wedding planning.'"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
                rows={4}
                disabled={submitting}
                className="resize-none text-sm"
              />
              <div className="flex justify-between text-xs">
                <span
                  className={
                    reasonLen < REASON_MIN
                      ? "text-amber-600"
                      : "text-neutral-500"
                  }
                >
                  {reasonLen < REASON_MIN
                    ? `${REASON_MIN - reasonLen} more characters needed`
                    : "Looks good"}
                </span>
                <span className="text-neutral-400 tabular-nums">
                  {reasonLen} / {REASON_MAX}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Postponement window</Label>
              <p className="text-xs text-neutral-500">
                You have this long to coordinate a new date with your vendor.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {WINDOW_PRESETS.map((p) => {
                  const active = p.days === windowDays;
                  return (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setWindowDays(p.days)}
                      disabled={submitting}
                      className={cn(
                        "rounded-md border-2 p-2 text-left transition-colors",
                        active
                          ? "border-bridal-gold/55 bg-bridal-cream"
                          : "border-neutral-200 bg-white hover:border-neutral-300",
                        submitting && "opacity-60 cursor-not-allowed",
                      )}
                      aria-pressed={active}
                    >
                      <p className="text-sm font-medium text-neutral-900">
                        {p.label}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {p.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Postponing…
                </>
              ) : (
                "Postpone booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PostponeBookingDialog;

"use client";

/**
 * BK-038 (customer surface) — "Change date" reschedule dialog.
 *
 * The postpone banner tells a customer to "set a new date via reschedule" but
 * there was no control to do it. This dialog opens a date (+ optional time-slot)
 * picker and calls the existing customer-authz'd reschedule endpoint, mirroring
 * the shape of the sibling PostponeBookingDialog.
 *
 * Backend contract (lib/api/bookings.ts BookingAPI.reschedule):
 *   POST /api/v1/bookings/:id/reschedule
 *   body: { newBookingDate: "YYYY-MM-DD", newBookingTime?: "HH:mm" }
 *
 * Money paths (backend rescheduleService):
 *   new total == old  → just moves the date
 *   new total <  old  → partial refund of the diff
 *   new total >  old  → 422 requires_top_up (we surface it, don't auto-charge)
 *
 * Gated OFF by default via lib/customer-reschedule-flag.ts — call sites check
 * the flag before rendering this. Authz is customer-by-email/admin (no server
 * flag), so once the client flag is on it works end-to-end.
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock, Loader2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BookingAPI } from "@/lib/api/bookings";
import { cn } from "@/lib/utils";

interface RescheduleBookingDialogProps {
  bookingId: number;
  bookingStatus: string;
  /** Current event date (ISO or YYYY-MM-DD) — seeds the picker + min guard. */
  currentDate?: string | null;
  /** Current time slot ("09:00" | "14:00" | "18:00" | other). */
  currentTime?: string | null;
  /** Callback after a successful reschedule; parent should refetch. */
  onRescheduled?: () => void;
  triggerLabel?: string;
  triggerVariant?: "button" | "link";
}

// Same three slots the booking funnel + detail page use.
const TIME_SLOTS: Array<{ value: string; label: string }> = [
  { value: "", label: "Keep current time" },
  { value: "09:00", label: "Morning · 9 AM – 12 PM" },
  { value: "14:00", label: "Afternoon · 2 PM – 6 PM" },
  { value: "18:00", label: "Evening · 6 PM – 11 PM" },
];

const fmtMoney = (n: number) =>
  `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

function humaniseError(code?: string, extra?: { diff?: number }): string {
  switch (code) {
    case "uncancellable_status":
      return "This booking can't be rescheduled in its current status.";
    case "already_refunded":
      return "This booking has already been refunded, so it can't be rescheduled.";
    case "event_already_passed":
      return "You can't reschedule an event that has already passed.";
    case "slot_mode_reschedule_not_supported":
      return "This vendor uses fixed slots that can't be moved here — please message them to coordinate.";
    case "slot_unavailable":
    case "SLOT_CONFLICT":
      return "That date/time isn't available for this vendor. Please pick another.";
    case "pricing_error":
      return "We couldn't reprice this booking for the new date. Please contact support.";
    case "business_not_found":
      return "We couldn't load one of this booking's vendors. Please contact support.";
    case "requires_top_up":
      return extra?.diff
        ? `The new date costs ${fmtMoney(extra.diff)} more. A higher-priced date can't be set here yet — please coordinate with your vendor.`
        : "The new date costs more than the current one. Please coordinate with your vendor for a top-up.";
    default:
      // Any UNRECOGNIZED code (incl. a raw backend/Sequelize error string echoed
      // by a 500) must fall back to the generic copy — never surface internal
      // error text to the customer in a destructive toast.
      return "Couldn't reschedule this booking. Please try again.";
  }
}

function toDateInput(raw?: string | null): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    // Already a YYYY-MM-DD string? Trust the leading 10 chars.
    return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "";
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RescheduleBookingDialog({
  bookingId,
  bookingStatus,
  currentDate,
  currentTime,
  onRescheduled,
  triggerLabel = "Change date",
  triggerVariant = "button",
}: RescheduleBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const todayStr = toDateInput(new Date().toISOString());
  const currentStr = toDateInput(currentDate);

  const canReschedule = !["Cancelled", "Completed", "cancelled", "completed"].includes(
    bookingStatus || "",
  );
  const triggerDisabled = !canReschedule;

  // A change is meaningful only if the date or time actually differs.
  const dateChanged = !!newDate && newDate !== currentStr;
  const timeChanged = !!newTime && newTime !== (currentTime || "");
  const canSubmit = !submitting && !!newDate && newDate >= todayStr && (dateChanged || timeChanged);

  const handleClose = (next: boolean) => {
    if (submitting && !next) return;
    setOpen(next);
    if (next) {
      // Seed with the current date so the user only nudges it.
      setNewDate(currentStr);
      setNewTime("");
    } else {
      setNewDate("");
      setNewTime("");
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await BookingAPI.reschedule(bookingId, {
        newBookingDate: newDate,
        ...(newTime ? { newBookingTime: newTime } : {}),
      });
      const refunded = Number(result?.totalRefunded || 0);
      toast({
        title: "Booking rescheduled",
        description:
          refunded > 0
            ? `Your new date is set. A refund of ${fmtMoney(refunded)} is on its way for the price difference.`
            : "Your new date is set. We've let your vendor know.",
      });
      handleClose(false);
      onRescheduled?.();
    } catch (err) {
      const data = (
        err as {
          response?: { data?: { message?: string; data?: { code?: string; diff?: number } } };
        }
      )?.response?.data;
      // Backend puts the structured code in `message` (rescheduleBooking) OR in
      // `data.code` (space-conflict path); check both.
      const code = data?.data?.code || data?.message;
      toast({
        title: "Couldn't reschedule",
        description: humaniseError(code, { diff: data?.data?.diff }),
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
          onClick={() => handleClose(true)}
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
          onClick={() => handleClose(true)}
          className="gap-1.5"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-bridal-gold-dark" />
              Change your event date
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-neutral-600 space-y-2">
                <p>
                  Pick a new date (and time slot if you like). Your vendor is
                  notified automatically.
                </p>
                <p className="text-xs text-neutral-500 flex items-start gap-2">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  If the new date is cheaper, the difference is refunded. If it
                  costs more, we&apos;ll ask you to coordinate a top-up with your
                  vendor.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date" className="text-sm font-medium">
                New date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reschedule-date"
                type="date"
                min={todayStr}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reschedule-time" className="text-sm font-medium">
                Time slot
              </Label>
              <select
                id="reschedule-time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                disabled={submitting}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2 disabled:opacity-60"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Keep current date</AlertDialogCancel>
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
                  Rescheduling…
                </>
              ) : (
                "Confirm new date"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RescheduleBookingDialog;

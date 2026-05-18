"use client";

/**
 * BK-100.4 / BK-039 — Vendor "Report customer no-show" dialog.
 *
 * Surfaced on the vendor-side booking detail sheet after the event date
 * has passed and the booking is in Confirmed/Completed status. Storage
 * reuses BookingDispute with openedByRole='vendor'; admin resolves via
 * the existing DisputesTable + ResolveDisputeDialog flow.
 *
 * Backend contract (event-planner-api/src/controllers/disputeController.js
 * `openNoShowReport`):
 *   POST /api/v1/bookings/:id/no-show
 *   body: { reason: string, evidence?: object }
 *   responses:
 *     201 { dispute }                        — success
 *     400 reason_too_short                   — reason < 15 chars
 *     400 event_not_yet_passed               — too early
 *     400 noshow_window_expired              — > 7 days post-event
 *     400 booking_not_confirmed_or_completed — wrong status
 *     403 not_authorized                     — caller not a booked vendor
 *     409 dispute_already_exists             — already filed
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BookingAPI } from "@/lib/api/bookings";

interface VendorNoShowDialogProps {
  bookingId: number;
  /** When true, the trigger button is rendered hidden — caller controls open externally. */
  externalControl?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReported?: () => void;
  /** Optional CTA label override; default "Report no-show". */
  triggerLabel?: string;
}

const REASON_MIN = 15;
const REASON_MAX = 1000;

/**
 * Coerce backend error codes into user-friendly messages. The list
 * mirrors the exhaustive switch in `disputeController.openNoShowReport`.
 */
function humaniseError(code: string | undefined): string {
  switch (code) {
    case "reason_too_short":
      return `Please provide a more detailed reason (at least ${REASON_MIN} characters).`;
    case "event_not_yet_passed":
      return "You can only report a no-show after the event date has passed.";
    case "noshow_window_expired":
      return "The no-show reporting window has closed (7 days after the event).";
    case "booking_not_confirmed_or_completed":
      return "This booking is not in a state where a no-show can be reported.";
    case "not_authorized":
      return "Only the booked vendor can report a no-show on this booking.";
    case "dispute_already_exists":
      return "A dispute has already been opened on this booking.";
    case "booking_not_found":
      return "We couldn't find this booking.";
    default:
      return code || "Something went wrong while filing the no-show report.";
  }
}

export function VendorNoShowDialog({
  bookingId,
  externalControl = false,
  open: openProp,
  onOpenChange,
  onReported,
  triggerLabel = "Report no-show",
}: VendorNoShowDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalControl ? !!openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (externalControl) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const [reason, setReason] = useState("");
  const [photoLink, setPhotoLink] = useState("");
  const [contactAttempts, setContactAttempts] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setReason("");
    setPhotoLink("");
    setContactAttempts("");
  };

  const handleClose = (next: boolean) => {
    if (submitting && !next) return; // prevent close mid-submit
    setOpen(next);
    if (!next) resetForm();
  };

  const reasonLen = reason.trim().length;
  const canSubmit = reasonLen >= REASON_MIN && reasonLen <= REASON_MAX && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Evidence is a free-form JSON blob server-side. Capture two
      // common Pakistani-vendor signals: a public photo/Drive link (or
      // WhatsApp dump) and a count of contact attempts. Both optional.
      const evidence: Record<string, unknown> = {};
      if (photoLink.trim()) evidence.linkedEvidenceUrl = photoLink.trim().slice(0, 500);
      if (contactAttempts.trim()) {
        evidence.contactAttempts = contactAttempts.trim().slice(0, 500);
      }
      const body = {
        reason: reason.trim(),
        ...(Object.keys(evidence).length > 0 ? { evidence } : {}),
      };
      await BookingAPI.openNoShowReport(bookingId, body);
      toast({
        title: "No-show reported",
        description:
          "Our team will review the booking and contact you within 48 hours. Payouts on this booking are paused pending review.",
      });
      handleClose(false);
      onReported?.();
    } catch (err) {
      const data = (err as { response?: { data?: { message?: string } } })
        ?.response?.data;
      toast({
        title: "Couldn't file no-show report",
        description: humaniseError(data?.message),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!externalControl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
          onClick={() => setOpen(true)}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Report customer no-show
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-neutral-600 space-y-2">
              <span className="block">
                Use this only when the customer did not show up for the event
                and you can&apos;t reach them. This opens a formal review by
                our team and pauses payouts on this booking.
              </span>
              <span className="block text-xs text-neutral-500">
                Available for 7 days after the event date. Once filed, your
                evidence helps us decide on refund or release.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ns-reason" className="text-sm font-medium">
                What happened? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="ns-reason"
                placeholder="Describe what happened — when you arrived/contacted, what the customer did/didn't do, any communication received. Minimum 15 characters."
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
              <Label htmlFor="ns-photo" className="text-sm font-medium">
                Evidence link{" "}
                <span className="text-neutral-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="ns-photo"
                placeholder="Google Drive / WhatsApp chat export / photo URL"
                value={photoLink}
                onChange={(e) => setPhotoLink(e.target.value)}
                disabled={submitting}
                className="text-sm"
              />
              <p className="text-xs text-neutral-500">
                Photos of an empty venue, screenshots of unanswered messages,
                or arrival timestamp all help your case.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ns-contact"
                className="text-sm font-medium"
              >
                Contact attempts{" "}
                <span className="text-neutral-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="ns-contact"
                placeholder='e.g. "Called 3 times 9am-11am, WhatsApp seen 10:15am no reply"'
                value={contactAttempts}
                onChange={(e) => setContactAttempts(e.target.value)}
                disabled={submitting}
                className="text-sm"
              />
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Filing…
                </>
              ) : (
                "File no-show report"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

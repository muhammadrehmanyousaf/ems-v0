"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { BookingAPI, type BookingDispute } from "@/lib/api/bookings";

const STATUS_LABEL: Record<BookingDispute["status"], string> = {
  open: "Under review",
  resolved_refund: "Refund approved",
  resolved_release: "Resolved · payouts released",
  resolved_dismissed: "Dismissed",
  resolved_forfeit: "Resolved · vendor no-show denied",
};

const STATUS_VARIANT: Record<
  BookingDispute["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "secondary",
  resolved_refund: "default",
  resolved_release: "outline",
  resolved_dismissed: "destructive",
  resolved_forfeit: "destructive",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

interface DisputeCardProps {
  bookingId: number | string;
  /** True when booking.status === 'Completed'. The "Open dispute" CTA only renders here. */
  isCompleted?: boolean;
}

/**
 * BK-067 — render the existing dispute (if any) + allow a customer to open
 * one within the post-event window. Backend gates the window (default 7d
 * via DISPUTE_OPEN_WINDOW_DAYS); we surface its rejection cleanly.
 */
export function DisputeCard({ bookingId, isCompleted }: DisputeCardProps) {
  const [dispute, setDispute] = useState<BookingDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    BookingAPI.getDispute(Number(bookingId))
      .then((res) => setDispute(res?.dispute ?? null))
      .catch(() => setDispute(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const submit = async () => {
    if (reason.trim().length < 5) {
      toast({
        title: "Add a short reason",
        description: "Help support understand what went wrong.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await BookingAPI.openDispute(Number(bookingId), {
        reason: reason.trim(),
      });
      toast({
        title: "Dispute opened",
        description:
          res.frozenPayoutCount > 0
            ? `${res.frozenPayoutCount} pending payout(s) frozen pending review.`
            : "Our team will review and respond.",
      });
      setShowForm(false);
      setReason("");
      load();
    } catch (e: any) {
      const code = e?.response?.data?.data?.code;
      const msg =
        code === "dispute_window_expired"
          ? `The ${
              e?.response?.data?.data?.windowDays ?? 7
            }-day dispute window has passed.`
          : code === "dispute_already_exists"
          ? "A dispute already exists for this booking."
          : code === "booking_not_completed"
          ? "Disputes can only be opened after the event."
          : e?.response?.data?.message ?? "Couldn't open dispute";
      toast({ title: "Couldn't open dispute", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return null; // hide silently while loading
  }

  // No dispute, not completed → don't render anything (cleaner than empty state).
  if (!dispute && !isCompleted) return null;

  if (dispute) {
    const isResolved = dispute.status !== "open";
    return (
      <SectionCard
        title="Dispute"
        description={
          isResolved
            ? `Resolved on ${formatDate(dispute.resolvedAt)}`
            : "Our team is reviewing this booking."
        }
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full p-1.5 bg-amber-100 text-amber-700">
            {dispute.status === "resolved_refund" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANT[dispute.status]}>
                {STATUS_LABEL[dispute.status]}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Opened {formatDate(dispute.createdAt)}
              </span>
            </div>
            <p className="text-sm text-foreground mt-2 whitespace-pre-line">
              {dispute.reason}
            </p>
            {dispute.resolutionNotes ? (
              <div className="mt-3 pt-3 border-t border-border/60">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  Admin notes
                </p>
                <p className="text-[13px] text-foreground whitespace-pre-line">
                  {dispute.resolutionNotes}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>
    );
  }

  // Completed booking with no dispute → show CTA
  return (
    <SectionCard
      title="Something wrong with this booking?"
      description="You can open a dispute within 7 days of the event."
    >
      {showForm ? (
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label className="text-[12px]">What happened?</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue with this booking…"
              rows={4}
              maxLength={1000}
            />
          </div>
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
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              Open dispute
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
          <AlertTriangle className="h-3.5 w-3.5" />
          Open dispute
        </Button>
      )}
    </SectionCard>
  );
}

export default DisputeCard;

"use client";

/**
 * BK-100.7 — Inline review-prompt surface on the customer booking
 * detail page. Closes the only remaining FE gap in the review-collection
 * flow: the C15 prompt email sends the customer to
 * `/user/bookings/{id}?action=review`, but the page had no UI to
 * surface that intent. This card renders one row per booked business
 * that's eligible for review (booking Completed, not yet reviewed by
 * this user).
 *
 * Three reasons to render:
 *   1. booking.status === "Completed" AND user has not reviewed at
 *      least one of the bookings' businesses yet (always shown).
 *   2. ?action=review is in the URL (auto-scrolled into view via
 *      `id="leave-review"` anchor — caller's responsibility).
 *   3. Vendor "no-show" disputes / cancelled bookings → card is NOT
 *      rendered (the parent controls visibility by booking status).
 *
 * Per-business form: star picker (1-5), optional comment (max 1000
 * chars), submit. After submission the row disappears and a thank-you
 * toast fires. Backend already enforces one-review-per-(user, business,
 * booking) so accidental double-clicks get a clean 400.
 */

import * as React from "react";
import { Loader2, Star, CheckCircle2, MessageSquareText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReviewsAPI } from "@/lib/api/dashboard";

interface ReviewableVendor {
  businessId: number;
  businessName: string;
  /** True iff this user has already reviewed this business for this booking. */
  alreadyReviewed?: boolean;
}

interface ReviewPromptCardProps {
  bookingId: number;
  /** Only Completed bookings can be reviewed — backend re-enforces this. */
  bookingStatus: string;
  vendors: ReviewableVendor[];
  /** Auto-focus the first reviewable vendor's comment box when true. */
  autoFocus?: boolean;
}

const COMMENT_MAX = 1000;

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover ?? value) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(n)}
            className={cn(
              "p-0.5 transition-transform",
              !disabled && "hover:scale-110 focus-visible:scale-110",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                active ? "fill-amber-400 text-amber-400" : "text-neutral-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewRow({
  bookingId,
  vendor,
  autoFocus,
  onDone,
}: {
  bookingId: number;
  vendor: ReviewableVendor;
  autoFocus?: boolean;
  onDone: () => void;
}) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  if (vendor.alreadyReviewed) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          You&apos;ve already reviewed <strong>{vendor.businessName}</strong> for this booking. Thank you!
        </span>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Thank you — your review of <strong>{vendor.businessName}</strong> is live. It helps other Pakistani couples shortlist with confidence.
        </span>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Pick a rating from 1 to 5 stars");
      return;
    }
    setSubmitting(true);
    try {
      await ReviewsAPI.submitReview({
        businessId: vendor.businessId,
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      toast.success("Review submitted — thank you!");
      onDone();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Couldn't submit review";
      // Map known backend codes to friendlier copy.
      const human =
        msg === "You can only review completed bookings"
          ? "Reviews unlock once the booking is marked completed."
          : msg === "You already reviewed this booking for this business"
            ? "Looks like you've already reviewed this one — refresh the page."
            : msg;
      toast.error("Couldn't submit", { description: human });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm text-neutral-900">{vendor.businessName}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tap a star — your honest rating helps other couples shortlist faster.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          1 review per booking
        </Badge>
      </div>
      <StarPicker value={rating} onChange={setRating} disabled={submitting} />
      <div className="space-y-1">
        <Textarea
          ref={textareaRef}
          placeholder="(Optional) What stood out? Service, timing, quality, communication…"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
          rows={3}
          disabled={submitting}
          className="text-sm resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-neutral-400">
            {comment.length} / {COMMENT_MAX}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <MessageSquareText className="mr-2 h-3.5 w-3.5" />
                Submit review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ReviewPromptCard({
  bookingId,
  bookingStatus,
  vendors,
  autoFocus,
}: ReviewPromptCardProps) {
  // Hooks declared first (Rules of Hooks). Early-return gates follow.
  const [completedCount, setCompletedCount] = React.useState(0);

  // Backend gates submit to Completed; we hide the card pre-Completion
  // so we don't tease the user with a button that will 403.
  if (bookingStatus !== "Completed") return null;
  if (!Array.isArray(vendors) || vendors.length === 0) return null;

  const pending = vendors.filter((v) => !v.alreadyReviewed);
  // If every vendor in the booking is already reviewed, render a single
  // "thanks" line rather than the full multi-row card.
  if (pending.length === 0) {
    return (
      <Card id="leave-review">
        <CardContent className="flex items-center gap-2 py-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          You&apos;ve reviewed every vendor on this booking — thank you.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="leave-review">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-bridal-gold" />
          <h3 className="font-medium text-neutral-900">Leave a review</h3>
          <Badge variant="secondary" className="text-[10px]">
            {pending.length - completedCount} pending
          </Badge>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Your review is permanent and visible publicly on each vendor&apos;s profile. Be honest — five-star or one-star, the truth is what helps other couples.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {vendors.map((v, i) => (
          <ReviewRow
            key={v.businessId}
            bookingId={bookingId}
            vendor={v}
            autoFocus={autoFocus && i === 0}
            onDone={() => setCompletedCount((c) => c + 1)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default ReviewPromptCard;

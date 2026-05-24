"use client";

/**
 * Two-way rating §26.4 — vendor-side customer trust card.
 *
 * Surface on the customer detail view (offline customers only — these
 * are the customers the vendor owns end-to-end). Shows:
 *   - aggregate stars (mean across all events) + sample size
 *   - top flags (positive vs negative), tallied across history
 *   - would-book-again ratio
 *   - per-event history table with "rated this booking" link + delete
 *   - one-click "Add rating" CTA → RateCustomerDialog
 *
 * Private to the vendor: this is back-channel. It never leaks to the
 * customer or other vendors (MVP).
 *
 * Hydrates lazily on mount + after each save/delete via the existing
 * REST endpoints. No new endpoints needed beyond the three already
 * added on offlineCustomerRouter.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Shield, Star, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CustomerRatingsAPI,
  type CustomerRating,
  type CustomerRatingFlag,
} from "@/lib/api/dashboard";
import RateCustomerDialog from "./rate-customer-dialog";

const FLAG_LABEL: Record<CustomerRatingFlag, string> = {
  advance_disputed: "Disputed advance",
  last_minute_cancel: "Last-minute cancel",
  rude_to_staff: "Rude to staff",
  harassed_staff: "Harassed staff",
  cheque_bounced: "Cheque bounced",
  no_show: "No-show",
  negotiated_at_event: "Negotiated at event",
  scope_creep: "Scope creep",
  ghosted: "Ghosted",
  great_to_work_with: "Great to work with",
  paid_on_time: "Paid on time",
  premium_customer: "Premium",
};

const POSITIVE_FLAGS: CustomerRatingFlag[] = [
  "great_to_work_with", "paid_on_time", "premium_customer",
];

function StarsDisplay({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= rounded
            ? "fill-bridal-gold-dark text-bridal-gold-dark"
            : "text-muted-foreground/30"}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function CustomerTrustCard({
  offlineCustomerId, customerName,
}: {
  offlineCustomerId: number;
  customerName?: string | null;
}) {
  const [ratings, setRatings] = useState<CustomerRating[]>([]);
  const [allowedFlags, setAllowedFlags] = useState<CustomerRatingFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await CustomerRatingsAPI.list(offlineCustomerId);
      // Newest first.
      const sorted = [...(res.ratings || [])].sort(
        (a, b) => +new Date(b.ratedAt) - +new Date(a.ratedAt),
      );
      setRatings(sorted);
      setAllowedFlags(res.allowedFlags || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not load ratings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineCustomerId]);

  const stats = useMemo(() => {
    if (!ratings.length) {
      return {
        count: 0, mean: 0, wouldBookAgainPct: 0,
        topPos: [] as { f: CustomerRatingFlag; n: number }[],
        topNeg: [] as { f: CustomerRatingFlag; n: number }[],
      };
    }
    const count = ratings.length;
    const mean = ratings.reduce((a, r) => a + (r.overallStars || 0), 0) / count;
    const wouldBookAgain = ratings.filter((r) => r.wouldBookAgain).length;
    const wouldBookAgainPct = Math.round((wouldBookAgain / count) * 100);
    const tally: Partial<Record<CustomerRatingFlag, number>> = {};
    for (const r of ratings) {
      for (const f of r.flags || []) {
        tally[f] = (tally[f] || 0) + 1;
      }
    }
    const pos: { f: CustomerRatingFlag; n: number }[] = [];
    const neg: { f: CustomerRatingFlag; n: number }[] = [];
    for (const k of Object.keys(tally) as CustomerRatingFlag[]) {
      const entry = { f: k, n: tally[k] || 0 };
      if (POSITIVE_FLAGS.includes(k)) pos.push(entry);
      else neg.push(entry);
    }
    pos.sort((a, b) => b.n - a.n);
    neg.sort((a, b) => b.n - a.n);
    return {
      count, mean, wouldBookAgainPct,
      topPos: pos.slice(0, 4),
      topNeg: neg.slice(0, 4),
    };
  }, [ratings]);

  const onDelete = async (ratingId: string) => {
    setDeletingId(ratingId);
    try {
      await CustomerRatingsAPI.remove(offlineCustomerId, ratingId);
      setRatings((xs) => xs.filter((r) => r.id !== ratingId));
      toast.success("Rating removed");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not remove rating");
    } finally {
      setDeletingId(null);
    }
  };

  // Tone for the headline avg (mean stars) — red < 2.5, amber < 3.5, gold ≥
  const headlineTone =
    stats.count === 0 ? "text-muted-foreground" :
    stats.mean < 2.5 ? "text-rose-700" :
    stats.mean < 3.5 ? "text-amber-700" :
    "text-bridal-gold-dark";

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-bridal-gold-dark" />
            Trust &amp; risk · private to you
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Back-channel rating of {customerName || "this customer"}. Only you see it.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add rating
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading ratings…
          </div>
        ) : error ? (
          <div className="text-xs text-rose-700">{error}</div>
        ) : stats.count === 0 ? (
          <div className="rounded-md border-dashed border bg-muted/20 p-3 text-xs text-muted-foreground">
            <p>No ratings yet.</p>
            <p className="mt-0.5">
              After a booking with this customer, add a rating — flags
              like &quot;ghosted&quot; or &quot;paid on time&quot; help future-you remember.
            </p>
          </div>
        ) : (
          <>
            {/* Headline */}
            <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted/30 p-2">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold tabular-nums ${headlineTone}`}>
                  {stats.mean.toFixed(1)}
                </span>
                <div className="flex flex-col">
                  <StarsDisplay value={stats.mean} />
                  <span className="text-[10px] text-muted-foreground">
                    {stats.count} rating{stats.count === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="ml-auto text-xs">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  Would book again
                </p>
                <p className={`font-semibold tabular-nums ${
                  stats.wouldBookAgainPct >= 70 ? "text-emerald-700" :
                  stats.wouldBookAgainPct >= 40 ? "text-amber-700" : "text-rose-700"
                }`}>
                  {stats.wouldBookAgainPct}%
                </p>
              </div>
            </div>

            {/* Flag tallies */}
            {(stats.topPos.length > 0 || stats.topNeg.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stats.topPos.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-emerald-700" /> Positive
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {stats.topPos.map(({ f, n }) => (
                        <Badge key={f} variant="outline"
                          className="bg-emerald-50 border-emerald-200 text-emerald-800 text-[10px]">
                          {FLAG_LABEL[f] || f} · {n}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {stats.topNeg.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3 text-rose-700" /> Risk flags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {stats.topNeg.map(({ f, n }) => (
                        <Badge key={f} variant="outline"
                          className="bg-rose-50 border-rose-200 text-rose-800 text-[10px]">
                          {FLAG_LABEL[f] || f} · {n}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">History</p>
              {ratings.map((r) => (
                <div key={r.id}
                  className="rounded-md border p-2 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StarsDisplay value={r.overallStars} size={12} />
                      <span className="text-muted-foreground">{formatDate(r.ratedAt)}</span>
                      {r.bookingId && (
                        <Badge variant="outline" className="text-[10px]">
                          Booking #{r.bookingId}
                        </Badge>
                      )}
                      {!r.wouldBookAgain && (
                        <Badge variant="outline"
                          className="bg-rose-50 border-rose-200 text-rose-800 text-[10px]">
                          Wouldn&apos;t book again
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-6 w-6"
                      disabled={deletingId === r.id}
                      onClick={() => onDelete(r.id)}
                      aria-label="Remove rating"
                    >
                      {deletingId === r.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3 text-muted-foreground" />}
                    </Button>
                  </div>
                  {r.flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.flags.map((f) => {
                        const isPos = POSITIVE_FLAGS.includes(f);
                        return (
                          <Badge key={f} variant="outline"
                            className={`text-[10px] ${
                              isPos
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                            }`}>
                            {FLAG_LABEL[f] || f}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  {r.notes && (
                    <p className="text-muted-foreground leading-snug">{r.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <RateCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        offlineCustomerId={offlineCustomerId}
        allowedFlags={allowedFlags}
        onSaved={load}
      />
    </Card>
  );
}

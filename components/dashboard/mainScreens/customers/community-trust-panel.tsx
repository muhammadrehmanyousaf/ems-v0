"use client";

/**
 * Community trust panel — the network layer on top of the private
 * two-way rating (customer-trust-card.tsx).
 *
 * Shows what OTHER vendors on Wedding Wala have collectively recorded
 * about this same customer (matched by phone / email). It's the
 * "is this customer safe to take?" pre-flight check a vendor wishes
 * they had before every booking.
 *
 * PRIVACY: aggregate-only. The BE enforces k-anonymity (≥2 other
 * vendors) and never returns identities or notes — so this panel can
 * only ever show counts, an average, and flag tallies. It renders
 * nothing until that threshold is met (no "1 vendor said X", which
 * could de-anonymize).
 *
 * Flag NEXT_PUBLIC_COMMUNITY_TRUST (default OFF — cross-vendor data
 * sharing should be reviewed before going live).
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Star, ThumbsUp, ThumbsDown, Users2 } from "lucide-react";
import {
  CommunityTrustAPI,
  type CommunityTrustData,
  type CustomerRatingFlag,
} from "@/lib/api/dashboard";

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
const POSITIVE: CustomerRatingFlag[] = ["great_to_work_with", "paid_on_time", "premium_customer"];

function Stars({ value }: { value: number }) {
  const r = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= r ? "fill-bridal-gold-dark text-bridal-gold-dark" : "text-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

export default function CommunityTrustPanel({
  phone, email,
}: {
  phone?: string | null;
  email?: string | null;
}) {
  const [data, setData] = useState<CommunityTrustData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone && !email) { setLoading(false); return; }
    CommunityTrustAPI.get({ phone, email })
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, [phone, email]);

  if (loading) return <Skeleton className="h-28 w-full" />;
  // Render nothing when there's no data OR k-anonymity not met — never
  // show a partial signal that could identify a single rater.
  if (!data || !data.hasData) return null;

  const pos = (data.flags || []).filter((f) => POSITIVE.includes(f.flag));
  const neg = (data.flags || []).filter((f) => !POSITIVE.includes(f.flag));
  const avg = data.avgStars ?? 0;
  const headlineTone = avg >= 4 ? "text-emerald-700" : avg >= 3 ? "text-amber-700" : "text-rose-700";

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/60 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-blue-700" />
          Community trust · across Wedding Wala
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          What <span className="font-semibold">{data.raterVendorCount} other vendors</span> recorded
          about this customer ({data.totalRatings} rating{data.totalRatings === 1 ? "" : "s"}).
          Anonymized — no names, no notes.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 rounded-md bg-background/70 border p-2.5">
          {data.avgStars != null && (
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold tabular-nums ${headlineTone}`}>{avg.toFixed(1)}</span>
              <Stars value={avg} />
            </div>
          )}
          {data.wouldBookAgainPct != null && (
            <div className="ml-auto text-xs">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Would book again</p>
              <p className={`font-semibold tabular-nums ${
                data.wouldBookAgainPct >= 70 ? "text-emerald-700" :
                data.wouldBookAgainPct >= 40 ? "text-amber-700" : "text-rose-700"
              }`}>
                {data.wouldBookAgainPct}%
              </p>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users2 className="h-3.5 w-3.5" /> {data.raterVendorCount} vendors
          </div>
        </div>

        {(pos.length > 0 || neg.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {neg.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <ThumbsDown className="h-3 w-3 text-rose-700" /> Risk flags
                </p>
                <div className="flex flex-wrap gap-1">
                  {neg.map((f) => (
                    <Badge key={f.flag} variant="outline" className="bg-rose-50 border-rose-200 text-rose-800 text-[10px]">
                      {FLAG_LABEL[f.flag] || f.flag} · {f.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {pos.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3 text-emerald-700" /> Positive
                </p>
                <div className="flex flex-wrap gap-1">
                  {pos.map((f) => (
                    <Badge key={f.flag} variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-800 text-[10px]">
                      {FLAG_LABEL[f.flag] || f.flag} · {f.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

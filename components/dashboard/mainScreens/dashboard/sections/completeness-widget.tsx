"use client";

/**
 * VR-050.10 — Vendor profile completeness widget.
 *
 * Fetches `GET /api/v1/businesses/:id/completeness` and renders:
 *   - Score ring + headline
 *   - Verification tier ladder (0..4) with badges
 *   - Top-3 highest-impact missing items as actionable suggestions
 *   - Collapsible per-category checklist
 *
 * Mounted on the vendor dashboard home — it nudges low-completeness
 * vendors toward filling out their profile, which improves search
 * ranking (`completenessScore DESC` is a sort factor).
 */

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BusinessesAPI,
  type CompletenessResponse,
} from "@/lib/api/dashboard";

const TIER_LABELS = ["Unverified", "Email + Phone", "NTN verified", "CNIC verified", "Visited"] as const;

interface CompletenessWidgetProps {
  businessId: number;
  /** Path the "Edit profile" button links to. */
  editHref?: string;
  className?: string;
}

export default function CompletenessWidget({
  businessId,
  editHref,
  className,
}: CompletenessWidgetProps) {
  const [data, setData] = React.useState<CompletenessResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    BusinessesAPI.getCompleteness(businessId)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load profile completeness");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (loading) return <CompletenessSkeleton className={className} />;

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Couldn&apos;t load your profile completeness. {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { score, categories, suggestions, verification } = data;
  const indicatorColor = scoreColor(score);
  const tierLabel = TIER_LABELS[verification.tier] ?? "Unverified";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-bridal-gold" />
              Profile completeness
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              A complete profile ranks higher in search and builds trust with couples.
            </p>
          </div>
          {editHref && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={editHref}>
                <Pencil className="h-3.5 w-3.5" />
                Edit profile
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Score */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">{score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <span className={cn("text-xs font-medium", scoreTextColor(score))}>
              {scoreLabel(score)}
            </span>
          </div>
          <Progress value={score} indicatorColor={indicatorColor} className="h-2" />
        </div>

        {/* Verification tier */}
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={cn(
                  "h-4 w-4",
                  verification.tier >= 1 ? "text-emerald-600" : "text-muted-foreground",
                )}
              />
              <span className="text-sm font-medium">Verification tier</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                verification.tier >= 3
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                  : verification.tier >= 1
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-amber-500 text-amber-600 bg-amber-50",
              )}
            >
              {tierLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((tier) => (
              <div
                key={tier}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  verification.tier >= tier ? "bg-emerald-500" : "bg-muted",
                )}
                title={TIER_LABELS[tier]}
              />
            ))}
          </div>
          {!verification.canAcceptBookings && (
            <p className="text-[11px] text-amber-600 flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              Complete email and phone verification to start accepting bookings.
            </p>
          )}
          {verification.canAcceptBookings && !verification.canListPublicly && (
            <p className="text-[11px] text-amber-600">
              Reach a profile score of 60+ to appear in public search.
            </p>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top suggestions
            </h4>
            <ul className="space-y-1.5">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-sm"
                >
                  <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full checklist */}
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted/50 transition-colors group">
            <span className="font-medium">Full checklist</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {categories.map((cat) => (
              <div key={cat.key} className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {cat.earned} / {cat.max}
                  </span>
                </div>
                <ul className="space-y-1">
                  {cat.items.map((it) => (
                    <li
                      key={it.key}
                      className="flex items-start gap-2 text-xs"
                    >
                      {it.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                      )}
                      <span className={cn(it.done ? "text-muted-foreground line-through" : "")}>
                        {it.label}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                        +{it.weight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function CompletenessSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs work";
  return "Just started";
}

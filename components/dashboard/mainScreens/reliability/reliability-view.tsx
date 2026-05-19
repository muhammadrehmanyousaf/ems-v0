'use client';

/**
 * Phase 4 #10.3 — Vendor reliability score, surfaced to the vendor.
 *
 * BK-100.6 computes a 0-100 reliability score used in search ranking.
 * Today vendors can't see it — so they can't improve it. This page
 * makes the score and its sub-components visible per business, with
 * concrete "+5 pts" improvement suggestions in priority order.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck,
  TrendingUp,
  Star,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import {
  ReliabilityAPI,
  TIER_LABELS,
  TIER_TONES,
  BADGE_LABELS,
  type BusinessReliability,
} from '@/lib/api/reliability';

export default function ReliabilityView() {
  const [data, setData] = useState<BusinessReliability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ReliabilityAPI.getMyScores()
      .then((r) => setData(r.businesses || []))
      .catch((e) => {
        toast.error(
          e?.response?.data?.message || 'Failed to load reliability',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No businesses yet. Create one and your reliability score will
          surface here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((biz) => (
        <BusinessReliabilityCard key={biz.businessId} biz={biz} />
      ))}
    </div>
  );
}

function BusinessReliabilityCard({ biz }: { biz: BusinessReliability }) {
  const tone = TIER_TONES[biz.tier];
  const SUB_SCORES: Array<{
    label: string;
    value: number;
    max: number;
    icon: React.ReactNode;
  }> = [
    {
      label: 'Rating quality (Bayesian-smoothed)',
      value: biz.breakdown.ratingPts,
      max: 35,
      icon: <Star className="h-3.5 w-3.5 text-amber-500" />,
    },
    {
      label: 'Review volume',
      value: biz.breakdown.volumePts,
      max: 15,
      icon: <Users className="h-3.5 w-3.5 text-blue-500" />,
    },
    {
      label: 'Verification tier',
      value: biz.breakdown.verificationPts,
      max: 20,
      icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />,
    },
    {
      label: 'Completion rate',
      value: biz.breakdown.completionPts,
      max: 15,
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />,
    },
    {
      label: 'Dispute-free',
      value: biz.breakdown.disputePts,
      max: 10,
      icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />,
    },
    {
      label: 'Profile completeness',
      value: biz.breakdown.completenessPts,
      max: 5,
      icon: <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />,
    },
  ];

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">{biz.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge
                variant="outline"
                className={cn('text-xs', tone.bg, tone.text, tone.border)}
              >
                {TIER_LABELS[biz.tier]} tier
              </Badge>
              {biz.badges.map((k) => (
                <Badge
                  key={k}
                  variant="outline"
                  className="text-[10px] bg-neutral-50"
                >
                  <Award className="h-3 w-3 mr-1" />
                  {BADGE_LABELS[k] || k}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-4xl font-bold tracking-tight text-bridal-gold-dark tabular-nums">
              {biz.score}
              <span className="text-base text-neutral-400 font-normal"> / 100</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Effective rating {biz.breakdown.effectiveRating} / 5
            </div>
          </div>
        </div>

        <Separator />

        {/* Sub-scores */}
        <div>
          <div className="text-xs font-semibold text-neutral-700 mb-2">
            How it&apos;s computed
          </div>
          <ul className="space-y-2.5">
            {SUB_SCORES.map((s) => {
              const pct = s.max > 0 ? Math.round((s.value / s.max) * 100) : 0;
              return (
                <li key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-neutral-700">
                      {s.icon}
                      {s.label}
                    </span>
                    <span className="tabular-nums text-neutral-500">
                      {s.value} / {s.max} pts
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </li>
              );
            })}
          </ul>
        </div>

        {/* Improvement suggestions */}
        {biz.suggestions.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                How to improve — highest leverage first
              </div>
              <ul className="space-y-1.5">
                {biz.suggestions.map((s) => (
                  <li
                    key={s.kind}
                    className="rounded-md border border-emerald-100 bg-emerald-50/40 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-neutral-800">
                        {s.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0"
                      >
                        +{s.estimatedGain} pts
                      </Badge>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
                      {s.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Raw inputs (collapsed-feel small text) */}
        <div className="pt-1 text-[10px] text-neutral-400 flex flex-wrap gap-x-3 gap-y-0.5">
          <span>Reviews: {biz.inputs.reviewCount}</span>
          <span>Avg rating: {biz.inputs.avgRating.toFixed(2)}</span>
          <span>Disputes: {biz.inputs.disputeCount}</span>
          <span>Completed: {biz.inputs.completionCount}</span>
          <span>Cancelled: {biz.inputs.cancellationCount}</span>
          <span>Verification tier: {biz.inputs.verificationTier} / 4</span>
          {biz.inputs.medianResponseHours != null && (
            <span>
              Median response:{' '}
              {biz.inputs.medianResponseHours < 1
                ? `${Math.round(biz.inputs.medianResponseHours * 60)} min`
                : `${biz.inputs.medianResponseHours.toFixed(1)} h`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

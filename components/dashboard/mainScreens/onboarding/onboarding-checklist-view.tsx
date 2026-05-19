'use client';

/**
 * Phase 4 polish — Vendor onboarding KYC checklist.
 *
 * Renders one card per owned business with:
 *   - Big 0-100 completeness score + tier label
 *   - Per-category progress (Core / Visual / Commercial / Trust /
 *     Specialty / Verification)
 *   - Done / not-done line items with weight chips
 *   - Top-3 highest-impact suggestions surfaced as quick wins
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Item {
  key: string;
  label: string;
  weight: number;
  done: boolean;
}
interface Category {
  key: string;
  label: string;
  earned: number;
  max: number;
  items: Item[];
}
interface BizCompleteness {
  businessId: number;
  name: string;
  score: number;
  categories: Category[];
  suggestions: string[];
}

function tierFor(score: number): {
  label: string;
  tone: string;
} {
  if (score >= 90)
    return { label: 'Polished', tone: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (score >= 70)
    return { label: 'Well-rounded', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  if (score >= 50)
    return { label: 'Solid start', tone: 'bg-blue-50 text-blue-800 border-blue-200' };
  if (score >= 25)
    return { label: 'Getting there', tone: 'bg-violet-50 text-violet-800 border-violet-200' };
  return { label: 'Just started', tone: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
}

export default function OnboardingChecklistView() {
  const [data, setData] = useState<BizCompleteness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/api/v1/businesses/my-completeness')
      .then((r) => setData(r.data?.data?.businesses ?? []))
      .catch((e) =>
        toast.error(
          e?.response?.data?.message ||
            'Failed to load onboarding checklist',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No businesses yet. Create one and your onboarding checklist
          will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((biz) => (
        <BusinessChecklistCard key={biz.businessId} biz={biz} />
      ))}
    </div>
  );
}

function BusinessChecklistCard({ biz }: { biz: BizCompleteness }) {
  const t = tierFor(biz.score);
  const remaining = 100 - biz.score;

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">{biz.name}</h2>
            <Badge
              variant="outline"
              className={cn('text-xs mt-1', t.tone)}
            >
              {t.label}
            </Badge>
          </div>
          <div className="text-right shrink-0">
            <div className="text-4xl font-bold tracking-tight text-bridal-gold-dark tabular-nums">
              {biz.score}
              <span className="text-base text-neutral-400 font-normal">
                {' '}
                / 100
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {remaining > 0
                ? `${remaining} pts on the table`
                : 'Maxed out'}
            </div>
          </div>
        </div>

        {biz.suggestions.length > 0 && (
          <div className="rounded-lg border border-bridal-gold/30 bg-bridal-gold/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-bridal-gold-dark mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Highest-impact next moves
            </div>
            <ul className="space-y-1">
              {biz.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-neutral-800"
                >
                  <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-bridal-gold-dark shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
            <Link
              href={`/dashboard/business/${biz.businessId}`}
              className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-bridal-gold-dark hover:underline"
            >
              Edit business profile
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        <div className="space-y-3.5">
          {biz.categories.map((cat) => {
            const pct =
              cat.max > 0 ? Math.round((cat.earned / cat.max) * 100) : 0;
            return (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                    {cat.key === 'verification' ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 text-bridal-gold" />
                    )}
                    {cat.label}
                  </div>
                  <span className="tabular-nums text-neutral-500">
                    {cat.earned} / {cat.max} pts
                  </span>
                </div>
                <Progress value={pct} className="h-1" />
                <ul className="space-y-0.5 pl-1">
                  {cat.items.map((it) => (
                    <li
                      key={it.key}
                      className={cn(
                        'flex items-center justify-between gap-2 text-[12px]',
                        it.done ? 'text-neutral-700' : 'text-neutral-500',
                      )}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {it.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
                        )}
                        <span className="truncate">{it.label}</span>
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] shrink-0',
                          it.done
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-200',
                        )}
                      >
                        {it.done ? '✓' : `+${it.weight}`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

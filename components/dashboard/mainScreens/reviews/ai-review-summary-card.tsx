'use client';

/**
 * Phase 5 — AI review-sentiment summary on /dashboard/reviews.
 *
 * Pulls a business picker (vendor may own multiple), runs the
 * summary on demand, renders the markdown reply inside a soft card.
 * Auto-hides when AI is unconfigured.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AiAPI } from '@/lib/api/ai';

interface BizOption {
  id: number;
  name: string;
}

export function AiReviewSummaryCard() {
  const [available, setAvailable] = useState(false);
  const [businesses, setBusinesses] = useState<BizOption[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AiAPI.status()
      .then((s) => setAvailable(!!(s.configured && s.features.reviewSummary)))
      .catch(() => setAvailable(false));
    axiosInstance
      .get('/api/v1/businesses/user-business')
      .then((r) => {
        const arr =
          (Array.isArray(r.data?.data) ? r.data.data : r.data?.data?.data) || [];
        const opts = arr.map((b: any) => ({
          id: b.id,
          name: b.name || `Business #${b.id}`,
        }));
        setBusinesses(opts);
        if (opts.length > 0) setSelected(opts[0].id);
      })
      .catch(() => undefined);
  }, []);

  if (!available || businesses.length === 0) return null;

  const run = async () => {
    if (!selected) return;
    setBusy(true);
    setSummary(null);
    try {
      const r = await AiAPI.reviewSummary(selected);
      if (!r) {
        toast.error('AI not configured');
        return;
      }
      setSummary(r.summary);
      setReviewCount(r.reviewCount);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to summarise');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-bridal-gold" />
          <h2 className="text-sm font-semibold">AI review summary</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Get a quick &ldquo;customers love / wish was better&rdquo; report
          across your recent reviews. Pulls up to 50 most-recent reviews
          per business.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {businesses.length > 1 && (
            <Select
              value={selected ? String(selected) : ''}
              onValueChange={(v) => setSelected(Number(v))}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={run} disabled={busy || !selected} className="gap-1.5">
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {busy ? 'Analysing…' : summary ? 'Re-run' : 'Run summary'}
          </Button>
        </div>
        {summary && (
          <div className="rounded-md border border-bridal-gold/30 bg-bridal-gold/5 p-4 text-sm leading-relaxed whitespace-pre-line">
            {summary}
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              Based on {reviewCount} recent review
              {reviewCount === 1 ? '' : 's'}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

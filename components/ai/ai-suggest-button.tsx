'use client';

/**
 * Phase 5 — Reusable "AI suggest" button.
 *
 * Calls the provided async function and surfaces the result via a
 * caller-provided onSuggestion. Auto-hides when AiAPI.status reports
 * unconfigured so noop deployments don't show a dead button.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AiAPI } from '@/lib/api/ai';

interface Props<T> {
  /** Which feature flag from AiAPI.status to gate on */
  feature: 'leadReply' | 'beoLineItems' | 'receiptOcr' | 'reviewSummary';
  /** Async fn that returns the suggestion result (null when not configured) */
  run: () => Promise<T | null>;
  /** Called with the suggestion result when run resolves with non-null */
  onSuggestion: (result: T) => void;
  /** Button label override */
  label?: string;
  className?: string;
}

export function AiSuggestButton<T>({
  feature,
  run,
  onSuggestion,
  label = 'AI suggest',
  className,
}: Props<T>) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AiAPI.status()
      .then((s) => setAvailable(!!s.configured && !!s.features[feature]))
      .catch(() => setAvailable(false));
  }, [feature]);

  if (!available) return null;

  const onClick = async () => {
    setBusy(true);
    try {
      const r = await run();
      if (r) onSuggestion(r);
      else
        toast.error(
          'AI is not configured on this deployment yet. Ask ops to set ANTHROPIC_API_KEY.',
        );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'AI request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={busy}
      className={`gap-1.5 ${className || ''}`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-bridal-gold" />
      )}
      {busy ? 'Drafting…' : label}
    </Button>
  );
}

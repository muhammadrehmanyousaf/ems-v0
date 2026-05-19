'use client';

/**
 * Phase 4 polish — iCal feed subscription card.
 *
 * Vendor pastes the feed URL into Google Calendar / Apple Calendar /
 * Outlook. Subscriber clients re-fetch periodically so cancellations
 * + new bookings show up automatically.
 *
 * Drop-in for the dashboard settings page — surfaces:
 *   - "Generate calendar feed" button (first time)
 *   - Read-only feed URL + Copy button
 *   - "Rotate" (invalidates the old link) + "Revoke"
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Calendar,
  Copy,
  RotateCw,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface State {
  token: string | null;
  issuedAt: string | null;
  feedUrl: string | null;
}

export function CalendarFeedCard() {
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'rotate' | 'revoke' | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/api/v1/calendar/me/ical-token')
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const rotate = async () => {
    setBusy('rotate');
    try {
      const res = await axiosInstance.post('/api/v1/calendar/me/ical-token');
      setData(res.data?.data ?? null);
      toast.success(
        data?.token
          ? 'Feed rotated — your old subscription link no longer works'
          : 'Calendar feed generated',
      );
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || 'Could not generate feed',
      );
    } finally {
      setBusy(null);
    }
  };

  const revoke = async () => {
    if (
      !window.confirm(
        'Revoke this feed? Any calendar app subscribed to it will stop syncing.',
      )
    )
      return;
    setBusy('revoke');
    try {
      await axiosInstance.delete('/api/v1/calendar/me/ical-token');
      setData({ token: null, issuedAt: null, feedUrl: null });
      toast('Calendar feed revoked');
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || 'Could not revoke feed',
      );
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!data?.feedUrl) return;
    try {
      await navigator.clipboard.writeText(data.feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed — select and copy the URL manually');
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-bridal-gold" />
          <h2 className="text-sm font-semibold">Calendar subscription</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Subscribe to your bookings calendar in Google Calendar, Apple
          Calendar, or Outlook. The feed includes events from the past 90
          days and 365 days forward; cancelled bookings show as struck
          through. Your subscriber app re-fetches automatically.
        </p>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : !data?.feedUrl ? (
          <Button
            type="button"
            size="sm"
            onClick={rotate}
            disabled={busy !== null}
            className="gap-1.5"
          >
            {busy === 'rotate' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            Generate calendar feed
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={data.feedUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="text-xs font-mono"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copy}
                className="gap-1.5 shrink-0"
                aria-label="Copy feed URL"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {data.issuedAt
                ? `Generated ${new Date(data.issuedAt).toLocaleDateString('en-PK')}`
                : ''}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={rotate}
                disabled={busy !== null}
                className="gap-1.5"
              >
                {busy === 'rotate' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                Rotate
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={revoke}
                disabled={busy !== null}
                className="gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                {busy === 'revoke' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Revoke
              </Button>
            </div>
            <details className="pt-1">
              <summary className="text-[11px] text-bridal-gold-dark cursor-pointer hover:underline">
                How to subscribe
              </summary>
              <ul className="text-[11px] text-muted-foreground mt-1.5 space-y-1 list-disc pl-5">
                <li>
                  <b>Google Calendar:</b> Other calendars → + → From URL →
                  paste this URL.
                </li>
                <li>
                  <b>Apple Calendar (macOS):</b> File → New Calendar
                  Subscription → paste.
                </li>
                <li>
                  <b>Outlook:</b> Add calendar → Subscribe from web →
                  paste.
                </li>
              </ul>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}

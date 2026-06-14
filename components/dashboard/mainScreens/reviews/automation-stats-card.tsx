'use client';

/**
 * Phase 4 #10.2 — Reviews automation status surfacing.
 *
 * Sits at the top of the Reviews page. Shows the vendor:
 *   - how many post-event customers received a review prompt
 *   - how many actually responded
 *   - the response rate
 *   - the most recent "silent" customers so the vendor can WhatsApp
 *     them a personal nudge (one-click tel:/wa.me: links)
 *
 * Pure read — backend exposes GET /api/v1/reviews/automation-stats.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Inbox,
  CheckCircle2,
  Clock,
  TrendingUp,
  Phone,
  MessageCircle,
  RotateCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SilentRecent {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  bookingDate: string | null;
}

interface AutomationStats {
  prompted: number;
  responded: number;
  silent: number;
  responseRate: number;
  windowDays: number;
  silentRecent: SilentRecent[];
  avgRating: number | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function digitsOnly(phone: string | null): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Issue #19 — vendors were tapping "Send WhatsApp" on landlines and
 * disconnected numbers, then complaining that WhatsApp Web said "this
 * phone number is not on WhatsApp" after the redirect. We can't know
 * server-side which Pakistani numbers ARE registered with WhatsApp
 * (no public API), but we CAN refuse to open the link unless the
 * number is a valid Pakistani mobile (must be E.164-compatible after
 * normalisation: 923xxxxxxxxx — country code 92, mobile prefix 3,
 * then 9 digits).
 *
 * Returns '#' for invalid input so the calling button can short-circuit
 * (or pair with `isValidWaTarget` for the disabled state).
 */
function waLink(phone: string | null, name: string | null): string {
  const d = digitsOnly(phone);
  if (!d) return '#';
  const normalized = d.startsWith('0') ? '92' + d.slice(1) : d;
  // Strict mobile-only check: total 12 digits, starts with 923.
  if (!/^923\d{9}$/.test(normalized)) return '#';
  const text = encodeURIComponent(
    `Assalam-o-Alaikum ${name || ''} — hope your event went well. Could you take a moment to leave us a review? Shukria!`,
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

/** True iff `waLink` would produce a real wa.me URL (not '#'). */
function isValidWaTarget(phone: string | null): boolean {
  const d = digitsOnly(phone);
  const normalized = d.startsWith('0') ? '92' + d.slice(1) : d;
  return /^923\d{9}$/.test(normalized);
}

// Issue #19 follow-up — a number can pass the 923xxxxxxxxx mobile-format
// check but still not be registered on WhatsApp; the FE can't know
// without an API call. Store a per-vendor "I checked, this number is
// not on WhatsApp" list in localStorage so the pill hides for that
// phone going forward. Scoped by the digits-only normalised form so
// formatting variations (spaces, dashes, leading 0) collapse.
const NOT_ON_WA_KEY = 'ww:notOnWa:v1';

function getNotOnWa(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(NOT_ON_WA_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function normaliseWa(phone: string | null): string {
  const d = digitsOnly(phone);
  return d.startsWith('0') ? '92' + d.slice(1) : d;
}

function markNotOnWa(phone: string | null): void {
  if (typeof window === 'undefined') return;
  const key = normaliseWa(phone);
  if (!key) return;
  const set = getNotOnWa();
  set.add(key);
  try {
    window.localStorage.setItem(NOT_ON_WA_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* quota / disabled — silently ignore */
  }
}

export function ReviewAutomationStatsCard() {
  const [data, setData] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  // Issue #20 — busy state per booking id so multiple dismiss
  // clicks don't trample each other while a request is in flight.
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  // Issue #19 follow-up — hydrate the per-vendor "not on WhatsApp"
  // list once on mount so the WA pill / "Not on WA" action stay in
  // sync as the vendor marks numbers.
  const [notOnWa, setNotOnWa] = useState<Set<string>>(() => getNotOnWa());

  const markNumberNotOnWa = (phone: string | null) => {
    markNotOnWa(phone);
    setNotOnWa(getNotOnWa());
  };

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/api/v1/reviews/automation-stats')
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  // Issue #20 — dismiss a silent customer from the automation pool.
  // Optimistic local update keeps the list responsive; on failure
  // we toast + re-fetch to put the row back.
  const dismissBooking = async (bookingId: number) => {
    setDismissingId(bookingId);
    setData((d) =>
      d
        ? {
            ...d,
            silent: Math.max(0, d.silent - 1),
            prompted: Math.max(0, d.prompted - 1),
            silentRecent: d.silentRecent.filter((s) => s.id !== bookingId),
          }
        : d,
    );
    try {
      await axiosInstance.post(
        `/api/v1/reviews/automation/${bookingId}/dismiss`,
        { action: 'dismiss' },
      );
      toast.success('Removed from silent list');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Could not dismiss');
      load();
    } finally {
      setDismissingId(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <Skeleton className="h-44 w-full" />;
  }

  if (!data || data.prompted === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No post-event review prompts have been sent yet. Once a booking is
          marked Completed and 3+ days have passed, the auto-prompt cron will
          email the customer.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-neutral-700">
              Review automation — last {data.windowDays} days
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={load}
            className="h-7 gap-1"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Stat
            icon={<Inbox className="h-4 w-4 text-blue-600" />}
            label="Prompted"
            value={data.prompted}
          />
          <Stat
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            label="Responded"
            value={data.responded}
          />
          <Stat
            icon={<Clock className="h-4 w-4 text-amber-600" />}
            label="Silent"
            value={data.silent}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
            label="Response rate"
            value={`${data.responseRate}%`}
            sub={
              data.avgRating != null ? `Avg ${data.avgRating} / 5` : null
            }
          />
        </div>

        {data.silentRecent.length > 0 && (
          <div>
            <div className="text-xs font-medium text-neutral-600 mb-1.5">
              Silent customers — nudge them on WhatsApp
            </div>
            <ul className="divide-y divide-neutral-100 max-h-56 overflow-auto">
              {data.silentRecent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 py-1.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-800 truncate">
                      {s.customerName || `Customer #${s.id}`}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Booking #{s.id} · {fmtDate(s.bookingDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.customerPhone && (
                      <a
                        href={`tel:${s.customerPhone}`}
                        className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-[10px] hover:bg-neutral-50"
                        title="Call"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    )}
                    {/* Issue #19 — only render the WhatsApp pill when the
                        number is a valid Pakistani mobile (12 digits,
                        starts 923) AND the vendor hasn't already
                        confirmed it's not on WhatsApp (localStorage
                        flag below). The first check filters out the
                        landlines and typos before the click; the
                        second one filters out the well-formatted-but-
                        not-actually-on-WA numbers the vendor
                        discovered the hard way and marked. */}
                    {s.customerPhone &&
                      isValidWaTarget(s.customerPhone) &&
                      !notOnWa.has(normaliseWa(s.customerPhone)) && (
                      <>
                        <a
                          href={waLink(s.customerPhone, s.customerName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 px-2 py-1 text-[10px] hover:bg-emerald-100"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                        {/* Issue #19 follow-up — vendor-controlled
                            "this number is not on WhatsApp" toggle.
                            Persists per-vendor in localStorage so
                            the pill stays hidden across refreshes
                            and across other silent customers who
                            happen to share that phone. */}
                        <button
                          type="button"
                          onClick={() => markNumberNotOnWa(s.customerPhone)}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-1.5 py-1 text-[10px] text-neutral-500 hover:bg-neutral-100"
                          title="Mark this number as not on WhatsApp"
                          aria-label="Not on WhatsApp"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    {/* Issue #20 — vendor-controlled dismiss. Removes
                        this booking from the silent pool when the
                        vendor has confirmed there'll be no review
                        (reviewed elsewhere, refused, etc.). */}
                    <button
                      type="button"
                      onClick={() => dismissBooking(s.id)}
                      disabled={dismissingId === s.id}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-[10px] text-neutral-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 disabled:opacity-40"
                      title="Dismiss from silent list"
                    >
                      <X className="h-3 w-3" />
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string | null;
}) {
  return (
    <div className="rounded-lg border bg-neutral-50/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-neutral-500">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold text-neutral-900 mt-1">{value}</div>
      {sub && <div className="text-[11px] text-neutral-500">{sub}</div>}
    </div>
  );
}

'use client';

/**
 * Reverse-linkage badge: rendered on PDC / Receipt / Expense / Staff
 * shift / Supplier-invoice / Broker-commission rows that have a
 * bookingId. Resolves the Function Sheet for that booking and links
 * to its detail page so the vendor can jump from any financial row
 * to the event command center.
 *
 * Performance notes:
 *   - Function Sheets are looked up via FunctionSheetAPI.list({bookingId}).
 *     Each lookup costs ~1 network call.
 *   - To avoid N+1 fetches on a page rendering 100 rows, we keep an
 *     in-memory cache keyed by bookingId. The cache is process-lifetime
 *     (resets on page reload) which is fine — the badge data is purely
 *     decorative + rate-limited by browser network throttling.
 *   - The cache also coalesces concurrent fetches for the same bookingId
 *     (same Promise reused) so 100 rows with the same booking still
 *     issue a single backend query.
 *
 * Renders nothing while loading or when no sheet found — keeping the
 * card density unchanged. Vendor only sees the badge when there's
 * actually something to click.
 */

import * as React from 'react';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { FunctionSheetAPI, type FunctionSheet } from '@/lib/api/functionSheets';

interface CachedSheet {
  sheets: FunctionSheet[];
  fetchedAt: number;
}

const cache = new Map<number, CachedSheet>();
const inflight = new Map<number, Promise<FunctionSheet[]>>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes — long enough to amortise N+1, short enough to reflect edits

function lookup(bookingId: number): Promise<FunctionSheet[]> {
  const cached = cache.get(bookingId);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return Promise.resolve(cached.sheets);
  }
  const existing = inflight.get(bookingId);
  if (existing) return existing;
  const p = FunctionSheetAPI.list({ bookingId })
    .then((res) => {
      const sheets = res.functionSheets || [];
      cache.set(bookingId, { sheets, fetchedAt: Date.now() });
      inflight.delete(bookingId);
      return sheets;
    })
    .catch(() => {
      inflight.delete(bookingId);
      return [];
    });
  inflight.set(bookingId, p);
  return p;
}

/**
 * Imperative cache invalidation — call after vendor saves a change
 * that might create / update / delete sheets for this booking.
 */
export function invalidateLinkedSheetCache(bookingId?: number) {
  if (bookingId == null) {
    cache.clear();
    return;
  }
  cache.delete(bookingId);
}

interface Props {
  bookingId: number | null | undefined;
  /** Visual variant: 'inline' keeps it small; 'pill' is the standard chip. */
  variant?: 'inline' | 'pill';
  /** Show even when no sheet found (renders a muted "no sheet" pill). */
  showWhenEmpty?: boolean;
}

export function LinkedFunctionSheetBadge({
  bookingId,
  variant = 'pill',
  showWhenEmpty = false,
}: Props) {
  const [sheets, setSheets] = React.useState<FunctionSheet[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!bookingId) {
      setSheets([]);
      return;
    }
    setSheets(null); // loading
    lookup(bookingId).then((res) => {
      if (!cancelled) setSheets(res);
    });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!bookingId) return null;
  if (sheets === null) {
    // Loading — render an invisible spacer that keeps layout stable.
    return null;
  }
  if (sheets.length === 0) {
    if (!showWhenEmpty) return null;
    return (
      <span
        className={
          variant === 'inline'
            ? 'text-[10px] text-muted-foreground'
            : 'inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] text-muted-foreground'
        }
      >
        <FileText className="h-3 w-3" />
        No sheet
      </span>
    );
  }

  // Most bookings have exactly one Function Sheet; if multiple, link
  // the most-recently-created one but tooltip with the count.
  const primary = sheets[0];
  const more = sheets.length - 1;
  const title = primary.title || `Function sheet #${primary.id}`;
  const truncatedTitle =
    title.length > 30 ? `${title.slice(0, 28)}…` : title;

  const className =
    variant === 'inline'
      ? 'inline-flex items-center gap-1 text-[10px] text-blue-700 hover:underline'
      : 'inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-800 hover:bg-blue-100';

  return (
    <Link
      href={`/dashboard/function-sheets/${primary.id}`}
      className={className}
      title={
        more > 0
          ? `${title} (+${more} more for this booking)`
          : title
      }
      onClick={(e) => e.stopPropagation()}
    >
      <FileText className="h-3 w-3" />
      <span className="truncate">{truncatedTitle}</span>
      {more > 0 && (
        <span className="rounded bg-blue-200 px-1 text-[9px] text-blue-900">
          +{more}
        </span>
      )}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

'use client';

/**
 * Reverse-linkage badge: rendered on PDC / Receipt / Expense / Staff
 * shift / Supplier-invoice / Broker-commission rows that have a
 * bookingId. Resolves the Function Sheet for that booking and links
 * to its detail page so the vendor can jump from any financial row
 * to the event command center.
 *
 * Performance notes:
 *   - WWL-149/171 — this used to call FunctionSheetAPI.list({bookingId})
 *     once per row. Driven live, rendering 13 receipts fired 14 requests
 *     across 7 distinct bookings, and 5 cheque rows fired 10, purely to
 *     label a column. The per-id cache below only helped on the SECOND
 *     render; the first paint of any page still paid one round-trip per
 *     distinct booking, growing linearly with the ledger.
 *
 *     Requests are now micro-batched: every badge that mounts in the same
 *     tick drops its bookingId into a pending set, and a single
 *     `bookingIds=1,2,3` request resolves the whole page. 14 requests
 *     become 1. Batches are capped at 200 ids to match the server cap.
 *
 *   - The process-lifetime cache (keyed by bookingId, 5-minute TTL) still
 *     serves repeat renders and cross-page revisits without any network.
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

const MAX_BATCH = 200; // matches the server-side cap on `bookingIds`

/** Ids waiting for the next flush, with the resolver each badge is holding. */
const queue = new Map<number, ((sheets: FunctionSheet[]) => void)[]>();
let flushScheduled = false;

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  // A microtask, not a timer: every badge in one React commit enqueues
  // synchronously, so the batch is complete by the time this runs and the
  // vendor never waits an extra frame for it.
  Promise.resolve().then(flush);
}

function flush(): void {
  flushScheduled = false;
  if (queue.size === 0) return;

  const ids = Array.from(queue.keys()).slice(0, MAX_BATCH);
  const waiters = new Map<number, ((sheets: FunctionSheet[]) => void)[]>();
  for (const id of ids) {
    waiters.set(id, queue.get(id)!);
    queue.delete(id);
  }
  // Anything over the cap stays queued and goes out in the next batch.
  if (queue.size > 0) scheduleFlush();

  const settle = (byBooking: Map<number, FunctionSheet[]>) => {
    for (const [id, resolvers] of waiters) {
      const sheets = byBooking.get(id) ?? [];
      cache.set(id, { sheets, fetchedAt: Date.now() });
      inflight.delete(id);
      for (const r of resolvers) r(sheets);
    }
  };

  FunctionSheetAPI.list({ bookingIds: ids.join(',') })
    .then((res) => {
      const byBooking = new Map<number, FunctionSheet[]>();
      for (const sheet of res.functionSheets || []) {
        const bid = Number(sheet.bookingId);
        if (!Number.isFinite(bid)) continue;
        const list = byBooking.get(bid);
        if (list) list.push(sheet);
        else byBooking.set(bid, [sheet]);
      }
      settle(byBooking);
    })
    .catch(() => {
      // A failed lookup must not cache "no sheet" as truth — the chip is
      // decorative, so drop the ids and let a later render try again.
      for (const [id, resolvers] of waiters) {
        inflight.delete(id);
        for (const r of resolvers) r([]);
      }
    });
}

function lookup(bookingId: number): Promise<FunctionSheet[]> {
  const cached = cache.get(bookingId);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return Promise.resolve(cached.sheets);
  }
  const existing = inflight.get(bookingId);
  if (existing) return existing;

  const p = new Promise<FunctionSheet[]>((resolve) => {
    const resolvers = queue.get(bookingId);
    if (resolvers) resolvers.push(resolve);
    else queue.set(bookingId, [resolve]);
  });
  inflight.set(bookingId, p);
  scheduleFlush();
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

'use client';

/**
 * Booking → Payments received and Disputes.
 *
 * The Booking page already links out to function sheets, the source lead,
 * installments, change requests and status history. Two things were missing,
 * and they are the two a vendor is most often standing in front of a customer
 * asking about:
 *
 *   "Kitna paisa aaya?"  — what has actually been received against this event
 *   "Koi masla to nahi?" — is there a dispute on it
 *
 * Both existed in the system and neither appeared on the booking. Receipts were
 * only reachable by opening Money and searching by name; disputes had no
 * vendor-visible list at all until `GET /bookings/my-disputes`.
 *
 * Same rules as the Customer 360 lists:
 *   - Every row drills to the real record, never a dead end.
 *   - A section with nothing in it does not render. A permanent "Disputes (0)"
 *     teaches people to skip that part of the page, so the one time it matters
 *     they will not see it.
 *   - Failures are swallowed. A side panel must never be able to stop a booking
 *     from rendering.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReceiptsAPI, type PaymentReceipt, RECEIPT_METHOD_LABELS } from '@/lib/api/paymentReceipts';
import { listMyDisputes, type AdminDisputeRow } from '@/lib/api/disputes';

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Payments actually received against this booking, newest first. */
export function BookingReceiptsCard({ bookingId }: { bookingId: number }) {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(bookingId)) return;
    ReceiptsAPI.list({ bookingId })
      .then((r) => {
        if (!cancelled) setReceipts(r.receipts ?? []);
      })
      .catch(() => {
        if (!cancelled) setReceipts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading || receipts.length === 0) return null;

  const total = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-neutral-700">
              Payments received
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {fmtPKR(total)}
          </Badge>
        </div>
        <ul className="space-y-1.5">
          {receipts.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 px-2.5 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-800">
                  {fmtPKR(r.amount)}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {RECEIPT_METHOD_LABELS[r.method] ?? r.method}
                  {r.receivedDate ? ` · ${fmtDate(r.receivedDate)}` : ''}
                  {r.transactionRef ? ` · ${r.transactionRef}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link
          href={`/dashboard/money?tab=receipts`}
          className="inline-block text-[12px] text-bridal-gold hover:underline"
        >
          All receipts →
        </Link>
      </CardContent>
    </Card>
  );
}

/** Disputes raised on this booking. Renders only when there are any. */
export function BookingDisputesCard({ bookingId }: { bookingId: number }) {
  const [disputes, setDisputes] = useState<AdminDisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(bookingId)) return;
    listMyDisputes({ bookingId })
      .then((r) => {
        if (!cancelled) setDisputes(r.rows ?? []);
      })
      .catch(() => {
        // Older backend without /my-disputes → the card simply never appears.
        if (!cancelled) setDisputes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading || disputes.length === 0) return null;

  const open = disputes.filter((d) => d.status === 'open').length;

  return (
    <Card className={cn(open > 0 && 'border-red-200')}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn('h-4 w-4', open > 0 ? 'text-red-600' : 'text-bridal-gold')}
            />
            <span className="text-sm font-semibold text-neutral-700">Disputes</span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              open > 0 && 'bg-red-50 text-red-700 border-red-200',
            )}
          >
            {open > 0 ? `${open} open` : `${disputes.length} settled`}
          </Badge>
        </div>
        <ul className="space-y-1.5">
          {disputes.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 px-2.5 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-800 truncate">
                  {d.reason || `Dispute #${d.id}`}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Opened {fmtDate(d.openedAt)}
                  {d.openedByRole ? ` by ${d.openedByRole}` : ''}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] py-0 capitalize shrink-0',
                  d.status === 'open'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-300',
                )}
              >
                {String(d.status).replace(/_/g, ' ')}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Issue #22 — CSV export companion to ImportBookingsDialog.
 *
 * Vendors who imported their Excel/register backlog asked for the
 * reverse: download everything they've accumulated as a CSV so they
 * can keep their own copy, hand it to an accountant, or migrate
 * elsewhere. This is the simplest possible take — paginate through
 * the same GET /api/v1/bookings the table uses, flatten to a CSV
 * row, hand the browser a Blob URL.
 *
 * Filters honoured: bucket (active / completed) so the vendor can
 * export just their active backlog or just their archive without
 * mixing them.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosConfig';

interface ExportRow {
  id: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  totalAmount?: number | string | null;
  downPayment?: number | string | null;
  guestCount?: number | null;
  eventCity?: string | null;
  bookingSource?: string | null;
  additionalRequests?: string | null;
  createdAt?: string | null;
}

const HEADERS: { key: keyof ExportRow; label: string }[] = [
  { key: 'id', label: 'Booking ID' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'customerPhone', label: 'Phone' },
  { key: 'customerEmail', label: 'Email' },
  { key: 'bookingDate', label: 'Event Date' },
  { key: 'bookingTime', label: 'Event Time' },
  { key: 'status', label: 'Status' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'totalAmount', label: 'Total Amount (Rs)' },
  { key: 'downPayment', label: 'Down Payment (Rs)' },
  { key: 'guestCount', label: 'Guest Count' },
  { key: 'eventCity', label: 'Event City' },
  { key: 'bookingSource', label: 'Source' },
  { key: 'additionalRequests', label: 'Notes' },
  { key: 'createdAt', label: 'Created At' },
];

function csvEscape(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  // Quote when comma, quote, newline, or carriage return present.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows: ExportRow[]): string {
  const headerLine = HEADERS.map((h) => csvEscape(h.label)).join(',');
  const dataLines = rows.map((r) =>
    HEADERS.map((h) => csvEscape(r[h.key])).join(','),
  );
  return [headerLine, ...dataLines].join('\r\n');
}

function downloadCsv(filename: string, body: string) {
  // BOM keeps Excel happy with non-ASCII characters (e.g. customer
  // names in Urdu / Roman Urdu with diacritics).
  const blob = new Blob(['﻿', body], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportBookingsButton({
  bucket = 'active',
  endpoint = '/api/v1/bookings',
}: {
  bucket?: 'active' | 'completed';
  endpoint?: string;
}) {
  const [busy, setBusy] = useState(false);

  const exportNow = async () => {
    setBusy(true);
    try {
      // Page through. Soft cap 5,000 rows to keep memory + download
      // size sensible; vendors with more than this should narrow the
      // bucket or use the upcoming server-side export.
      const PAGE_SIZE = 200;
      const HARD_CAP = 5000;
      const all: ExportRow[] = [];
      let page = 1;
      let total = Infinity;
      while (all.length < total && all.length < HARD_CAP) {
        const res = await axiosInstance.get(endpoint, {
          params: {
            page,
            limit: PAGE_SIZE,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
            bucket,
          },
        });
        const body = res.data?.data ?? {};
        const batch: ExportRow[] = Array.isArray(body.data) ? body.data : [];
        total = Number(body.filters?.total) || batch.length;
        all.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        page += 1;
      }
      if (all.length === 0) {
        toast.info('No bookings to export.');
        return;
      }
      const csv = rowsToCsv(all);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`bookings-${bucket}-${stamp}.csv`, csv);
      toast.success(`Exported ${all.length} bookings`);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={exportNow}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
}

export default ExportBookingsButton;

'use client';

/**
 * Phase 4 #10.1 — Branded couple portal (public).
 *
 * No auth. Token IS the credential. The bride+groom open this URL
 * from a WhatsApp message, see everything related to their wedding:
 *   - All their events with date + time + venue
 *   - All vendors with WhatsApp links
 *   - Payment summary across the whole wedding
 *   - Signed contracts (function sheets)
 *   - Day-of timeline when within 7 days
 *
 * Read-only — no edits from this page. Changes flow through the
 * existing vendor → customer share-link flows on each booking/sheet.
 */

import * as React from 'react';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  CalendarDays,
  MapPin,
  Phone,
  MessageCircle,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/backend-url';

interface Vendor {
  id: number;
  name: string | null;
  city: string | null;
  vendorType: string | null;
}
interface Booking {
  id: number;
  customerName: string | null;
  bookingDate: string | null;
  bookingTime: string | null;
  status: string;
  paymentStatus: string | null;
  totalAmount: number;
  downPayment: number;
  guestCount: number | null;
  serviceLocationAddress: string | null;
  vendors: Vendor[];
}
interface Sheet {
  id: number;
  bookingId: number | null;
  title: string;
  state: string;
  eventDate: string | null;
  grandTotal: number;
  paidAt: string | null;
  signedAt: string | null;
  hasShareLink: boolean;
  beoAvailable?: boolean;
}
interface Installment {
  id: number;
  bookingId: number;
  sequence: number;
  label: string;
  amount: number;
  amountPaid: number;
  dueAt: string;
  status: string;
  paidAt: string | null;
}
interface TimelineTask {
  id: number;
  bookingId: number;
  category: string;
  label: string;
  scheduledTime: string | null;
  status: string;
}
interface PortalPayload {
  umbrella: {
    id: number;
    title: string | null;
    weddingDate: string | null;
    brideName: string | null;
    groomName: string | null;
    primaryCity: string | null;
    status: string;
    notes: string | null;
    forceMajeure: boolean;
  };
  bookings: Booking[];
  functionSheets: Sheet[];
  payments: {
    totalScheduled: number;
    totalPaid: number;
    totalOutstanding: number;
    installments: Installment[];
  };
  timeline: Record<string, TimelineTask[]>;
  generatedAt: string;
}

function fmtPKR(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
function fmtTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function Page({ params }: PageProps) {
  const { token } = use(params);
  const [data, setData] = useState<PortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(
        `${BACKEND_URL}api/v1/public/wedding-umbrellas/portal/${encodeURIComponent(token)}`,
      )
      .then((r) => {
        if (!cancelled) setData(r.data?.data ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              'This wedding portal link is invalid or has expired.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bridal-cream">
        <p className="text-sm text-neutral-500">Loading your wedding portal…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bridal-cream p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h1 className="text-xl font-semibold">Portal unavailable</h1>
          <p className="text-sm text-neutral-600">{error || 'Unknown error'}</p>
          <p className="text-xs text-neutral-500">
            If you think this is a mistake, ask your wedding planner to send
            you a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const { umbrella, bookings, functionSheets, payments, timeline } = data;
  const coupleNames =
    umbrella.brideName && umbrella.groomName
      ? `${umbrella.brideName} & ${umbrella.groomName}`
      : umbrella.title || 'Your wedding';

  return (
    <div className="min-h-screen bg-bridal-cream">
      {/* Hero */}
      <header className="bg-gradient-to-br from-bridal-gold/15 via-bridal-cream to-bridal-cream border-b border-bridal-beige">
        <div className="max-w-4xl mx-auto px-6 py-10 text-center space-y-2">
          <Heart className="h-6 w-6 text-bridal-gold mx-auto" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-bridal-gold-dark">
            {coupleNames}
          </h1>
          {umbrella.weddingDate && (
            <p className="text-sm text-neutral-700">
              {fmtDate(umbrella.weddingDate)}
              {umbrella.primaryCity ? ` · ${umbrella.primaryCity}` : ''}
            </p>
          )}
          {umbrella.forceMajeure && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-full inline-block px-3 py-1 mt-2">
              Postponed / force-majeure status
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Payment summary */}
        <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-bridal-gold" />
            <h2 className="text-sm font-semibold text-neutral-700">
              Payment overview
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                Total
              </div>
              <div className="text-lg font-bold text-neutral-900 tabular-nums">
                {fmtPKR(payments.totalScheduled)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                Paid
              </div>
              <div className="text-lg font-bold text-emerald-700 tabular-nums">
                {fmtPKR(payments.totalPaid)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                Outstanding
              </div>
              <div className="text-lg font-bold text-amber-700 tabular-nums">
                {fmtPKR(payments.totalOutstanding)}
              </div>
            </div>
          </div>
        </section>

        {/* Events / bookings */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-bridal-gold" />
            <h2 className="text-sm font-semibold text-neutral-700">
              Your events ({bookings.length})
            </h2>
          </div>
          <div className="space-y-3">
            {bookings.map((b) => {
              const sheetsForBooking = functionSheets.filter(
                (s) => s.bookingId === b.id,
              );
              const tasksForBooking = timeline[String(b.id)] || [];
              return (
                <div
                  key={b.id}
                  className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold text-neutral-900">
                        {fmtDate(b.bookingDate)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {fmtTime(b.bookingTime)}
                        {b.guestCount ? ` · ${b.guestCount} guests` : ''}
                      </div>
                    </div>
                    <span
                      className={
                        'text-[10px] px-2 py-0.5 rounded-full border ' +
                        (b.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : b.status === 'Confirmed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : b.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200')
                      }
                    >
                      {b.status}
                    </span>
                  </div>

                  {b.serviceLocationAddress && (
                    <div className="text-xs text-neutral-600 flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-bridal-gold/70 shrink-0" />
                      <span>{b.serviceLocationAddress}</span>
                    </div>
                  )}

                  {b.vendors.length > 0 && (
                    <div className="border-t border-neutral-100 pt-3">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 mb-1.5">
                        Vendors
                      </div>
                      <ul className="space-y-1">
                        {b.vendors.map((v) => (
                          <li
                            key={v.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <span className="font-medium">{v.name}</span>
                              {v.vendorType && (
                                <span className="text-xs text-neutral-500 ml-1.5">
                                  · {v.vendorType}
                                </span>
                              )}
                            </div>
                            {v.city && (
                              <span className="text-xs text-neutral-500">
                                {v.city}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {sheetsForBooking.length > 0 && (
                    <div className="border-t border-neutral-100 pt-3">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 mb-1.5">
                        Contracts & invoices
                      </div>
                      <ul className="space-y-1">
                        {sheetsForBooking.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between text-sm gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-3.5 w-3.5 text-bridal-gold/70 shrink-0" />
                              <span className="truncate">{s.title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {s.beoAvailable && (
                                <a
                                  href={`${BACKEND_URL}api/v1/public/wedding-umbrellas/portal/${encodeURIComponent(
                                    token,
                                  )}/sheets/${s.id}/beo.pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] px-1.5 py-0.5 rounded border bg-bridal-gold/10 text-bridal-gold-dark border-bridal-gold/30 hover:bg-bridal-gold/20"
                                  title="Banquet Event Order preview"
                                >
                                  View BEO
                                </a>
                              )}
                              <span className="text-xs font-medium tabular-nums">
                                {fmtPKR(s.grandTotal)}
                              </span>
                              <span
                                className={
                                  'text-[10px] px-1.5 py-0 rounded border ' +
                                  (s.state === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : s.state === 'signed' || s.state === 'beo_ready' || s.state === 'invoiced'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-neutral-100 text-neutral-700 border-neutral-200')
                                }
                              >
                                {s.state.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tasksForBooking.length > 0 && (
                    <div className="border-t border-neutral-100 pt-3">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 mb-1.5">
                        Day-of timeline (event within 7 days)
                      </div>
                      <ol className="space-y-1">
                        {tasksForBooking.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            {t.status === 'done' ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="h-3 w-3 text-neutral-400 shrink-0" />
                            )}
                            {t.scheduledTime && (
                              <span className="tabular-nums text-neutral-500 w-12 shrink-0">
                                {String(t.scheduledTime).slice(0, 5)}
                              </span>
                            )}
                            <span className="text-neutral-800">{t.label}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {umbrella.notes && (
          <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-neutral-700">Notes</h2>
            <p className="text-sm text-neutral-600 whitespace-pre-line">
              {umbrella.notes}
            </p>
          </section>
        )}

        <footer className="text-center text-[10px] text-neutral-500 py-6">
          Powered by{' '}
          <Link href="/" className="underline hover:text-bridal-gold-dark">
            Wedding Wala
          </Link>{' '}
          · Generated {new Date(data.generatedAt).toLocaleString('en-PK')}
        </footer>
      </main>
    </div>
  );
}

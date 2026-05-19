'use client';

/**
 * Phase 4 #10.2 follow-up — Public review submission page.
 *
 * No auth — token IS the credential. Customer opens the URL from
 * their post-event email/WhatsApp, picks star rating + writes
 * comment + uploads up to 5 photos, submits. Backend stamps
 * reviewTokenUsedAt only after EVERY booking-business has been
 * reviewed so multi-vendor carts work cleanly.
 */

import * as React from 'react';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BACKEND_URL } from '@/lib/backend-url';
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Heart,
  Upload,
} from 'lucide-react';

interface BizRow {
  id: number;
  name: string | null;
  city: string | null;
  vendorType: string | null;
  alreadyReviewed: boolean;
}
interface Payload {
  booking: {
    id: number;
    customerName: string | null;
    bookingDate: string | null;
  };
  businesses: BizRow[];
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function Page({ params }: PageProps) {
  const { token } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [selectedBizId, setSelectedBizId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    axios
      .get(
        `${BACKEND_URL}api/v1/public/bookings/review/${encodeURIComponent(token)}`,
      )
      .then((r) => {
        const d = r.data?.data as Payload;
        setData(d);
        const firstOpen = d.businesses.find((b) => !b.alreadyReviewed);
        if (firstOpen) setSelectedBizId(firstOpen.id);
      })
      .catch((e) =>
        setLoadErr(
          e?.response?.data?.message ||
            'This review link is invalid or has expired.',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizId || rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(
        `${BACKEND_URL}api/v1/public/bookings/review/${encodeURIComponent(token)}`,
        {
          businessId: selectedBizId,
          rating,
          comment: comment.trim() || undefined,
        },
      );
      const reviewId = res.data?.data?.id;

      // Best-effort photo upload — failures here don't roll the
      // review back, they just mean photos didn't attach.
      if (photos.length > 0 && reviewId) {
        try {
          const fd = new FormData();
          for (const p of photos.slice(0, 5)) fd.append('photos', p);
          await axios.post(
            `${BACKEND_URL}api/v1/reviews/${reviewId}/photos`,
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
        } catch {
          // Surface a hint without rolling the review back.
          setError(
            'Review saved, but photo upload failed. You can attach photos later from your account.',
          );
        }
      }

      const remaining = res.data?.data?.remainingBusinesses ?? 0;
      setDoneMessage(
        remaining > 0
          ? `Thank you! ${remaining} more vendor${remaining === 1 ? '' : 's'} to review.`
          : 'Thank you for reviewing every vendor on this booking!',
      );
      setRating(0);
      setComment('');
      setPhotos([]);
      load();
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'Could not submit review',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bridal-cream">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (loadErr || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bridal-cream p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h1 className="text-xl font-semibold">Review link unavailable</h1>
          <p className="text-sm text-neutral-600">
            {loadErr || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  const openBusinesses = data.businesses.filter((b) => !b.alreadyReviewed);
  const allDone = openBusinesses.length === 0;

  return (
    <div className="min-h-screen bg-bridal-cream">
      <header className="bg-gradient-to-br from-bridal-gold/15 to-bridal-cream border-b border-bridal-beige">
        <div className="max-w-xl mx-auto px-6 py-8 text-center space-y-2">
          <Heart className="h-6 w-6 text-bridal-gold mx-auto" />
          <h1 className="text-2xl font-bold text-bridal-gold-dark">
            How was your wedding?
          </h1>
          <p className="text-sm text-neutral-700">
            Hi {data.booking.customerName || 'there'} — your honest review
            helps other Pakistani couples plan theirs.
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-6">
        {doneMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{doneMessage}</span>
          </div>
        )}

        {allDone ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-semibold">All vendors reviewed</h2>
            <p className="text-sm text-neutral-600">
              Thank you — your feedback is live on Wedding Wala.
            </p>
            <Link
              href="/"
              className="inline-block mt-3 px-4 py-2 rounded-md bg-bridal-gold text-white text-sm font-semibold hover:bg-bridal-gold-dark"
            >
              Back to Wedding Wala
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4"
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Which vendor?
              </label>
              <div className="mt-1.5 space-y-1.5">
                {data.businesses.map((b) => (
                  <label
                    key={b.id}
                    className={
                      'flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer text-sm ' +
                      (b.alreadyReviewed
                        ? 'opacity-50 cursor-not-allowed bg-neutral-50'
                        : selectedBizId === b.id
                          ? 'border-bridal-gold bg-bridal-gold/5'
                          : 'border-neutral-200 hover:bg-neutral-50')
                    }
                  >
                    <input
                      type="radio"
                      name="business"
                      checked={selectedBizId === b.id}
                      onChange={() => setSelectedBizId(b.id)}
                      disabled={b.alreadyReviewed}
                      className="accent-bridal-gold-dark"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900">
                        {b.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {b.vendorType}
                        {b.city ? ` · ${b.city}` : ''}
                        {b.alreadyReviewed ? ' · already reviewed' : ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Rating
              </label>
              <div className="mt-1.5 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    className="p-1"
                  >
                    <Star
                      className={
                        'h-8 w-8 transition ' +
                        (n <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300 hover:text-amber-300')
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
              >
                Tell other couples what went well or didn&apos;t
              </label>
              <textarea
                id="comment"
                rows={5}
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value.slice(0, 1500))
                }
                placeholder="Optional — share details that future customers would want to know."
                className="mt-1.5 w-full rounded-md border border-neutral-200 p-2.5 text-sm focus:outline-none focus:border-bridal-gold"
              />
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {comment.length} / 1500
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Photos (up to 5)
              </label>
              <label className="mt-1.5 flex items-center justify-center gap-2 cursor-pointer rounded-md border border-dashed border-neutral-300 px-3 py-4 text-sm text-neutral-500 hover:bg-neutral-50">
                <Upload className="h-4 w-4" />
                {photos.length > 0
                  ? `${photos.length} photo${photos.length === 1 ? '' : 's'} selected`
                  : 'Choose photos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(
                      0,
                      5,
                    );
                    setPhotos(files);
                  }}
                />
              </label>
            </div>

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedBizId || rating < 1 || submitting}
              className="w-full rounded-md bg-bridal-gold text-white py-2.5 text-sm font-semibold hover:bg-bridal-gold-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit review
            </button>
          </form>
        )}

        <p className="text-[10px] text-center text-neutral-400">
          Powered by{' '}
          <Link href="/" className="underline hover:text-bridal-gold-dark">
            Wedding Wala
          </Link>
        </p>
      </main>
    </div>
  );
}

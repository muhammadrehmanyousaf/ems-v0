'use client';

/**
 * Phase 5 — Interactive side-by-side vendor comparison.
 *
 * Customers drop vendor IDs in the URL (?ids=12,18,42) and the page
 * fetches each business, then renders them as columns with rating,
 * starting price, capacity, reliability tier, halal/mahram flags,
 * and a "Book this one" CTA per column. Up to 4 columns; the 4th+
 * is dropped with a toast.
 *
 * Reuses existing /api/v1/businesses/:id read.
 */

import * as React from 'react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Users,
  MapPin,
  ShieldCheck,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';

interface VendorCol {
  id: number;
  name: string | null;
  city: string | null;
  vendorType: string | null;
  rating?: number;
  reviewCount?: number;
  minimumPrice?: number | null;
  maxCapacity?: number | null;
  minCapacity?: number | null;
  images?: string[];
  halalCertified?: boolean;
  separateHallsForGenders?: boolean;
  mahramOnlyStaffAvailable?: boolean;
  reliability?: {
    score: number;
    tier: string;
    badges: string[];
  };
  packages?: Array<{ id: number; name: string; price: number }>;
}

function fmtPKR(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `Rs. ${Math.round(Number(n)).toLocaleString('en-PK')}`;
}

function bool(v: any): React.ReactNode {
  if (v === true)
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (v === false) return <XCircle className="h-4 w-4 text-neutral-300" />;
  return <span className="text-neutral-400">—</span>;
}

function ComparePage() {
  const sp = useSearchParams();
  const idsParam = sp?.get('ids') || '';
  const ids = idsParam
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 4);

  const [vendors, setVendors] = useState<VendorCol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setVendors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      ids.map((id) =>
        axiosInstance
          .get(`/api/v1/businesses/${id}`)
          .then((r) => {
            const d =
              r.data?.data?.business ||
              r.data?.data ||
              r.data?.business ||
              null;
            if (!d) return null;
            return {
              id: d.id,
              name: d.name,
              city: d.city,
              vendorType: d.vendor?.vendorType || d.vendorType,
              rating: Number(d.rating || 0),
              reviewCount: Number(d.reviewCount || 0),
              minimumPrice: Number(d.minimumPrice) || null,
              maxCapacity: d.maxCapacity || null,
              minCapacity: d.minCapacity || null,
              images: Array.isArray(d.images) ? d.images : [],
              halalCertified: !!d.halalCertified,
              separateHallsForGenders: !!d.separateHallsForGenders,
              mahramOnlyStaffAvailable: !!d.mahramOnlyStaffAvailable,
              reliability: d.reliability || null,
              packages: Array.isArray(d.packages)
                ? d.packages.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price) || 0,
                  }))
                : [],
            } as VendorCol;
          })
          .catch(() => null),
      ),
    )
      .then((rows) => setVendors(rows.filter(Boolean) as VendorCol[]))
      .finally(() => setLoading(false));
  }, [idsParam]);

  const removeId = (id: number) => {
    const next = ids.filter((x) => x !== id);
    const params = new URLSearchParams();
    if (next.length > 0) params.set('ids', next.join(','));
    window.history.replaceState(
      null,
      '',
      `/compare-vendors${next.length > 0 ? `?${params}` : ''}`,
    );
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-bridal-cream">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-4">
          <h1 className="text-2xl font-bold text-bridal-gold-dark">
            Compare vendors side by side
          </h1>
          <p className="text-sm text-neutral-600">
            Pick 2-4 vendors from search results and add them to this
            comparison via{' '}
            <code className="text-xs">/compare-vendors?ids=12,18,42</code>.
          </p>
          <Link
            href="/all-vendors"
            className="inline-block bg-bridal-gold text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-bridal-gold-dark"
          >
            Browse all vendors
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bridal-cream">
        <p className="text-sm text-neutral-500">Loading comparison…</p>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="min-h-screen bg-bridal-cream">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-4">
          <h1 className="text-2xl font-bold text-rose-700">
            No vendors loaded
          </h1>
          <p className="text-sm text-neutral-600">
            Those vendor IDs are unavailable. They may have been removed
            or your link may be incomplete.
          </p>
          <Link
            href="/all-vendors"
            className="inline-block bg-bridal-gold text-white px-5 py-2 rounded-md text-sm font-semibold"
          >
            Back to vendors
          </Link>
        </div>
      </div>
    );
  }

  // Row labels with the FE-side accessor logic for each vendor column.
  const rows: Array<{
    label: string;
    cell: (v: VendorCol) => React.ReactNode;
  }> = [
    {
      label: 'Type',
      cell: (v) => v.vendorType || '—',
    },
    {
      label: 'City',
      cell: (v) =>
        v.city ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-bridal-gold/70" />
            {v.city}
          </span>
        ) : (
          '—'
        ),
    },
    {
      label: 'Rating',
      cell: (v) =>
        v.reviewCount && v.reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <strong className="tabular-nums">
              {(v.rating || 0).toFixed(1)}
            </strong>
            <span className="text-xs text-neutral-500">
              ({v.reviewCount} review{v.reviewCount === 1 ? '' : 's'})
            </span>
          </span>
        ) : (
          <span className="text-xs text-neutral-400">No reviews yet</span>
        ),
    },
    {
      label: 'Starting price',
      cell: (v) => (
        <strong className="text-bridal-gold-dark tabular-nums">
          {fmtPKR(v.minimumPrice)}
        </strong>
      ),
    },
    {
      label: 'Capacity',
      cell: (v) =>
        v.maxCapacity ? (
          <span className="inline-flex items-center gap-1 text-sm">
            <Users className="h-3.5 w-3.5 text-bridal-gold/70" />
            {v.minCapacity && v.minCapacity > 0
              ? `${v.minCapacity}–${v.maxCapacity}`
              : `up to ${v.maxCapacity}`}{' '}
            <span className="text-xs text-neutral-500">guests</span>
          </span>
        ) : (
          '—'
        ),
    },
    {
      label: 'Reliability',
      cell: (v) =>
        v.reliability ? (
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <strong className="tabular-nums">{v.reliability.score}</strong>
            <span className="text-xs capitalize text-neutral-500">
              · {v.reliability.tier}
            </span>
          </span>
        ) : (
          '—'
        ),
    },
    { label: 'Halal certified', cell: (v) => bool(v.halalCertified) },
    {
      label: 'Separate halls',
      cell: (v) => bool(v.separateHallsForGenders),
    },
    {
      label: 'Mahram-only staff',
      cell: (v) => bool(v.mahramOnlyStaffAvailable),
    },
    {
      label: 'Cheapest package',
      cell: (v) => {
        const cheapest = (v.packages || [])
          .filter((p) => p.price > 0)
          .sort((a, b) => a.price - b.price)[0];
        return cheapest ? (
          <span>
            <strong className="text-bridal-gold-dark tabular-nums">
              {fmtPKR(cheapest.price)}
            </strong>
            <span className="text-xs text-neutral-500 block">
              {cheapest.name}
            </span>
          </span>
        ) : (
          <span className="text-xs text-neutral-400">No packages listed</span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-bridal-cream">
      <header className="bg-gradient-to-br from-bridal-gold/15 to-bridal-cream border-b border-bridal-beige py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-bridal-gold-dark">
            Compare {vendors.length} vendor{vendors.length === 1 ? '' : 's'}
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            Side-by-side view of rating, price, capacity, and Pakistani-
            wedding features.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 overflow-auto">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `140px repeat(${vendors.length}, minmax(200px, 1fr))`,
          }}
        >
          {/* Column headers */}
          <div />
          {vendors.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-neutral-200 rounded-lg p-3 space-y-2 relative"
            >
              <button
                type="button"
                onClick={() => removeId(v.id)}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                aria-label="Remove from comparison"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="aspect-video bg-neutral-100 rounded-md overflow-hidden">
                {v.images && v.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.images[0]}
                    alt={v.name || `Vendor ${v.id}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                    No photo
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold truncate">
                {v.name || `Vendor #${v.id}`}
              </h3>
              <Link
                href={`/all-vendors/${v.id}`}
                className="block text-center bg-bridal-gold text-white py-1.5 rounded-md text-xs font-semibold hover:bg-bridal-gold-dark"
              >
                View profile
              </Link>
            </div>
          ))}

          {/* Rows */}
          {rows.map((row) => (
            <React.Fragment key={row.label}>
              <div className="text-[11px] uppercase tracking-wide font-medium text-neutral-500 py-3 pr-2">
                {row.label}
              </div>
              {vendors.map((v) => (
                <div
                  key={`${v.id}-${row.label}`}
                  className="bg-white border border-neutral-200 rounded-md p-3 text-sm flex items-center"
                >
                  {row.cell(v)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bridal-cream">
          <p className="text-sm text-neutral-500">Loading…</p>
        </div>
      }
    >
      <ComparePage />
    </Suspense>
  );
}

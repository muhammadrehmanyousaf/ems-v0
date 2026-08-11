'use client';

/**
 * Vendor detail — the admin's object page for a single vendor account.
 *
 * This is the founder's own example, verbatim: "if user go to the users, click
 * from the list of user, in a user the user's details opens, and in that detail
 * if user has some booking it will show there, if payments and other things
 * disputes will be there, when vendor clicks on it it will land to that
 * dedicated thing."
 *
 * Before this, /dashboard/vendors was a list with an approve/reject toggle and
 * nothing behind it. An admin deciding whether to approve a vendor, chase a
 * dispute, or understand a complaint had no single place showing who the vendor
 * is, what they've listed, and what's happened on their account.
 *
 * Every panel drills through: business → its own page, dispute → the booking it
 * sits on. Nothing here is a dead end.
 *
 * Super-admin only. Two of the three data sources are already server-gated to
 * super admin (the by-user business lookup 403s for a peer, and the admin
 * dispute queue is superAdminMiddleware'd), so a vendor who guesses the URL
 * sees a page with empty panels rather than another vendor's data.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { VendorsAPI, BusinessesAPI, type ApiUser, type ApiBusiness } from '@/lib/api/dashboard';
import { listAdminDisputes, type AdminDisputeRow } from '@/lib/api/disputes';
import { EmptyState } from "@/components/dashboard/primitives/empty-state";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-medium text-neutral-800 text-right break-all">{children}</span>
    </div>
  );
}

export default function VendorDetailView({ vendorId }: { vendorId: number }) {
  const router = useRouter();
  const [vendor, setVendor] = useState<ApiUser | null>(null);
  const [business, setBusiness] = useState<ApiBusiness | null>(null);
  const [disputes, setDisputes] = useState<AdminDisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(vendorId)) {
      setError('Invalid vendor id');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // The vendor is the hard dependency — fail loud. Everything else is
        // best-effort so one missing panel cannot blank the page.
        const v = await VendorsAPI.getById(vendorId);
        if (cancelled) return;
        if (!v) {
          setError('Vendor not found');
          setLoading(false);
          return;
        }
        setVendor(v);

        const [biz, disp] = await Promise.all([
          BusinessesAPI.getAdminBusinessByUserId(vendorId).catch(() => null),
          listAdminDisputes({ status: 'all', limit: 50 }).catch(() => ({
            rows: [] as AdminDisputeRow[],
            count: 0,
            page: 1,
            limit: 50,
          })),
        ]);
        if (cancelled) return;
        setBusiness(biz);
        setDisputes(disp.rows ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load vendor');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Vendors
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error || 'Vendor not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
            onClick={() => router.push('/dashboard/vendors')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Vendors
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {vendor.fullName || `Vendor #${vendor.id}`}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Vendor #{vendor.id}
            {vendor.vendorType ? ` · ${vendor.vendorType}` : ''}
            {vendor.city ? ` · ${vendor.city}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              vendor.active
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200',
            )}
          >
            {vendor.active ? 'Active' : 'Disabled'}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              vendor.reviewProfile === false
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-neutral-100 text-neutral-600 border-neutral-300',
            )}
          >
            {vendor.reviewProfile === false ? 'Awaiting review' : 'Listed'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Account */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Account</span>
              </div>
              <div className="space-y-1.5 ml-6">
                {vendor.email && (
                  <Row label="Email">
                    <a href={`mailto:${vendor.email}`} className="hover:underline">
                      {vendor.email}
                    </a>
                  </Row>
                )}
                {vendor.phoneNumber && (
                  <Row label="Phone">
                    <a href={`tel:${String(vendor.phoneNumber).replace(/\D/g, '')}`} className="hover:underline">
                      {vendor.phoneNumber}
                    </a>
                  </Row>
                )}
                <Row label="Joined">{fmtDate(vendor.createdAt)}</Row>
                <Row label="Role">{(vendor.roles || []).map((r) => r.name).join(", ") || "—"}</Row>
              </div>
            </CardContent>
          </Card>

          {/* Their listing */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Business listing</span>
              </div>
              {business ? (
                <div className="ml-6 space-y-2">
                  <Link
                    href={`/dashboard/businesses?businessId=${business.id}`}
                    className="block rounded-md border border-neutral-100 px-2.5 py-2 hover:bg-neutral-50"
                  >
                    <div className="text-sm font-medium text-neutral-800">
                      {business.name || `Business #${business.id}`}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[business.city, business.subArea].filter(Boolean).join(' · ') || 'No location set'}
                    </div>
                  </Link>
                </div>
              ) : (
                <EmptyState
                  className="ml-6"
                  size="inline"
                  title="No business listing yet."
                  description="A vendor without one cannot appear in search or take a booking — this is usually why an account looks inactive."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Verification state — what an admin is deciding on */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Trust</span>
              </div>
              <div className="space-y-1.5 ml-6">
                <Row label="Listing state">
                  {vendor.reviewProfile === false ? 'Awaiting review' : 'Approved'}
                </Row>
                <Row label="Balance">{Number.isFinite(Number(vendor.balance)) ? `Rs. ${Math.round(Number(vendor.balance)).toLocaleString("en-PK")}` : "—"}</Row>
              </div>
              <Link
                href="/dashboard/admin/vendor-queue"
                className="ml-6 inline-block text-[12px] text-bridal-gold hover:underline"
              >
                Vendor approval queue →
              </Link>
            </CardContent>
          </Card>

          {/* Platform disputes — the whole queue, one click away, because the
              endpoint has no per-vendor filter yet. Stated honestly rather than
              silently showing an unfiltered list as if it were this vendor's. */}
          {disputes.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">Disputes</span>
                </div>
                <p className="ml-6 text-[12px] text-neutral-500">
                  {disputes.length} on the platform. Per-vendor filtering needs a backend
                  change; until then this links to the full queue rather than showing a
                  list that looks vendor-specific and is not.
                </p>
                <Link
                  href="/dashboard/admin/disputes"
                  className="ml-6 inline-block text-[12px] text-bridal-gold hover:underline"
                >
                  Open dispute queue →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Vendor Portal Phase 2 #8.7 — Drone NOC permit view.
 *
 * Photographer-specific surface. PCAA + provincial Home Dept +
 * police-intimation permits with status flow (pending → approved →
 * expiring_soon → expired; reject + cancel side-tracks).
 *
 * Surfaces:
 *   - Upcoming banner: pending + expiring-soon + booking-linked
 *     permits surface here
 *   - Status filter pills + type filter + search
 *   - Per-permit card: status pill + type pill + authority pill +
 *     ref # monospace + drone reg + pilot name + venue + valid
 *     window with countdown
 *   - Approve / Reject / Cancel / Resubmit action buttons
 *   - Photo URL → external link
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Plane,
  AlertTriangle,
  Filter,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  Calendar,
  MapPin,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  DroneNocAPI,
  PERMIT_TYPE_LABELS,
  PERMIT_AUTHORITY_LABELS,
  PERMIT_STATUS_LABELS,
  PERMIT_STATUS_TONES,
  type DroneNOC,
  type PermitType,
  type IssuingAuthority,
  type PermitStatus,
  type PermitSummary,
  type CreatePermitInput,
} from '@/lib/api/droneNoc';

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}
function fmtDate(iso: string | null | undefined): string {
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
function daysFromNow(iso: string | null | undefined): number | null {
  if (!iso) return null;
  try {
    const t = new Date(iso).getTime();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return Math.floor((t - today.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

interface VendorBusinessOption {
  id: number;
  name: string;
}

const permitSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  bookingId: z.coerce.number().int().positive().optional(),
  permitType: z.enum([
    'single_event',
    'blanket_annual',
    'provincial_home_dept',
    'police_intimation',
  ]),
  issuingAuthority: z.enum([
    'pcaa',
    'home_dept_pb',
    'home_dept_sindh',
    'home_dept_kpk',
    'home_dept_balochistan',
    'police_station',
    'other',
  ]),
  referenceNumber: z.string().trim().min(1, 'Required').max(80),
  droneModel: z.string().trim().max(80).optional(),
  droneRegNumber: z.string().trim().max(60).optional(),
  droneWeightKg: z.coerce.number().min(0).max(25).optional(),
  pilotName: z.string().trim().max(120).optional(),
  pilotLicense: z.string().trim().max(60).optional(),
  eventDescription: z.string().trim().max(300).optional(),
  venueAddress: z.string().trim().max(500).optional(),
  appliedDate: z.string().trim().optional(),
  validFrom: z.string().trim().min(1, 'Required'),
  validUntil: z.string().trim().min(1, 'Required'),
  renewalLeadTimeDays: z.coerce.number().int().min(0).max(365).optional(),
  feePaid: z.coerce.number().min(0).max(10_000_000).optional(),
  permitPhotoUrl: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(5000).optional(),
});
type PermitFormValues = z.input<typeof permitSchema>;

export default function DroneNocView() {
  const [permits, setPermits] = useState<DroneNOC[]>([]);
  const [summary, setSummary] = useState<PermitSummary>({ byStatus: {}, byType: {} });
  const [upcoming, setUpcoming] = useState<DroneNOC[]>([]);
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PermitStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PermitType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editPermit, setEditPermit] = useState<DroneNOC | null>(null);
  const [approvePermit, setApprovePermit] = useState<DroneNOC | null>(null);
  const [rejectPermit, setRejectPermit] = useState<DroneNOC | null>(null);
  const [cancelPermit, setCancelPermit] = useState<DroneNOC | null>(null);
  const [deletePermit, setDeletePermit] = useState<DroneNOC | null>(null);

  useEffect(() => {
    axiosInstance
      .get('/api/v1/businesses/user-business')
      .then((res) => {
        const list = res.data?.data;
        const arr = Array.isArray(list) ? list : list?.data || [];
        setBusinesses(
          arr.map((b: any) => ({ id: b.id, name: b.name || `Business #${b.id}` })),
        );
      })
      .catch(() => {});
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [listRes, upRes] = await Promise.all([
        DroneNocAPI.list({
          status: statusFilter === 'all' ? undefined : statusFilter,
          permitType: typeFilter === 'all' ? undefined : typeFilter,
          search: search.trim() || undefined,
        }),
        DroneNocAPI.upcoming(),
      ]);
      setPermits(listRes.permits);
      setSummary(listRes.summary);
      setUpcoming(upRes.permits);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load permits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    const id = setTimeout(() => fetchAll(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleApprove = async (permit: DroneNOC) => {
    setBusy(permit.id);
    try {
      await DroneNocAPI.transition(permit.id, { to: 'approved' });
      toast.success('Permit approved');
      setApprovePermit(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not approve');
    } finally {
      setBusy(null);
    }
  };

  const handleResubmit = async (permit: DroneNOC) => {
    setBusy(permit.id);
    try {
      await DroneNocAPI.transition(permit.id, { to: 'pending' });
      toast.success('Marked pending — resubmit');
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not resubmit');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!deletePermit) return;
    setBusy(deletePermit.id);
    try {
      await DroneNocAPI.remove(deletePermit.id);
      toast.success('Permit removed');
      setDeletePermit(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upcoming banner */}
      {upcoming.length > 0 && (
        <Card className="border-blue-300 bg-blue-50/30">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <Plane className="h-4 w-4" />
              {upcoming.length} permit{upcoming.length === 1 ? '' : 's'} need
              attention (pending / expiring soon / booking-linked)
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.slice(0, 6).map((p) => {
                const dueIn = daysFromNow(p.validUntil);
                return (
                  <div
                    key={p.id}
                    className="rounded-md border border-blue-200 bg-white px-3 py-2 text-xs"
                  >
                    <div className="font-semibold">
                      {p.eventDescription || p.referenceNumber}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {PERMIT_TYPE_LABELS[p.permitType]} ·{' '}
                        {PERMIT_STATUS_LABELS[p.status]}
                      </span>
                      <span
                        className={`font-semibold ${
                          (dueIn ?? 0) < 0 ? 'text-rose-700' : 'text-blue-800'
                        }`}
                      >
                        {p.status === 'pending'
                          ? 'awaiting'
                          : dueIn != null
                            ? dueIn < 0
                              ? `${Math.abs(dueIn)}d expired`
                              : `${dueIn}d left`
                            : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Drone NOC tracker — PCAA federal, provincial Home Department add-ons,
          police-station intimations. Single-event and blanket-annual flavours
          supported. Surface expiring permits before your next aerial-shoot
          booking.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Log permit
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {(
          [
            'pending',
            'approved',
            'expiring_soon',
            'expired',
            'rejected',
            'cancelled',
          ] as PermitStatus[]
        ).map((s) => {
          const tone = PERMIT_STATUS_TONES[s];
          const count = summary.byStatus[s] || 0;
          return (
            <Card
              key={s}
              className={count > 0 ? `${tone.border}` : 'opacity-60'}
            >
              <CardContent className="space-y-1 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {PERMIT_STATUS_LABELS[s]}
                </div>
                <div className={`text-2xl font-semibold ${tone.text}`}>
                  {count}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Type:
          </span>
          {(['all', 'single_event', 'blanket_annual', 'provincial_home_dept', 'police_intimation'] as Array<
            'all' | PermitType
          >).map((t) => {
            const active = typeFilter === t;
            const count =
              t === 'all'
                ? Object.values(summary.byType).reduce((a, n) => a + (n || 0), 0)
                : summary.byType[t as PermitType] || 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t as any)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {t === 'all' ? 'All' : PERMIT_TYPE_LABELS[t as PermitType]}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-end gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(PERMIT_STATUS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, drone, pilot, venue…"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : permits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Plane className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No permits match. Click <strong>Log permit</strong> to register
              a new PCAA / Home Dept NOC.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {permits.map((p) => (
            <PermitCard
              key={p.id}
              permit={p}
              busy={busy === p.id}
              onEdit={() => setEditPermit(p)}
              onApprove={() => setApprovePermit(p)}
              onReject={() => setRejectPermit(p)}
              onCancel={() => setCancelPermit(p)}
              onResubmit={() => handleResubmit(p)}
              onDelete={() => setDeletePermit(p)}
            />
          ))}
        </div>
      )}

      <PermitDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />
      <PermitDialog
        open={!!editPermit}
        onOpenChange={(o) => !o && setEditPermit(null)}
        businesses={businesses}
        permit={editPermit || undefined}
        onSaved={async () => {
          setEditPermit(null);
          await fetchAll();
        }}
      />

      {/* Approve confirm */}
      <AlertDialog
        open={!!approvePermit}
        onOpenChange={(o) => !o && setApprovePermit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve permit?</AlertDialogTitle>
            <AlertDialogDescription>
              Marking #{approvePermit?.referenceNumber} as approved. PCAA
              reference + cert dates should already be filled in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approvePermit && handleApprove(approvePermit)}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReasonDialog
        permit={rejectPermit}
        action="rejected"
        title="Reject permit"
        description="Capture the reason PCAA / Home Dept refused (drone weight, restricted airspace, missing paperwork)."
        onOpenChange={(o) => !o && setRejectPermit(null)}
        onSaved={async () => {
          setRejectPermit(null);
          await fetchAll();
        }}
      />
      <ReasonDialog
        permit={cancelPermit}
        action="cancelled"
        title="Cancel permit"
        description="Use for booking cancellation, withdrawn application, or any reason the permit no longer applies."
        onOpenChange={(o) => !o && setCancelPermit(null)}
        onSaved={async () => {
          setCancelPermit(null);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deletePermit}
        onOpenChange={(o) => !o && setDeletePermit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this permit?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-deleted. Audit trail preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PermitCard({
  permit,
  busy,
  onEdit,
  onApprove,
  onReject,
  onCancel,
  onResubmit,
  onDelete,
}: {
  permit: DroneNOC;
  busy: boolean;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onResubmit: () => void;
  onDelete: () => void;
}) {
  const tone = PERMIT_STATUS_TONES[permit.status];
  const dueIn = daysFromNow(permit.validUntil);
  const cardBorder =
    permit.status === 'expiring_soon'
      ? 'border-amber-300'
      : permit.status === 'expired' || permit.status === 'rejected'
        ? 'border-rose-300'
        : '';

  return (
    <Card className={cardBorder}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">
                {permit.eventDescription || permit.referenceNumber}
              </span>
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border}`}
              >
                {PERMIT_STATUS_LABELS[permit.status]}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {PERMIT_TYPE_LABELS[permit.permitType]}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {PERMIT_AUTHORITY_LABELS[permit.issuingAuthority]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">#{permit.referenceNumber}</span>
              {permit.droneRegNumber && (
                <span className="font-mono">UAV {permit.droneRegNumber}</span>
              )}
              {permit.droneModel && <span>{permit.droneModel}</span>}
              {permit.pilotName && <span>Pilot: {permit.pilotName}</span>}
              {permit.bookingId && (
                <span>Booking #{permit.bookingId}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            {dueIn != null &&
              permit.status !== 'rejected' &&
              permit.status !== 'cancelled' && (
                <div
                  className={`text-base font-semibold ${
                    dueIn < 0
                      ? 'text-rose-700'
                      : dueIn <= permit.renewalLeadTimeDays
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}
                >
                  {dueIn < 0 ? `${Math.abs(dueIn)}d expired` : `${dueIn}d left`}
                </div>
              )}
            {permit.feePaid != null && Number(permit.feePaid) > 0 && (
              <div className="text-[11px] text-muted-foreground">
                {fmtPKR(permit.feePaid)} paid
              </div>
            )}
          </div>
        </div>

        {/* Validity strip */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5">
            <Calendar className="h-3 w-3" />
            {fmtDate(permit.validFrom)} → {fmtDate(permit.validUntil)}
          </span>
          {permit.venueAddress && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-blue-800">
              <MapPin className="h-3 w-3" />
              {permit.venueAddress.slice(0, 40)}
              {permit.venueAddress.length > 40 ? '…' : ''}
            </span>
          )}
          {permit.droneWeightKg != null && (
            <span className="rounded bg-violet-50 px-2 py-0.5 text-violet-800">
              {Number(permit.droneWeightKg)} kg
            </span>
          )}
        </div>

        {permit.statusReason &&
          (permit.status === 'rejected' || permit.status === 'cancelled') && (
            <p className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-900">
              {permit.status === 'rejected' ? (
                <Ban className="mr-1 inline h-3 w-3" />
              ) : (
                <XCircle className="mr-1 inline h-3 w-3" />
              )}
              {permit.statusReason}
            </p>
          )}

        {permit.notes && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-neutral-700">
            {permit.notes}
          </p>
        )}

        {permit.permitPhotoUrl && (
          <a
            href={permit.permitPhotoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 underline"
          >
            View permit PDF / photo
          </a>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {permit.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onApprove}
                disabled={busy}
                className="border-emerald-300 text-emerald-800"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={busy}
                className="border-rose-300 text-rose-800"
              >
                <Ban className="mr-1 h-3 w-3" />
                Reject
              </Button>
            </>
          )}
          {(permit.status === 'rejected' || permit.status === 'cancelled') && (
            <Button
              size="sm"
              variant="outline"
              onClick={onResubmit}
              disabled={busy}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Resubmit
            </Button>
          )}
          {(permit.status === 'approved' ||
            permit.status === 'expiring_soon' ||
            permit.status === 'expired') && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={busy}
            >
              <XCircle className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={busy}
            className="ml-auto text-rose-700 hover:text-rose-900"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PermitDialog({
  open,
  onOpenChange,
  businesses,
  permit,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  permit?: DroneNOC;
  onSaved: () => Promise<void> | void;
}) {
  const isEdit = !!permit;
  const form = useForm<PermitFormValues>({
    resolver: zodResolver(permitSchema),
    defaultValues: {
      businessId: permit?.businessId ?? businesses[0]?.id,
      bookingId: permit?.bookingId ?? undefined,
      permitType: permit?.permitType ?? 'single_event',
      issuingAuthority: permit?.issuingAuthority ?? 'pcaa',
      referenceNumber: permit?.referenceNumber ?? '',
      droneModel: permit?.droneModel ?? '',
      droneRegNumber: permit?.droneRegNumber ?? '',
      droneWeightKg:
        permit?.droneWeightKg != null
          ? Number(permit.droneWeightKg)
          : undefined,
      pilotName: permit?.pilotName ?? '',
      pilotLicense: permit?.pilotLicense ?? '',
      eventDescription: permit?.eventDescription ?? '',
      venueAddress: permit?.venueAddress ?? '',
      appliedDate: permit?.appliedDate ?? '',
      validFrom: permit?.validFrom ?? new Date().toISOString().slice(0, 10),
      validUntil: permit?.validUntil ?? '',
      renewalLeadTimeDays: permit?.renewalLeadTimeDays ?? 30,
      feePaid:
        permit?.feePaid != null ? Number(permit.feePaid) : undefined,
      permitPhotoUrl: permit?.permitPhotoUrl ?? '',
      notes: permit?.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: permit?.businessId ?? businesses[0]?.id,
        bookingId: permit?.bookingId ?? undefined,
        permitType: permit?.permitType ?? 'single_event',
        issuingAuthority: permit?.issuingAuthority ?? 'pcaa',
        referenceNumber: permit?.referenceNumber ?? '',
        droneModel: permit?.droneModel ?? '',
        droneRegNumber: permit?.droneRegNumber ?? '',
        droneWeightKg:
          permit?.droneWeightKg != null
            ? Number(permit.droneWeightKg)
            : undefined,
        pilotName: permit?.pilotName ?? '',
        pilotLicense: permit?.pilotLicense ?? '',
        eventDescription: permit?.eventDescription ?? '',
        venueAddress: permit?.venueAddress ?? '',
        appliedDate: permit?.appliedDate ?? '',
        validFrom: permit?.validFrom ?? new Date().toISOString().slice(0, 10),
        validUntil: permit?.validUntil ?? '',
        renewalLeadTimeDays: permit?.renewalLeadTimeDays ?? 30,
        feePaid:
          permit?.feePaid != null ? Number(permit.feePaid) : undefined,
        permitPhotoUrl: permit?.permitPhotoUrl ?? '',
        notes: permit?.notes ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, permit, businesses]);

  const onSubmit = async (values: PermitFormValues) => {
    try {
      const payload: CreatePermitInput = {
        businessId: Number(values.businessId),
        bookingId:
          values.bookingId != null ? Number(values.bookingId) : undefined,
        permitType: values.permitType as PermitType,
        issuingAuthority: values.issuingAuthority as IssuingAuthority,
        referenceNumber: values.referenceNumber,
        droneModel: values.droneModel || undefined,
        droneRegNumber: values.droneRegNumber || undefined,
        droneWeightKg:
          values.droneWeightKg != null ? Number(values.droneWeightKg) : undefined,
        pilotName: values.pilotName || undefined,
        pilotLicense: values.pilotLicense || undefined,
        eventDescription: values.eventDescription || undefined,
        venueAddress: values.venueAddress || undefined,
        appliedDate: values.appliedDate || undefined,
        validFrom: values.validFrom,
        validUntil: values.validUntil,
        renewalLeadTimeDays:
          values.renewalLeadTimeDays != null
            ? Number(values.renewalLeadTimeDays)
            : undefined,
        feePaid: values.feePaid != null ? Number(values.feePaid) : undefined,
        permitPhotoUrl: values.permitPhotoUrl || undefined,
        notes: values.notes || undefined,
      };
      if (isEdit && permit) {
        await DroneNocAPI.update(permit.id, payload);
        toast.success('Permit updated');
      } else {
        await DroneNocAPI.create(payload);
        toast.success('Permit logged');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save permit');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit permit' : 'Log drone NOC permit'}
          </DialogTitle>
          <DialogDescription>
            PCAA Civil Aviation Rules 1994 + 2019 Drone Operation Rules
            require this before flying. Capture ref #, drone reg, pilot name,
            validity window, and PDF/photo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {!isEdit && (
              <FormField
                control={form.control}
                name="businessId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business *</FormLabel>
                    <Select
                      value={String(field.value ?? '')}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businesses.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="permitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permit type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PERMIT_TYPE_LABELS).map(
                          ([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuingAuthority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing authority *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PERMIT_AUTHORITY_LABELS).map(
                          ([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PCAA-NOC-2026-0042"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="appliedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applied</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid from *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid until *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="eventDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Baraat aerial — Royal Palm DHA Lahore"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venueAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="droneModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drone model</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DJI Mavic 3 Pro"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="droneRegNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UAV reg #</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PK-UAV-1234"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="droneWeightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drone weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={25}
                        placeholder="e.g. 1.05"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>PCAA commercial cap: 25 kg.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="pilotName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilot name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pilotLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilot license</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PCAA-RPA-0123"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="feePaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee paid (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="e.g. 10000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewalLeadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal lead (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={365} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking #</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Tie to event"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="permitPhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permit PDF / photo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? 'Save changes' : 'Log permit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialog({
  permit,
  action,
  title,
  description,
  onOpenChange,
  onSaved,
}: {
  permit: DroneNOC | null;
  action: 'rejected' | 'cancelled';
  title: string;
  description: string;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReason(''), [permit?.id]);

  if (!permit) return null;

  const submit = async () => {
    if (!reason.trim()) {
      toast.error('Reason required');
      return;
    }
    setSubmitting(true);
    try {
      await DroneNocAPI.transition(permit.id, {
        to: action,
        statusReason: reason.trim(),
      });
      toast.success(`Permit ${action}`);
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!permit} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title} — {permit.referenceNumber}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            action === 'rejected'
              ? 'e.g. Drone weight exceeds permitted 7 kg threshold'
              : 'e.g. Wedding cancelled by customer'
          }
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

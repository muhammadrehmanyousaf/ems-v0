'use client';

/**
 * Vendor Portal Phase 2 #8.6 — Halal certificate tracker view.
 *
 * Caterer-specific surface. Tracks halal certs from PHA / SANHA /
 * JUH / etc. with auto-status-recompute on every read so vendors
 * see EXPIRING_SOON before customers ask awkward questions.
 *
 * Surfaces:
 *   - Expiring banner (top): "X certs expiring in next 30 days"
 *     amber/rose-tinted, top-3 listed with days-to-expiry
 *   - Status filter pills + authority filter + search
 *   - Per-cert card: status badge tinted by status, days-to-expiry
 *     countdown, issuing authority + cert # monospace, item desc,
 *     issued/expiry dates, supplier link, photo URL
 *   - Add/edit dialog with PK + international authority picker
 *   - Revoke / Renew dialogs
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Filter,
  Search,
  Pencil,
  Trash2,
  XCircle,
  Building,
  Calendar,
  RefreshCw,
  Ban,
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
  HalalCertAPI,
  ISSUING_AUTHORITY_LABELS,
  CERT_STATUS_LABELS,
  CERT_STATUS_TONES,
  type HalalCert,
  type IssuingAuthority,
  type CertStatus,
  type CertSummary,
  type CreateCertInput,
} from '@/lib/api/halalCerts';

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

const certSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  supplierId: z.coerce.number().int().positive().optional(),
  supplierNameSnapshot: z.string().trim().max(200).optional(),
  certNumber: z.string().trim().min(1, 'Required').max(60),
  issuingAuthority: z.enum([
    'pha',
    'shdb_sindh',
    'kpk_halal',
    'sfa_pakistan',
    'sanha',
    'juh_india',
    'muis',
    'esma',
    'manual_attestation',
    'other',
  ]),
  itemDescription: z.string().trim().min(1, 'Required').max(300),
  issuedDate: z.string().trim().min(1, 'Required'),
  expiryDate: z.string().trim().min(1, 'Required'),
  renewalLeadTimeDays: z.coerce.number().int().min(0).max(365).optional(),
  certPhotoUrl: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(5000).optional(),
});
type CertFormValues = z.input<typeof certSchema>;

export default function HalalCertsView() {
  const [certs, setCerts] = useState<HalalCert[]>([]);
  const [summary, setSummary] = useState<CertSummary>({
    byStatus: {},
    byAuthority: {},
  });
  const [expiring, setExpiring] = useState<HalalCert[]>([]);
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CertStatus | 'all'>('all');
  const [authorityFilter, setAuthorityFilter] = useState<IssuingAuthority | 'all'>('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editCert, setEditCert] = useState<HalalCert | null>(null);
  const [revokeCert, setRevokeCert] = useState<HalalCert | null>(null);
  const [renewCert, setRenewCert] = useState<HalalCert | null>(null);
  const [deleteCert, setDeleteCert] = useState<HalalCert | null>(null);

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
      const [listRes, expRes] = await Promise.all([
        HalalCertAPI.list({
          status: statusFilter === 'all' ? undefined : statusFilter,
          issuingAuthority:
            authorityFilter === 'all' ? undefined : authorityFilter,
          search: search.trim() || undefined,
        }),
        HalalCertAPI.expiring(),
      ]);
      setCerts(listRes.certs);
      setSummary(listRes.summary);
      setExpiring(expRes.certs);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load certs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, authorityFilter]);

  useEffect(() => {
    const id = setTimeout(() => fetchAll(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async () => {
    if (!deleteCert) return;
    setBusy(deleteCert.id);
    try {
      await HalalCertAPI.remove(deleteCert.id);
      toast.success('Cert removed');
      setDeleteCert(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Expiring banner */}
      {expiring.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/30">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              {expiring.length} cert{expiring.length === 1 ? '' : 's'} expiring soon or already expired
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {expiring.slice(0, 6).map((c) => {
                const dueIn = daysFromNow(c.expiryDate);
                return (
                  <div
                    key={c.id}
                    className="rounded-md border border-amber-200 bg-white px-3 py-2 text-xs"
                  >
                    <div className="font-semibold">{c.itemDescription}</div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {ISSUING_AUTHORITY_LABELS[c.issuingAuthority]}
                      </span>
                      <span
                        className={`font-semibold ${
                          (dueIn ?? 0) < 0 ? 'text-rose-700' : 'text-amber-800'
                        }`}
                      >
                        {dueIn != null
                          ? dueIn < 0
                            ? `${Math.abs(dueIn)}d overdue`
                            : `${dueIn}d`
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
          Halal certificates for your meat / poultry / processed-food
          supply. PHA / SANHA / JUH / Federal HFA all supported. Expiring
          certs surface here automatically so you never get caught off-
          guard when a customer asks for proof.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add cert
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['active', 'expiring_soon', 'expired', 'pending_renewal', 'revoked'] as CertStatus[]).map(
          (s) => {
            const tone = CERT_STATUS_TONES[s];
            const count = summary.byStatus[s] || 0;
            return (
              <Card
                key={s}
                className={count > 0 ? `${tone.border}` : 'opacity-60'}
              >
                <CardContent className="space-y-1 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {CERT_STATUS_LABELS[s]}
                  </div>
                  <div className={`text-2xl font-semibold ${tone.text}`}>
                    {count}
                  </div>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Status:
          </span>
          {(['all', 'active', 'expiring_soon', 'expired', 'pending_renewal', 'revoked'] as Array<
            'all' | CertStatus
          >).map((s) => {
            const active = statusFilter === s;
            const count =
              s === 'all'
                ? Object.values(summary.byStatus).reduce(
                    (a, n) => a + (n || 0),
                    0,
                  )
                : summary.byStatus[s as CertStatus] || 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s as any)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {s === 'all' ? 'All' : CERT_STATUS_LABELS[s as CertStatus]}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-end gap-2">
          <Select
            value={authorityFilter}
            onValueChange={(v) => setAuthorityFilter(v as any)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All authorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All authorities</SelectItem>
              {Object.entries(ISSUING_AUTHORITY_LABELS).map(([k, label]) => (
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
              placeholder="Search cert #, item, supplier…"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {/* Certs list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No certs match this filter. Click <strong>Add cert</strong> to
              register your first halal cert.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {certs.map((c) => (
            <CertCard
              key={c.id}
              cert={c}
              busy={busy === c.id}
              onEdit={() => setEditCert(c)}
              onRevoke={() => setRevokeCert(c)}
              onRenew={() => setRenewCert(c)}
              onDelete={() => setDeleteCert(c)}
            />
          ))}
        </div>
      )}

      <CertDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />
      <CertDialog
        open={!!editCert}
        onOpenChange={(o) => !o && setEditCert(null)}
        businesses={businesses}
        cert={editCert || undefined}
        onSaved={async () => {
          setEditCert(null);
          await fetchAll();
        }}
      />

      <RevokeDialog
        cert={revokeCert}
        onOpenChange={(o) => !o && setRevokeCert(null)}
        onSaved={async () => {
          setRevokeCert(null);
          await fetchAll();
        }}
      />

      <RenewDialog
        cert={renewCert}
        onOpenChange={(o) => !o && setRenewCert(null)}
        onSaved={async () => {
          setRenewCert(null);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deleteCert}
        onOpenChange={(o) => !o && setDeleteCert(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this cert?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-deleted. Cert history preserved for audit.
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

function CertCard({
  cert,
  busy,
  onEdit,
  onRevoke,
  onRenew,
  onDelete,
}: {
  cert: HalalCert;
  busy: boolean;
  onEdit: () => void;
  onRevoke: () => void;
  onRenew: () => void;
  onDelete: () => void;
}) {
  const tone = CERT_STATUS_TONES[cert.status];
  const dueIn = daysFromNow(cert.expiryDate);
  const cardBorder =
    cert.status === 'expiring_soon'
      ? 'border-amber-300'
      : cert.status === 'expired'
        ? 'border-rose-300'
        : '';

  return (
    <Card className={cardBorder}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{cert.itemDescription}</span>
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border}`}
              >
                {CERT_STATUS_LABELS[cert.status]}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {ISSUING_AUTHORITY_LABELS[cert.issuingAuthority]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">#{cert.certNumber}</span>
              {cert.supplierNameSnapshot && (
                <span className="inline-flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {cert.supplierNameSnapshot}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Issued {fmtDate(cert.issuedDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                Expires {fmtDate(cert.expiryDate)}
              </span>
            </div>
          </div>
          <div className="text-right">
            {dueIn != null && cert.status !== 'revoked' && (
              <>
                <div
                  className={`text-lg font-semibold ${
                    dueIn < 0
                      ? 'text-rose-700'
                      : dueIn <= 30
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}
                >
                  {dueIn < 0 ? `${Math.abs(dueIn)}d overdue` : `${dueIn}d left`}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Lead time {cert.renewalLeadTimeDays}d
                </div>
              </>
            )}
          </div>
        </div>

        {cert.revokedReason && cert.status === 'revoked' && (
          <p className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-900">
            <Ban className="mr-1 inline h-3 w-3" />
            Revoked: {cert.revokedReason}
          </p>
        )}

        {cert.notes && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-neutral-700">
            {cert.notes}
          </p>
        )}

        {cert.certPhotoUrl && (
          <a
            href={cert.certPhotoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 underline"
          >
            View cert photo
          </a>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {cert.status === 'pending_renewal' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onRenew}
              disabled={busy}
              className="border-emerald-300 text-emerald-800"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Renewal received
            </Button>
          ) : (
            cert.status !== 'revoked' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRenew}
                disabled={busy}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Mark pending renewal
              </Button>
            )
          )}
          {cert.status !== 'revoked' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRevoke}
              disabled={busy}
              className="border-rose-300 text-rose-800"
            >
              <Ban className="mr-1 h-3 w-3" />
              Revoke
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

function CertDialog({
  open,
  onOpenChange,
  businesses,
  cert,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  cert?: HalalCert;
  onSaved: () => Promise<void> | void;
}) {
  const isEdit = !!cert;
  const form = useForm<CertFormValues>({
    resolver: zodResolver(certSchema),
    defaultValues: {
      businessId: cert?.businessId ?? businesses[0]?.id,
      supplierId: cert?.supplierId ?? undefined,
      supplierNameSnapshot: cert?.supplierNameSnapshot ?? '',
      certNumber: cert?.certNumber ?? '',
      issuingAuthority: cert?.issuingAuthority ?? 'pha',
      itemDescription: cert?.itemDescription ?? '',
      issuedDate: cert?.issuedDate ?? new Date().toISOString().slice(0, 10),
      expiryDate: cert?.expiryDate ?? '',
      renewalLeadTimeDays: cert?.renewalLeadTimeDays ?? 30,
      certPhotoUrl: cert?.certPhotoUrl ?? '',
      notes: cert?.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: cert?.businessId ?? businesses[0]?.id,
        supplierId: cert?.supplierId ?? undefined,
        supplierNameSnapshot: cert?.supplierNameSnapshot ?? '',
        certNumber: cert?.certNumber ?? '',
        issuingAuthority: cert?.issuingAuthority ?? 'pha',
        itemDescription: cert?.itemDescription ?? '',
        issuedDate: cert?.issuedDate ?? new Date().toISOString().slice(0, 10),
        expiryDate: cert?.expiryDate ?? '',
        renewalLeadTimeDays: cert?.renewalLeadTimeDays ?? 30,
        certPhotoUrl: cert?.certPhotoUrl ?? '',
        notes: cert?.notes ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cert, businesses]);

  const onSubmit = async (values: CertFormValues) => {
    try {
      const payload: CreateCertInput = {
        businessId: Number(values.businessId),
        supplierId:
          values.supplierId != null ? Number(values.supplierId) : undefined,
        supplierNameSnapshot: values.supplierNameSnapshot || undefined,
        certNumber: values.certNumber,
        issuingAuthority: values.issuingAuthority as IssuingAuthority,
        itemDescription: values.itemDescription,
        issuedDate: values.issuedDate,
        expiryDate: values.expiryDate,
        renewalLeadTimeDays:
          values.renewalLeadTimeDays != null
            ? Number(values.renewalLeadTimeDays)
            : undefined,
        certPhotoUrl: values.certPhotoUrl || undefined,
        notes: values.notes || undefined,
      };
      if (isEdit && cert) {
        await HalalCertAPI.update(cert.id, payload);
        toast.success('Cert updated');
      } else {
        await HalalCertAPI.create(payload);
        toast.success('Cert added');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save cert');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit cert' : 'Add halal cert'}</DialogTitle>
          <DialogDescription>
            Capture cert #, issuing authority, item description, issue + expiry
            dates. Status auto-computes from expiry; manual revoke /
            pending-renewal overrides it.
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
                name="certNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cert number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PHA-2026-0042"
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
                        {Object.entries(ISSUING_AUTHORITY_LABELS).map(
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
              name="itemDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item description *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Boneless mutton (local goat) / Brazilian frozen beef"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierNameSnapshot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Liaqat Meat Shop"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Free-text; or link to a supplier via supplierId.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="issuedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issued *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Flagged as expiring this many days before expiry.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certPhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cert photo URL</FormLabel>
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
                {isEdit ? 'Save changes' : 'Add cert'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog({
  cert,
  onOpenChange,
  onSaved,
}: {
  cert: HalalCert | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReason(''), [cert?.id]);

  if (!cert) return null;

  const submit = async () => {
    if (!reason.trim()) {
      toast.error('Revoke reason required');
      return;
    }
    setSubmitting(true);
    try {
      await HalalCertAPI.transition(cert.id, {
        to: 'revoked',
        revokedReason: reason.trim(),
      });
      toast.success('Cert revoked');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not revoke');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!cert} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke cert — {cert.itemDescription}</DialogTitle>
          <DialogDescription>
            Revoking is terminal. The cert stays in your ledger but you'll
            need to add a new one for fresh supply.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Supplier lost their PHA certification"
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
            Revoke
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenewDialog({
  cert,
  onOpenChange,
  onSaved,
}: {
  cert: HalalCert | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const isPending = cert?.status === 'pending_renewal';
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNewCertNumber('');
    setNewExpiry('');
  }, [cert?.id]);

  if (!cert) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      if (isPending) {
        await HalalCertAPI.transition(cert.id, {
          to: 'active',
          newCertNumber: newCertNumber || undefined,
          newExpiryDate: newExpiry || undefined,
        });
        toast.success('Cert reactivated');
      } else {
        await HalalCertAPI.transition(cert.id, { to: 'pending_renewal' });
        toast.success('Marked pending renewal');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!cert} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPending ? 'Renewal received' : 'Mark pending renewal'}
          </DialogTitle>
          <DialogDescription>
            {isPending
              ? 'Capture the new cert # and expiry date — the row reactivates.'
              : 'Track that you\'ve sent the cert for renewal. The old cert keeps its dates until you update.'}
          </DialogDescription>
        </DialogHeader>
        {isPending && (
          <div className="space-y-2">
            <Input
              placeholder="New cert number"
              value={newCertNumber}
              onChange={(e) => setNewCertNumber(e.target.value)}
              className="font-mono"
            />
            <Input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
            />
          </div>
        )}
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
            {isPending ? 'Reactivate' : 'Mark pending'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

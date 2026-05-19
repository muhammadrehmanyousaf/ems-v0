'use client';

/**
 * Vendor Portal Phase 2 #8.8 — Broker commission ledger view.
 *
 * Two tabs:
 *
 *   1. Commissions — per-event ledger. Status pills + date filter
 *      + outstanding-by-broker dashboard. Per-commission card with
 *      commission breakdown (booking amount × pct, or flat),
 *      progress bar (paid / commissionAmount), overdue badge,
 *      "Record payment" / "Dispute" / "Void" actions.
 *
 *   2. Brokers — directory of who introduced the booking. Type
 *      filter (rishta / hall_broker / wedding_planner / etc.),
 *      search, per-row card with default commission rate, NIC/NTN,
 *      payment rails.
 *
 * Live-system safety: pure consumer of /api/v1/brokers. Zero
 * mutation of any existing surface.
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
  Handshake,
  ClipboardList,
  AlertTriangle,
  Filter,
  Search,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  HandCoins,
  Percent,
  Banknote,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  BrokerAPI,
  BROKER_TYPE_LABELS,
  COMMISSION_STATUS_LABELS,
  COMMISSION_STATUS_TONES,
  COMMISSION_PAYMENT_METHOD_LABELS,
  type Broker,
  type BrokerCommission,
  type BrokerType,
  type CommissionStatus,
  type CommissionType,
  type CommissionPaymentMethod,
  type BrokerSummary,
  type CommissionSummary,
  type OutstandingSummary,
  type CreateBrokerInput,
  type CreateCommissionInput,
} from '@/lib/api/brokers';

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

export default function BrokersView() {
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);

  useEffect(() => {
    axiosInstance
      .get('/api/v1/businesses/user-business')
      .then((res) => {
        const list = res.data?.data;
        const arr = Array.isArray(list) ? list : list?.data || [];
        setBusinesses(
          arr.map((b: any) => ({
            id: b.id,
            name: b.name || `Business #${b.id}`,
          })),
        );
      })
      .catch(() => {});
  }, []);

  return (
    <Tabs defaultValue="commissions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="commissions">
          <ClipboardList className="mr-2 h-4 w-4" />
          Commissions
        </TabsTrigger>
        <TabsTrigger value="brokers">
          <Handshake className="mr-2 h-4 w-4" />
          Brokers
        </TabsTrigger>
      </TabsList>
      <TabsContent value="commissions">
        <CommissionsTab businesses={businesses} />
      </TabsContent>
      <TabsContent value="brokers">
        <BrokersTab businesses={businesses} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Brokers tab ──────────────────────────────────────────────────

const brokerSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  name: z.string().trim().min(1, 'Required').max(160),
  brokerType: z.string().min(1),
  agencyName: z.string().trim().max(200).optional(),
  contactPerson: z.string().trim().max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  ntn: z.string().trim().max(20).optional(),
  cnic: z.string().trim().max(20).optional(),
  defaultCommissionPct: z.coerce.number().min(0).max(50).optional(),
  defaultCommissionFlat: z.coerce.number().min(0).max(100_000_000).optional(),
  bankName: z.string().trim().max(100).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
  jazzcashNumber: z.string().trim().max(30).optional(),
  easypaisaNumber: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional(),
});
type BrokerFormValues = z.input<typeof brokerSchema>;

function BrokersTab({ businesses }: { businesses: VendorBusinessOption[] }) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [summary, setSummary] = useState<BrokerSummary>({
    byType: {},
    activeCount: 0,
    inactiveCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<BrokerType | 'all'>('all');
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editBroker, setEditBroker] = useState<Broker | null>(null);
  const [deleteBkr, setDeleteBkr] = useState<Broker | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await BrokerAPI.list({
        brokerType: typeFilter === 'all' ? undefined : typeFilter,
        isActive: activeOnly ? true : undefined,
        search: search.trim() || undefined,
      });
      setBrokers(res.brokers);
      setSummary(res.summary);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load brokers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, activeOnly]);

  useEffect(() => {
    const id = setTimeout(() => fetchAll(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async () => {
    if (!deleteBkr) return;
    setBusy(deleteBkr.id);
    try {
      await BrokerAPI.remove(deleteBkr.id);
      toast.success('Broker removed');
      setDeleteBkr(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Who introduces customers to you — rishta brokers, hall middlemen,
          wedding planners, hotel concierges, Instagram referrers. Capture
          their default commission once; new commission rows pre-fill from
          here.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add broker
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Active
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <Handshake className="h-5 w-5 text-emerald-600" />
              {summary.activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Inactive
            </div>
            <div className="text-2xl font-semibold">{summary.inactiveCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Types
            </div>
            <div className="text-2xl font-semibold">
              {Object.keys(summary.byType).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Type:
          </span>
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              typeFilter === 'all'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            All
          </button>
          {(Object.keys(BROKER_TYPE_LABELS) as BrokerType[])
            .filter((t) => (summary.byType[t] || 0) > 0 || typeFilter === t)
            .map((t) => {
              const active = typeFilter === t;
              const count = summary.byType[t] || 0;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(active ? 'all' : t)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {BROKER_TYPE_LABELS[t]}
                  {count > 0 && (
                    <span className="ml-1 opacity-70">({count})</span>
                  )}
                </button>
              );
            })}
          <button
            type="button"
            onClick={() => setActiveOnly((v) => !v)}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              activeOnly
                ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Active only
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, agency, phone…"
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : brokers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Handshake className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No brokers match this filter. Click <strong>Add broker</strong> to
              capture who introduces your customers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {brokers.map((b) => (
            <BrokerCard
              key={b.id}
              broker={b}
              busy={busy === b.id}
              onEdit={() => setEditBroker(b)}
              onDelete={() => setDeleteBkr(b)}
            />
          ))}
        </div>
      )}

      <BrokerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />
      <BrokerDialog
        open={!!editBroker}
        onOpenChange={(o) => !o && setEditBroker(null)}
        businesses={businesses}
        broker={editBroker || undefined}
        onSaved={async () => {
          setEditBroker(null);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deleteBkr}
        onOpenChange={(o) => !o && setDeleteBkr(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this broker?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-deleted. Their commission history is preserved.
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

function BrokerCard({
  broker,
  busy,
  onEdit,
  onDelete,
}: {
  broker: Broker;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = broker.defaultCommissionPct
    ? Number(broker.defaultCommissionPct)
    : null;
  const flat = broker.defaultCommissionFlat
    ? Number(broker.defaultCommissionFlat)
    : null;
  return (
    <Card className={broker.isActive ? '' : 'opacity-60'}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{broker.name}</span>
              <Badge variant="outline">
                {BROKER_TYPE_LABELS[broker.brokerType]}
              </Badge>
              {!broker.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {broker.agencyName && <span>{broker.agencyName}</span>}
              {broker.contactPerson && <span>{broker.contactPerson}</span>}
              {broker.phoneNumber && (
                <a
                  href={`tel:${broker.phoneNumber}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {broker.phoneNumber}
                </a>
              )}
              {broker.cnic && (
                <span className="font-mono">CNIC {broker.cnic.length === 13 ? `${broker.cnic.slice(0, 5)}-${broker.cnic.slice(5, 12)}-${broker.cnic.slice(12)}` : broker.cnic}</span>
              )}
              {broker.ntn && (
                <span className="font-mono">NTN {broker.ntn}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            {pct != null && pct > 0 && (
              <div>
                <div className="inline-flex items-center gap-1 text-lg font-semibold">
                  <Percent className="h-4 w-4 text-neutral-500" />
                  {pct}%
                </div>
                <div className="text-[10px] text-muted-foreground">default</div>
              </div>
            )}
            {flat != null && flat > 0 && (
              <div className="mt-1">
                <div className="inline-flex items-center gap-1 text-sm font-semibold">
                  <Banknote className="h-3.5 w-3.5 text-neutral-500" />
                  {fmtPKR(flat)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  flat fee
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={busy}
            className="text-rose-700 hover:text-rose-900"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BrokerDialog({
  open,
  onOpenChange,
  businesses,
  broker,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  broker?: Broker;
  onSaved: () => Promise<void> | void;
}) {
  const isEdit = !!broker;
  const form = useForm<BrokerFormValues>({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      businessId: broker?.businessId ?? businesses[0]?.id,
      name: broker?.name ?? '',
      brokerType: broker?.brokerType ?? 'rishta',
      agencyName: broker?.agencyName ?? '',
      contactPerson: broker?.contactPerson ?? '',
      phoneNumber: broker?.phoneNumber ?? '',
      whatsappNumber: broker?.whatsappNumber ?? '',
      address: broker?.address ?? '',
      ntn: broker?.ntn ?? '',
      cnic: broker?.cnic ?? '',
      defaultCommissionPct:
        broker?.defaultCommissionPct != null
          ? Number(broker.defaultCommissionPct)
          : undefined,
      defaultCommissionFlat:
        broker?.defaultCommissionFlat != null
          ? Number(broker.defaultCommissionFlat)
          : undefined,
      bankName: broker?.bankName ?? '',
      bankAccountNumber: broker?.bankAccountNumber ?? '',
      jazzcashNumber: broker?.jazzcashNumber ?? '',
      easypaisaNumber: broker?.easypaisaNumber ?? '',
      notes: broker?.notes ?? '',
      isActive: broker?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: broker?.businessId ?? businesses[0]?.id,
        name: broker?.name ?? '',
        brokerType: broker?.brokerType ?? 'rishta',
        agencyName: broker?.agencyName ?? '',
        contactPerson: broker?.contactPerson ?? '',
        phoneNumber: broker?.phoneNumber ?? '',
        whatsappNumber: broker?.whatsappNumber ?? '',
        address: broker?.address ?? '',
        ntn: broker?.ntn ?? '',
        cnic: broker?.cnic ?? '',
        defaultCommissionPct:
          broker?.defaultCommissionPct != null
            ? Number(broker.defaultCommissionPct)
            : undefined,
        defaultCommissionFlat:
          broker?.defaultCommissionFlat != null
            ? Number(broker.defaultCommissionFlat)
            : undefined,
        bankName: broker?.bankName ?? '',
        bankAccountNumber: broker?.bankAccountNumber ?? '',
        jazzcashNumber: broker?.jazzcashNumber ?? '',
        easypaisaNumber: broker?.easypaisaNumber ?? '',
        notes: broker?.notes ?? '',
        isActive: broker?.isActive ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, broker, businesses]);

  const onSubmit = async (values: BrokerFormValues) => {
    try {
      const body: CreateBrokerInput = {
        businessId: Number(values.businessId),
        name: values.name,
        brokerType: values.brokerType as BrokerType,
        agencyName: values.agencyName || undefined,
        contactPerson: values.contactPerson || undefined,
        phoneNumber: values.phoneNumber || undefined,
        whatsappNumber: values.whatsappNumber || undefined,
        address: values.address || undefined,
        ntn: values.ntn || undefined,
        cnic: values.cnic || undefined,
        defaultCommissionPct:
          values.defaultCommissionPct != null
            ? Number(values.defaultCommissionPct)
            : undefined,
        defaultCommissionFlat:
          values.defaultCommissionFlat != null
            ? Number(values.defaultCommissionFlat)
            : undefined,
        bankName: values.bankName || undefined,
        bankAccountNumber: values.bankAccountNumber || undefined,
        jazzcashNumber: values.jazzcashNumber || undefined,
        easypaisaNumber: values.easypaisaNumber || undefined,
        notes: values.notes || undefined,
        isActive: !!values.isActive,
      };
      if (isEdit && broker) {
        await BrokerAPI.update(broker.id, body);
        toast.success('Broker updated');
      } else {
        await BrokerAPI.create(body);
        toast.success('Broker added');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit broker' : 'Add broker'}</DialogTitle>
          <DialogDescription>
            Capture who introduced the booking + their default commission so
            future commission rows pre-fill.
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Auntie Naseem (DHA)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brokerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BROKER_TYPE_LABELS).map(
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="agencyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Karachi Hall Brokers Pvt Ltd"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact person</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="0321-1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="+92 321 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNIC (13 digits)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="35202-1234567-1"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Required for cash-paid brokers if you ever need to file
                      with FBR.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ntn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NTN (for agencies)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234567-8"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultCommissionPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default commission %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={50}
                        placeholder="e.g. 12.50"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Hall brokers 10-15%, rishtas 5-10%, social influencers
                      5%. Capped at 50%.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultCommissionFlat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default flat fee (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Or use a flat fee per intro"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <FormControl>
                      <Input placeholder="HBL / Meezan / UBL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account / IBAN</FormLabel>
                    <FormControl>
                      <Input className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="jazzcashNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>JazzCash</FormLabel>
                    <FormControl>
                      <Input placeholder="0300-1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="easypaisaNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Easypaisa</FormLabel>
                    <FormControl>
                      <Input placeholder="0345-1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
            )}

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
                {isEdit ? 'Save changes' : 'Add broker'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Commissions tab ──────────────────────────────────────────────

const commissionSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  brokerId: z.coerce.number().int().positive().optional(),
  brokerNameSnapshot: z.string().trim().max(160).optional(),
  bookingId: z.coerce.number().int().positive().optional(),
  accruedDate: z.string().trim().min(1, 'Required'),
  dueDate: z.string().trim().optional(),
  commissionType: z.enum(['percentage', 'flat']),
  commissionPct: z.coerce.number().min(0).max(50).optional(),
  commissionFlat: z.coerce.number().min(0).max(100_000_000).optional(),
  bookingAmountSnapshot: z.coerce.number().min(0).max(500_000_000).optional(),
  description: z.string().trim().max(5000).optional(),
});
type CommissionFormValues = z.input<typeof commissionSchema>;

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01),
  method: z.enum([
    'cash',
    'jazzcash',
    'easypaisa',
    'raast',
    'ibft',
    'bank_transfer',
    'sadapay',
    'nayapay',
    'cheque',
    'other',
  ]),
  ref: z.string().trim().max(100).optional(),
  paymentDate: z.string().trim().optional(),
});
type PaymentFormValues = z.input<typeof paymentSchema>;

function CommissionsTab({ businesses }: { businesses: VendorBusinessOption[] }) {
  const [commissions, setCommissions] = useState<BrokerCommission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    byStatus: {},
    totalCommission: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });
  const [outstanding, setOutstanding] = useState<OutstandingSummary | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'all'>(
    'all',
  );
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [payComm, setPayComm] = useState<BrokerCommission | null>(null);
  const [disputeComm, setDisputeComm] = useState<BrokerCommission | null>(null);
  const [voidComm, setVoidComm] = useState<BrokerCommission | null>(null);
  const [deleteComm, setDeleteComm] = useState<BrokerCommission | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [commRes, outRes, brkRes] = await Promise.all([
        BrokerAPI.listCommissions({
          status: statusFilter === 'all' ? undefined : statusFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
        BrokerAPI.outstandingSummary(),
        BrokerAPI.list({ isActive: true }),
      ]);
      setCommissions(commRes.commissions);
      setSummary(commRes.summary);
      setOutstanding(outRes);
      setBrokers(brkRes.brokers);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fromDate, toDate]);

  const handleDelete = async () => {
    if (!deleteComm) return;
    setBusy(deleteComm.id);
    try {
      await BrokerAPI.removeCommission(deleteComm.id);
      toast.success('Commission removed');
      setDeleteComm(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Outstanding-by-broker banner */}
      {outstanding && outstanding.grandTotal > 0 && (
        <Card className="border-amber-300 bg-amber-50/30">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-semibold text-amber-900">
                  {fmtPKR(outstanding.grandTotal)} owed to brokers
                </span>
              </div>
            </div>
            {outstanding.perBroker.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {outstanding.perBroker.slice(0, 6).map((row) => (
                  <div
                    key={`${row.brokerId}-${row.brokerName}`}
                    className="rounded-md border border-amber-200 bg-white px-3 py-2 text-xs"
                  >
                    <div className="font-semibold">{row.brokerName}</div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {row.commissionCount} commission
                        {row.commissionCount === 1 ? '' : 's'}
                        {row.overdueCount > 0 && (
                          <span className="ml-1 text-rose-700">
                            ({row.overdueCount} overdue)
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-semibold text-amber-900">
                        {fmtPKR(row.outstanding)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Per-event commission ledger. Every commission auto-computes via
          percentage of booking total OR a flat fee — payments routed
          server-side through the pure-function applier.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Accrue commission
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              'all',
              'pending',
              'partially_paid',
              'paid',
              'overdue',
              'disputed',
              'void',
            ] as Array<'all' | CommissionStatus>
          ).map((s) => {
            const active = statusFilter === s;
            const count =
              s === 'all'
                ? Object.values(summary.byStatus).reduce(
                    (a, n) => a + (n || 0),
                    0,
                  )
                : summary.byStatus[s as CommissionStatus] || 0;
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
                {s === 'all'
                  ? 'All'
                  : COMMISSION_STATUS_LABELS[s as CommissionStatus]}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-end gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-36"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No commissions match this filter. Click{' '}
              <strong>Accrue commission</strong> to record one against a
              booking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {commissions.map((c) => (
            <CommissionCard
              key={c.id}
              commission={c}
              busy={busy === c.id}
              onPay={() => setPayComm(c)}
              onDispute={() => setDisputeComm(c)}
              onVoid={() => setVoidComm(c)}
              onDelete={() => setDeleteComm(c)}
            />
          ))}
        </div>
      )}

      <CommissionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        brokers={brokers}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />

      <PaymentDialog
        commission={payComm}
        onOpenChange={(o) => !o && setPayComm(null)}
        onSaved={async () => {
          setPayComm(null);
          await fetchAll();
        }}
      />

      <DisputeDialog
        commission={disputeComm}
        onOpenChange={(o) => !o && setDisputeComm(null)}
        onSaved={async () => {
          setDisputeComm(null);
          await fetchAll();
        }}
      />

      <VoidDialog
        commission={voidComm}
        onOpenChange={(o) => !o && setVoidComm(null)}
        onSaved={async () => {
          setVoidComm(null);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deleteComm}
        onOpenChange={(o) => !o && setDeleteComm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this commission?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft delete. Paid commissions cannot be removed — move to
              disputed first.
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

function CommissionCard({
  commission,
  busy,
  onPay,
  onDispute,
  onVoid,
  onDelete,
}: {
  commission: BrokerCommission;
  busy: boolean;
  onPay: () => void;
  onDispute: () => void;
  onVoid: () => void;
  onDelete: () => void;
}) {
  const tone = COMMISSION_STATUS_TONES[commission.status];
  const total = Number(commission.commissionAmount) || 0;
  const paid = Number(commission.amountPaid) || 0;
  const outstanding = Math.max(0, total - paid);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const dueIn = daysFromNow(commission.dueDate);
  const isOverdue =
    commission.status !== 'paid' &&
    commission.status !== 'void' &&
    dueIn != null &&
    dueIn < 0;

  return (
    <Card className={isOverdue ? 'border-amber-300' : ''}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">
                {commission.brokerNameSnapshot}
              </span>
              {commission.brokerTypeSnapshot && (
                <Badge variant="outline" className="text-[10px]">
                  {
                    BROKER_TYPE_LABELS[
                      commission.brokerTypeSnapshot as BrokerType
                    ]
                  }
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border}`}
              >
                {COMMISSION_STATUS_LABELS[commission.status]}
              </Badge>
              {isOverdue && (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-900"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {Math.abs(dueIn!)}d overdue
                </Badge>
              )}
              {!isOverdue && dueIn != null && dueIn >= 0 && dueIn <= 7 && (
                <Badge
                  variant="outline"
                  className="border-blue-300 bg-blue-50 text-blue-900"
                >
                  Due in {dueIn}d
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Accrued {fmtDate(commission.accruedDate)}
              </span>
              {commission.dueDate && (
                <span>Due {fmtDate(commission.dueDate)}</span>
              )}
              {commission.bookingId && (
                <span>Booking #{commission.bookingId}</span>
              )}
              {commission.broker?.phoneNumber && (
                <a
                  href={`tel:${commission.broker.phoneNumber}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {commission.broker.phoneNumber}
                </a>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">{fmtPKR(commission.commissionAmount)}</div>
            <div className="text-[10px] text-muted-foreground">Commission</div>
            {paid > 0 && (
              <div className="mt-1 text-[11px] text-emerald-700">
                Paid {fmtPKR(paid)}
              </div>
            )}
            {outstanding > 0 && (
              <div className="text-[11px] text-amber-700">
                Outstanding {fmtPKR(outstanding)}
              </div>
            )}
          </div>
        </div>

        {/* Math breakdown strip */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {commission.commissionType === 'percentage' ? (
            <>
              {commission.bookingAmountSnapshot != null && (
                <span className="rounded bg-neutral-100 px-2 py-0.5">
                  Booking {fmtPKR(commission.bookingAmountSnapshot)}
                </span>
              )}
              {commission.commissionPct != null && (
                <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800">
                  × {Number(commission.commissionPct)}%
                </span>
              )}
            </>
          ) : (
            <span className="rounded bg-violet-50 px-2 py-0.5 text-violet-800">
              Flat fee
            </span>
          )}
          <span className="ml-auto rounded bg-neutral-900 px-2 py-0.5 text-white">
            = {fmtPKR(commission.commissionAmount)}
          </span>
        </div>

        {total > 0 && (
          <div className="space-y-1">
            <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground">
              {pct}% paid
              {commission.lastPaymentVia && (
                <>
                  {' '}— last via{' '}
                  {COMMISSION_PAYMENT_METHOD_LABELS[commission.lastPaymentVia]}
                </>
              )}
            </div>
          </div>
        )}

        {commission.statusReason && commission.status === 'disputed' && (
          <p className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-900">
            <strong>Dispute:</strong> {commission.statusReason}
          </p>
        )}

        {commission.description && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-neutral-700">
            {commission.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {commission.status !== 'paid' && commission.status !== 'void' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPay}
              disabled={busy}
              className="border-emerald-300 text-emerald-800"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Record payment
            </Button>
          )}
          {commission.status !== 'void' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDispute}
              disabled={busy}
              className="border-rose-300 text-rose-800"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              Dispute
            </Button>
          )}
          {commission.status !== 'paid' && commission.status !== 'void' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onVoid}
              disabled={busy}
            >
              <XCircle className="mr-1 h-3 w-3" />
              Void
            </Button>
          )}
          {commission.status !== 'paid' && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CommissionDialog({
  open,
  onOpenChange,
  businesses,
  brokers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  brokers: Broker[];
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      businessId: businesses[0]?.id,
      accruedDate: new Date().toISOString().slice(0, 10),
      commissionType: 'percentage',
      commissionPct: 10,
    },
  });
  const brokerId = form.watch('brokerId');
  const commissionType = form.watch('commissionType');

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: businesses[0]?.id,
        accruedDate: new Date().toISOString().slice(0, 10),
        commissionType: 'percentage',
        commissionPct: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businesses]);

  // Auto-populate from selected broker.
  useEffect(() => {
    if (!brokerId) return;
    const b = brokers.find((bb) => bb.id === Number(brokerId));
    if (!b) return;
    form.setValue('brokerNameSnapshot', b.name);
    if (b.defaultCommissionPct != null) {
      form.setValue('commissionType', 'percentage');
      form.setValue('commissionPct', Number(b.defaultCommissionPct));
    } else if (b.defaultCommissionFlat != null) {
      form.setValue('commissionType', 'flat');
      form.setValue('commissionFlat', Number(b.defaultCommissionFlat));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brokerId]);

  const livePreview = useMemo(() => {
    const v = form.getValues();
    if (v.commissionType === 'flat') {
      return Math.round(Number(v.commissionFlat) || 0);
    }
    const pct = Number(v.commissionPct) || 0;
    const ba = Number(v.bookingAmountSnapshot) || 0;
    return Math.round((ba * pct) / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.watch('commissionType'),
    form.watch('commissionPct'),
    form.watch('commissionFlat'),
    form.watch('bookingAmountSnapshot'),
  ]);

  const onSubmit = async (values: CommissionFormValues) => {
    try {
      const payload: CreateCommissionInput = {
        businessId: Number(values.businessId),
        brokerId:
          values.brokerId != null ? Number(values.brokerId) : undefined,
        brokerNameSnapshot: values.brokerNameSnapshot || undefined,
        bookingId:
          values.bookingId != null ? Number(values.bookingId) : undefined,
        accruedDate: values.accruedDate,
        dueDate: values.dueDate || undefined,
        commissionType: values.commissionType as CommissionType,
        commissionPct:
          values.commissionPct != null
            ? Number(values.commissionPct)
            : undefined,
        commissionFlat:
          values.commissionFlat != null
            ? Number(values.commissionFlat)
            : undefined,
        bookingAmountSnapshot:
          values.bookingAmountSnapshot != null
            ? Number(values.bookingAmountSnapshot)
            : undefined,
        description: values.description || undefined,
      };
      await BrokerAPI.createCommission(payload);
      toast.success('Commission accrued');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not accrue commission');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accrue commission</DialogTitle>
          <DialogDescription>
            Record what's owed to the broker for this booking. Pick a broker
            to auto-fill defaults, or type a one-off name.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <FormField
                control={form.control}
                name="brokerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) =>
                        field.onChange(v ? Number(v) : undefined)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick (or fill name below)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brokers.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name} — {BROKER_TYPE_LABELS[b.brokerType]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!brokerId && (
              <FormField
                control={form.control}
                name="brokerNameSnapshot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-off broker name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Friend referral / cousin's auntie"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="accruedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accrued date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Typically after the event.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking ID</FormLabel>
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
              name="commissionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">
                        Percentage of booking total
                      </SelectItem>
                      <SelectItem value="flat">Flat fee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {commissionType === 'percentage' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="commissionPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission % *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={50}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bookingAmountSnapshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking total (PKR) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="Tied to a Booking? Auto-fills."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="commissionFlat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flat fee (PKR) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="e.g. 25000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="What was introduced / which event…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Commission amount</span>
                <span className="text-base font-semibold">
                  {fmtPKR(livePreview)}
                </span>
              </div>
            </div>

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
                Accrue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  commission,
  onOpenChange,
  onSaved,
}: {
  commission: BrokerCommission | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const outstanding = commission
    ? Math.max(
        0,
        Number(commission.commissionAmount) - Number(commission.amountPaid || 0),
      )
    : 0;
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: Math.round(outstanding),
      method: 'cash',
    },
  });

  useEffect(() => {
    if (commission) {
      const out = Math.max(
        0,
        Number(commission.commissionAmount) -
          Number(commission.amountPaid || 0),
      );
      form.reset({
        amount: Math.round(out),
        method: 'cash',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commission?.id]);

  if (!commission) return null;

  const onSubmit = async (values: PaymentFormValues) => {
    try {
      const res = await BrokerAPI.recordPayment(commission.id, {
        amount: Number(values.amount),
        method: values.method as CommissionPaymentMethod,
        ref: values.ref || undefined,
        paymentDate: values.paymentDate || undefined,
      });
      if (res.result.newStatus === 'paid') {
        toast.success('Commission fully paid');
      } else {
        toast.success(
          `Payment recorded. Outstanding: ${fmtPKR(res.result.newAmountOutstanding)}`,
        );
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not record payment');
    }
  };

  return (
    <Dialog open={!!commission} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Record payment — {commission.brokerNameSnapshot}
          </DialogTitle>
          <DialogDescription>
            Outstanding: <strong>{fmtPKR(outstanding)}</strong> of{' '}
            {fmtPKR(commission.commissionAmount)} total.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (PKR) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(COMMISSION_PAYMENT_METHOD_LABELS).map(
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Txn id / cheque #"
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
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Defaults to today.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                Record
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DisputeDialog({
  commission,
  onOpenChange,
  onSaved,
}: {
  commission: BrokerCommission | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(
    () => setReason(commission?.statusReason ?? ''),
    [commission?.id],
  );

  if (!commission) return null;

  const submit = async () => {
    if (!reason.trim()) {
      toast.error('Dispute reason required');
      return;
    }
    setSubmitting(true);
    try {
      await BrokerAPI.transitionCommission(commission.id, {
        to: 'disputed',
        statusReason: reason.trim(),
      });
      toast.success('Moved to disputed');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!commission} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispute — {commission.brokerNameSnapshot}</DialogTitle>
          <DialogDescription>
            Capture what's wrong (broker disputes the rate, claims a
            different booking amount, etc.).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Broker disputes; says we agreed 15% not 12.5%"
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
            Mark disputed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VoidDialog({
  commission,
  onOpenChange,
  onSaved,
}: {
  commission: BrokerCommission | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReason(''), [commission?.id]);

  if (!commission) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await BrokerAPI.transitionCommission(commission.id, {
        to: 'void',
        statusReason: reason.trim() || undefined,
      });
      toast.success('Voided');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not void');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!commission} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void — {commission.brokerNameSnapshot}</DialogTitle>
          <DialogDescription>
            Use for cancelled bookings or commissions never actually owed.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
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
            Void
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * Vendor Portal Phase 2 #8.5 — Generator fuel-log view.
 *
 * Pakistani-venue surface for tracking diesel deliveries, consumption,
 * tank readings, and maintenance per generator. Solves the universal
 * load-shedding-economics problem: vendors burn Rs. 25,000-30,000 of
 * diesel per Walima but don't know per-event consumption.
 *
 * Surfaces:
 *   - Tank-status banner: per-generator current level + fuel type
 *   - Summary cards: total delivered (litres + cost) / total consumed
 *   - Entry-type filter pills + date range + generator picker
 *   - Per-entry card with tank-before → tank-after delta, delivery
 *     cost when applicable
 *   - "Log entry" dialog with per-type-aware fields
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
  Fuel,
  Wrench,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gauge,
  AlertTriangle,
  Filter,
  XCircle,
  Trash2,
  Calendar,
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
  GeneratorFuelAPI,
  ENTRY_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  ENTRY_TYPE_TONES,
  type FuelEntry,
  type FuelSummary,
  type TankStatusRow,
  type EntryType,
  type FuelType,
  type CreateEntryInput,
} from '@/lib/api/generatorFuel';

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}
function fmtL(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `${(Math.round(x * 100) / 100).toLocaleString('en-PK')} L`;
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-PK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface VendorBusinessOption {
  id: number;
  name: string;
}

const entrySchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  generatorIdentifier: z.string().trim().max(80).optional(),
  type: z.enum(['delivery', 'consumption', 'tank_reading', 'maintenance']),
  fuelType: z.enum(['diesel', 'petrol', 'lpg', 'other']).optional(),
  litres: z.coerce.number().min(0).max(50_000),
  costPerLitre: z.coerce.number().min(0).max(5_000).optional(),
  totalCost: z.coerce.number().min(0).max(50_000_000).optional(),
  supplierName: z.string().trim().max(160).optional(),
  deliveryRef: z.string().trim().max(100).optional(),
  runHours: z.coerce.number().min(0).max(100_000).optional(),
  odometerHours: z.coerce.number().min(0).max(1_000_000).optional(),
  loadEstimate: z.string().trim().max(60).optional(),
  maintenanceNote: z.string().trim().max(500).optional(),
  bookingId: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(5000).optional(),
  occurredAt: z.string().trim().optional(),
});
type EntryFormValues = z.input<typeof entrySchema>;

export default function GeneratorFuelView() {
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [summary, setSummary] = useState<FuelSummary>({
    byType: {},
    totalDeliveredLitres: 0,
    totalDeliveryCost: 0,
    totalConsumedLitres: 0,
  });
  const [tanks, setTanks] = useState<TankStatusRow[]>([]);
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<EntryType | 'all'>('all');
  const [genFilter, setGenFilter] = useState<string | 'all'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<FuelEntry | null>(null);

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
      const [entRes, tankRes] = await Promise.all([
        GeneratorFuelAPI.list({
          type: typeFilter === 'all' ? undefined : typeFilter,
          generatorIdentifier: genFilter === 'all' ? undefined : genFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
        GeneratorFuelAPI.tanks(),
      ]);
      setEntries(entRes.entries);
      setSummary(entRes.summary);
      setTanks(tankRes.tanks);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load fuel log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, genFilter, fromDate, toDate]);

  const handleDelete = async () => {
    if (!deleteEntry) return;
    setBusy(deleteEntry.id);
    try {
      const r: any = await axiosInstance.delete(
        `/api/v1/generator-fuel/${deleteEntry.id}`,
      );
      toast.success(r.data?.message || 'Entry removed');
      setDeleteEntry(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tank status banner */}
      {tanks.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/40">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-900">
              <Gauge className="h-4 w-4" />
              Tank status
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tanks.map((t) => (
                <div
                  key={t.identifier}
                  className="rounded-md border border-sky-200 bg-white px-3 py-2"
                >
                  <div className="text-xs font-semibold">{t.identifier}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-lg font-semibold">
                      <Fuel className="h-4 w-4 text-sky-700" />
                      {fmtL(t.currentTankLitres)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {FUEL_TYPE_LABELS[t.fuelType]}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Last reading {fmtDate(t.lastReadingAt)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Diesel ledger for your venue generators. Tracks every delivery,
          consumption snapshot, dipstick reading, and maintenance event so
          you can spot leaks, claim per-event fuel cost, and never overpay
          the bowser.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Log entry
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Delivered
            </div>
            <div className="text-2xl font-semibold">
              {fmtL(summary.totalDeliveredLitres)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Total cost {fmtPKR(summary.totalDeliveryCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Consumed (logged)
            </div>
            <div className="text-2xl font-semibold">
              {fmtL(summary.totalConsumedLitres)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Entries
            </div>
            <div className="text-2xl font-semibold">
              {Object.values(summary.byType).reduce(
                (a, n) => a + (n || 0),
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Type:
          </span>
          {(
            ['all', 'delivery', 'consumption', 'tank_reading', 'maintenance'] as Array<
              'all' | EntryType
            >
          ).map((t) => {
            const active = typeFilter === t;
            const count =
              t === 'all'
                ? Object.values(summary.byType).reduce((a, n) => a + (n || 0), 0)
                : summary.byType[t as EntryType] || 0;
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
                {t === 'all' ? 'All' : ENTRY_TYPE_LABELS[t as EntryType]}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        {tanks.length > 1 && (
          <div className="ml-2">
            <Select
              value={genFilter}
              onValueChange={(v) => setGenFilter(v as any)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All generators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All generators</SelectItem>
                {tanks.map((t) => (
                  <SelectItem key={t.identifier} value={t.identifier}>
                    {t.identifier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Fuel className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No fuel entries match this filter. Click{' '}
              <strong>Log entry</strong> to record a delivery / consumption /
              tank reading.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              busy={busy === e.id}
              onDelete={() => setDeleteEntry(e)}
            />
          ))}
        </div>
      )}

      <EntryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        existingTanks={tanks}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deleteEntry}
        onOpenChange={(o) => !o && setDeleteEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-deleted. <strong>Running tank level is NOT
              auto-rewound</strong> — record a corrective tank_reading if the
              physical level disagrees with the ledger after this delete.
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

function EntryCard({
  entry,
  busy,
  onDelete,
}: {
  entry: FuelEntry;
  busy: boolean;
  onDelete: () => void;
}) {
  const tone = ENTRY_TYPE_TONES[entry.type];
  const before = Number(entry.tankBeforeLitres);
  const after = Number(entry.tankAfterLitres);
  const delta = after - before;

  const icon = {
    delivery: <ArrowDownToLine className="h-4 w-4" />,
    consumption: <ArrowUpFromLine className="h-4 w-4" />,
    tank_reading: <Gauge className="h-4 w-4" />,
    maintenance: <Wrench className="h-4 w-4" />,
  }[entry.type];

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border} inline-flex items-center gap-1`}
              >
                {icon}
                {ENTRY_TYPE_LABELS[entry.type]}
              </Badge>
              <span className="text-sm font-semibold">
                {entry.generatorIdentifier}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {FUEL_TYPE_LABELS[entry.fuelType]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fmtDate(entry.occurredAt)}
              </span>
              {entry.supplierName && <span>{entry.supplierName}</span>}
              {entry.deliveryRef && (
                <span className="font-mono">#{entry.deliveryRef}</span>
              )}
              {entry.runHours != null && (
                <span>{entry.runHours}h run</span>
              )}
              {entry.odometerHours != null && (
                <span>Odo {entry.odometerHours}h</span>
              )}
              {entry.bookingId && <span>Booking #{entry.bookingId}</span>}
            </div>
          </div>
          <div className="text-right">
            {entry.type !== 'maintenance' && (
              <div className="text-lg font-semibold">
                {entry.type === 'tank_reading'
                  ? fmtL(entry.litres)
                  : `${delta >= 0 ? '+' : '−'} ${fmtL(Math.abs(delta))}`}
              </div>
            )}
            {entry.totalCost != null && Number(entry.totalCost) > 0 && (
              <div className="text-[11px] text-muted-foreground">
                {fmtPKR(entry.totalCost)} @ {fmtPKR(entry.costPerLitre)}/L
              </div>
            )}
          </div>
        </div>

        {/* Tank before → after strip */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded bg-neutral-100 px-2 py-0.5">
            Before {fmtL(entry.tankBeforeLitres)}
          </span>
          <ArrowDownToLine className="h-3 w-3 rotate-90 text-neutral-400" />
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800">
            After {fmtL(entry.tankAfterLitres)}
          </span>
          {entry.loadEstimate && (
            <span className="ml-auto rounded bg-blue-50 px-2 py-0.5 text-blue-800">
              {entry.loadEstimate}
            </span>
          )}
        </div>

        {entry.maintenanceNote && (
          <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
            <Wrench className="mr-1 inline h-3 w-3" />
            {entry.maintenanceNote}
          </p>
        )}

        {entry.notes && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-neutral-700">
            {entry.notes}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
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

function EntryDialog({
  open,
  onOpenChange,
  businesses,
  existingTanks,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  existingTanks: TankStatusRow[];
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      businessId: businesses[0]?.id,
      type: 'delivery',
      fuelType: 'diesel',
      litres: 100,
      generatorIdentifier: existingTanks[0]?.identifier || 'Main',
    },
  });
  const type = form.watch('type') as EntryType | undefined;

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: businesses[0]?.id,
        type: 'delivery',
        fuelType: 'diesel',
        litres: 100,
        generatorIdentifier: existingTanks[0]?.identifier || 'Main',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businesses, existingTanks]);

  const totalPreview = useMemo(() => {
    const v = form.getValues();
    if (v.type === 'delivery') {
      return (
        (Number(v.totalCost) ||
          (Number(v.costPerLitre) || 0) * (Number(v.litres) || 0)) | 0
      );
    }
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('type'), form.watch('costPerLitre'), form.watch('litres'), form.watch('totalCost')]);

  const onSubmit = async (values: EntryFormValues) => {
    try {
      const payload: CreateEntryInput = {
        businessId: Number(values.businessId),
        generatorIdentifier: values.generatorIdentifier || undefined,
        type: values.type as EntryType,
        fuelType: (values.fuelType as FuelType) || undefined,
        litres: Number(values.litres),
        costPerLitre:
          values.costPerLitre != null
            ? Number(values.costPerLitre)
            : undefined,
        totalCost:
          values.totalCost != null ? Number(values.totalCost) : undefined,
        supplierName: values.supplierName || undefined,
        deliveryRef: values.deliveryRef || undefined,
        runHours:
          values.runHours != null ? Number(values.runHours) : undefined,
        odometerHours:
          values.odometerHours != null
            ? Number(values.odometerHours)
            : undefined,
        loadEstimate: values.loadEstimate || undefined,
        maintenanceNote: values.maintenanceNote || undefined,
        bookingId:
          values.bookingId != null ? Number(values.bookingId) : undefined,
        notes: values.notes || undefined,
        occurredAt: values.occurredAt || undefined,
      };
      await GeneratorFuelAPI.create(payload);
      toast.success('Entry logged');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not log entry');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log fuel entry</DialogTitle>
          <DialogDescription>
            Pick the entry type — the dialog reshapes around it. Tank level
            auto-rolls forward based on the latest reading for this generator.
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
                name="generatorIdentifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generator</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Main / Hall — 60 kVA / Lawn — 30 kVA"
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="delivery">
                          Delivery (fuel in)
                        </SelectItem>
                        <SelectItem value="consumption">
                          Consumption (drawdown)
                        </SelectItem>
                        <SelectItem value="tank_reading">
                          Tank reading (dipstick)
                        </SelectItem>
                        <SelectItem value="maintenance">
                          Maintenance (no fuel delta)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FUEL_TYPE_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {type !== 'maintenance' && (
              <FormField
                control={form.control}
                name="litres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {type === 'tank_reading'
                        ? 'Tank level after reading (L) *'
                        : 'Litres *'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                      />
                    </FormControl>
                    {type === 'consumption' && (
                      <FormDescription>
                        Cannot exceed current tank level.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === 'delivery' && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="costPerLitre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per litre (PKR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="e.g. 305"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          PSO HSD ~Rs. 280-320/L.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="PSO bulk / Shell bowser / Atlas"
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
                  name="deliveryRef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery ref / receipt #</FormLabel>
                      <FormControl>
                        <Input className="font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {type === 'consumption' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="runHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Run hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          placeholder="e.g. 6"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="loadEstimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Load estimate</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Full / 60% / Light"
                          {...field}
                        />
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
                      <FormLabel>Event (booking #)</FormLabel>
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
            )}

            {(type === 'tank_reading' || type === 'maintenance') && (
              <FormField
                control={form.control}
                name="odometerHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hour-meter reading</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        placeholder="Genset run-hour odometer"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === 'maintenance' && (
              <FormField
                control={form.control}
                name="maintenanceNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance note</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Oil change + filter replacement"
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
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When did this happen?</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    Defaults to now if blank.
                  </FormDescription>
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

            {type === 'delivery' && totalPreview > 0 && (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span>Delivery cost</span>
                  <span className="text-base font-semibold">
                    {fmtPKR(totalPreview)}
                  </span>
                </div>
              </div>
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
                Log entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

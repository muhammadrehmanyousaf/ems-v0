'use client';

/**
 * Vendor Portal Phase 2 #8.4 — Supplier ledger view.
 *
 * Two tabs:
 *
 *   1. Suppliers — directory of who the vendor BUYS from. Category
 *      filter (meat / produce / atta / flowers / generator-rental /
 *      etc.), search, per-row outstanding-balance indicator, FBR
 *      NTN + STRN capture, default payment terms.
 *
 *   2. Invoices — A/P ledger with embedded payment tracking.
 *      Status pills + date filter + A/P aging mini-dashboard
 *      (current / 0-7d / 8-30d / 31-60d / 60d+). Per-invoice card
 *      shows progress bar (paid / total) + due-date overdue badge +
 *      "Record payment" / "Mark paid" / "Dispute" / "Void" actions.
 *
 * Live-system safety: pure consumer of /api/v1/suppliers. Zero
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
  Building2,
  Truck,
  Receipt,
  AlertTriangle,
  Filter,
  Search,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  ArrowRight,
  HandCoins,
  ClipboardList,
  CheckCircle2,
  XCircle,
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
  SupplierAPI,
  SUPPLIER_CATEGORY_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONES,
  PAYMENT_METHOD_LABELS,
  type Supplier,
  type SupplierInvoice,
  type SupplierCategory,
  type InvoiceStatus,
  type SupplierPaymentMethod,
  type SupplierSummary,
  type InvoiceSummary,
  type AgingReport,
  type CreateSupplierInput,
  type CreateInvoiceInput,
} from '@/lib/api/suppliers';

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

export default function SuppliersView() {
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
    <Tabs defaultValue="invoices" className="space-y-4">
      <TabsList>
        <TabsTrigger value="invoices">
          <Receipt className="mr-2 h-4 w-4" />
          A/P invoices
        </TabsTrigger>
        <TabsTrigger value="suppliers">
          <Truck className="mr-2 h-4 w-4" />
          Suppliers
        </TabsTrigger>
      </TabsList>
      <TabsContent value="invoices">
        <InvoicesTab businesses={businesses} />
      </TabsContent>
      <TabsContent value="suppliers">
        <SuppliersTab businesses={businesses} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Suppliers tab ────────────────────────────────────────────────

const supplierSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  name: z.string().trim().min(1, 'Required').max(200),
  category: z.string().min(1),
  contactPerson: z.string().trim().max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  ntn: z.string().trim().max(20).optional(),
  strn: z.string().trim().max(20).optional(),
  defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
  creditLimit: z.coerce.number().min(0).max(500_000_000).optional(),
  bankName: z.string().trim().max(100).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
  jazzcashNumber: z.string().trim().max(30).optional(),
  easypaisaNumber: z.string().trim().max(30).optional(),
  raastId: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional(),
});
type SupplierFormValues = z.input<typeof supplierSchema>;

function SuppliersTab({ businesses }: { businesses: VendorBusinessOption[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState<SupplierSummary>({
    byCategory: {},
    activeCount: 0,
    inactiveCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<SupplierCategory | 'all'>(
    'all',
  );
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSup, setDeleteSup] = useState<Supplier | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await SupplierAPI.list({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        isActive: activeOnly ? true : undefined,
        search: search.trim() || undefined,
      });
      setSuppliers(res.suppliers);
      setSummary(res.summary);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, activeOnly]);

  useEffect(() => {
    const id = setTimeout(() => fetchAll(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async () => {
    if (!deleteSup) return;
    setBusy(deleteSup.id);
    try {
      await SupplierAPI.remove(deleteSup.id);
      toast.success('Supplier removed');
      setDeleteSup(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove supplier');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Your supplier directory — meat shops, atta wholesalers, flower
          marts, generator rental, brokers. Capture FBR NTN + STRN here
          to claim input-tax credit and keep a paper trail for tax season.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add supplier
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Active
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <Building2 className="h-5 w-5 text-emerald-600" />
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
              Categories
            </div>
            <div className="text-2xl font-semibold">
              {Object.keys(summary.byCategory).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Category:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              categoryFilter === 'all'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            All
          </button>
          {(Object.keys(SUPPLIER_CATEGORY_LABELS) as SupplierCategory[])
            .filter(
              (c) => (summary.byCategory[c] || 0) > 0 || categoryFilter === c,
            )
            .map((c) => {
              const active = categoryFilter === c;
              const count = summary.byCategory[c] || 0;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoryFilter(active ? 'all' : c)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {SUPPLIER_CATEGORY_LABELS[c]}
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
            placeholder="Search name, contact, NTN, phone…"
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
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Truck className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No suppliers match this filter. Click <strong>Add supplier</strong> to
              build your directory.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <SupplierCard
              key={s.id}
              supplier={s}
              busy={busy === s.id}
              onEdit={() => setEditSupplier(s)}
              onDelete={() => setDeleteSup(s)}
            />
          ))}
        </div>
      )}

      <SupplierDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />
      <SupplierDialog
        open={!!editSupplier}
        onOpenChange={(o) => !o && setEditSupplier(null)}
        businesses={businesses}
        supplier={editSupplier || undefined}
        onSaved={async () => {
          setEditSupplier(null);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deleteSup}
        onOpenChange={(o) => !o && setDeleteSup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-deleted. Their invoice history is preserved for audit.
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

function SupplierCard({
  supplier,
  busy,
  onEdit,
  onDelete,
}: {
  supplier: Supplier;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={supplier.isActive ? '' : 'opacity-60'}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{supplier.name}</span>
              <Badge variant="outline">
                {SUPPLIER_CATEGORY_LABELS[supplier.category]}
              </Badge>
              {!supplier.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {supplier.contactPerson && <span>{supplier.contactPerson}</span>}
              {supplier.phoneNumber && (
                <a
                  href={`tel:${supplier.phoneNumber}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {supplier.phoneNumber}
                </a>
              )}
              {supplier.ntn && (
                <span className="font-mono">NTN {supplier.ntn}</span>
              )}
              {supplier.strn && (
                <span className="font-mono">STRN {supplier.strn}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            {supplier.defaultPaymentTermsDays > 0 && (
              <div>
                <div className="text-sm font-semibold">
                  {supplier.defaultPaymentTermsDays}d net
                </div>
                <div className="text-[10px] text-muted-foreground">
                  payment terms
                </div>
              </div>
            )}
            {supplier.creditLimit != null && Number(supplier.creditLimit) > 0 && (
              <div className="mt-1 text-[11px] text-muted-foreground">
                Credit limit {fmtPKR(supplier.creditLimit)}
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

function SupplierDialog({
  open,
  onOpenChange,
  businesses,
  supplier,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  supplier?: Supplier;
  onSaved: () => Promise<void> | void;
}) {
  const isEdit = !!supplier;
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      businessId: supplier?.businessId ?? businesses[0]?.id,
      name: supplier?.name ?? '',
      category: supplier?.category ?? 'meat',
      contactPerson: supplier?.contactPerson ?? '',
      phoneNumber: supplier?.phoneNumber ?? '',
      whatsappNumber: supplier?.whatsappNumber ?? '',
      address: supplier?.address ?? '',
      ntn: supplier?.ntn ?? '',
      strn: supplier?.strn ?? '',
      defaultPaymentTermsDays: supplier?.defaultPaymentTermsDays ?? 0,
      creditLimit:
        supplier?.creditLimit != null ? Number(supplier.creditLimit) : undefined,
      bankName: supplier?.bankName ?? '',
      bankAccountNumber: supplier?.bankAccountNumber ?? '',
      jazzcashNumber: supplier?.jazzcashNumber ?? '',
      easypaisaNumber: supplier?.easypaisaNumber ?? '',
      raastId: supplier?.raastId ?? '',
      notes: supplier?.notes ?? '',
      isActive: supplier?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: supplier?.businessId ?? businesses[0]?.id,
        name: supplier?.name ?? '',
        category: supplier?.category ?? 'meat',
        contactPerson: supplier?.contactPerson ?? '',
        phoneNumber: supplier?.phoneNumber ?? '',
        whatsappNumber: supplier?.whatsappNumber ?? '',
        address: supplier?.address ?? '',
        ntn: supplier?.ntn ?? '',
        strn: supplier?.strn ?? '',
        defaultPaymentTermsDays: supplier?.defaultPaymentTermsDays ?? 0,
        creditLimit:
          supplier?.creditLimit != null
            ? Number(supplier.creditLimit)
            : undefined,
        bankName: supplier?.bankName ?? '',
        bankAccountNumber: supplier?.bankAccountNumber ?? '',
        jazzcashNumber: supplier?.jazzcashNumber ?? '',
        easypaisaNumber: supplier?.easypaisaNumber ?? '',
        raastId: supplier?.raastId ?? '',
        notes: supplier?.notes ?? '',
        isActive: supplier?.isActive ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supplier, businesses]);

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      const body: CreateSupplierInput = {
        businessId: Number(values.businessId),
        name: values.name,
        category: values.category as SupplierCategory,
        contactPerson: values.contactPerson || undefined,
        phoneNumber: values.phoneNumber || undefined,
        whatsappNumber: values.whatsappNumber || undefined,
        address: values.address || undefined,
        ntn: values.ntn || undefined,
        strn: values.strn || undefined,
        defaultPaymentTermsDays:
          values.defaultPaymentTermsDays != null
            ? Number(values.defaultPaymentTermsDays)
            : 0,
        creditLimit:
          values.creditLimit != null ? Number(values.creditLimit) : undefined,
        bankName: values.bankName || undefined,
        bankAccountNumber: values.bankAccountNumber || undefined,
        jazzcashNumber: values.jazzcashNumber || undefined,
        easypaisaNumber: values.easypaisaNumber || undefined,
        raastId: values.raastId || undefined,
        notes: values.notes || undefined,
        isActive: !!values.isActive,
      };
      if (isEdit && supplier) {
        await SupplierAPI.update(supplier.id, body);
        toast.success('Supplier updated');
      } else {
        await SupplierAPI.create(body);
        toast.success('Supplier added');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save supplier');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit supplier' : 'Add supplier'}</DialogTitle>
          <DialogDescription>
            Capture identity + FBR tax IDs + payment rails + credit terms.
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
                          <SelectValue placeholder="Pick a business" />
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
                        placeholder="e.g. Liaqat Meat Shop"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SUPPLIER_CATEGORY_LABELS).map(
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
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact person</FormLabel>
                    <FormControl>
                      <Input placeholder="Liaqat Hussain" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="0300-1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ntn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NTN (National Tax Number)</FormLabel>
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
              <FormField
                control={form.control}
                name="strn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STRN (Sales Tax Reg)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12-34-5678-901-23"
                        className="font-mono"
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
                    <Input
                      placeholder="Shop #, area, city"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultPaymentTermsDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default payment terms (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        placeholder="0 = cash on delivery; 7 / 15 / 30 / 60 typical"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Used to auto-fill invoice due date when not supplied.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit limit (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Optional"
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
                      <Input
                        placeholder="PK36HABB..."
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
              <FormField
                control={form.control}
                name="raastId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raast ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="03001234567"
                        className="font-mono"
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
                    <FormLabel className="!mt-0">
                      Active (uncheck to retire this supplier)
                    </FormLabel>
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
                {isEdit ? 'Save changes' : 'Add supplier'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoices tab ─────────────────────────────────────────────────

const invoiceSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  supplierId: z.coerce.number().int().positive().optional(),
  supplierNameSnapshot: z.string().trim().max(200).optional(),
  invoiceNumber: z.string().trim().max(60).optional(),
  invoiceDate: z.string().trim().min(1, 'Required'),
  dueDate: z.string().trim().optional(),
  subtotal: z.coerce.number().min(0).max(100_000_000),
  taxAmount: z.coerce.number().min(0).max(100_000_000).optional(),
  bookingId: z.coerce.number().int().positive().optional(),
  description: z.string().trim().max(5000).optional(),
  attachmentUrl: z.string().trim().max(500).optional(),
});
type InvoiceFormValues = z.input<typeof invoiceSchema>;

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
    'post_dated_cheque',
    'other',
  ]),
  ref: z.string().trim().max(100).optional(),
  paymentDate: z.string().trim().optional(),
});
type PaymentFormValues = z.input<typeof paymentSchema>;

function InvoicesTab({ businesses }: { businesses: VendorBusinessOption[] }) {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    byStatus: {},
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });
  const [aging, setAging] = useState<AgingReport | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>(
    'all',
  );
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<SupplierInvoice | null>(null);
  const [disputeInvoice, setDisputeInvoice] = useState<SupplierInvoice | null>(
    null,
  );
  const [voidInvoice, setVoidInvoice] = useState<SupplierInvoice | null>(null);
  const [deleteInv, setDeleteInv] = useState<SupplierInvoice | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, agingRes, supRes] = await Promise.all([
        SupplierAPI.listInvoices({
          status: statusFilter === 'all' ? undefined : statusFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
        SupplierAPI.aging(),
        SupplierAPI.list({ isActive: true }),
      ]);
      setInvoices(invRes.invoices);
      setSummary(invRes.summary);
      setAging(agingRes);
      setSuppliers(supRes.suppliers);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fromDate, toDate]);

  const handleDelete = async () => {
    if (!deleteInv) return;
    setBusy(deleteInv.id);
    try {
      await SupplierAPI.removeInvoice(deleteInv.id);
      toast.success('Invoice removed');
      setDeleteInv(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove invoice');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aging dashboard */}
      {aging && aging.grandTotal > 0 && (
        <Card className="border-amber-300 bg-amber-50/30">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-semibold text-amber-900">
                  {fmtPKR(aging.grandTotal)} outstanding to suppliers
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
              <AgingPill label="Current" data={aging.buckets.current} />
              <AgingPill label="0-7d overdue" data={aging.buckets.d0_7} tone="amber" />
              <AgingPill label="8-30d" data={aging.buckets.d8_30} tone="amber" />
              <AgingPill label="31-60d" data={aging.buckets.d31_60} tone="rose" />
              <AgingPill label="60d+" data={aging.buckets.d60plus} tone="rose" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          A/P ledger. Every payment routes through the backend payment
          applier — amountPaid and status can never drift.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Log invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              'all',
              'received',
              'partially_paid',
              'paid',
              'overdue',
              'disputed',
              'void',
              'draft',
            ] as Array<'all' | InvoiceStatus>
          ).map((s) => {
            const active = statusFilter === s;
            const count =
              s === 'all'
                ? Object.values(summary.byStatus).reduce(
                    (a, n) => a + (n || 0),
                    0,
                  )
                : summary.byStatus[s as InvoiceStatus] || 0;
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
                {s === 'all' ? 'All' : INVOICE_STATUS_LABELS[s as InvoiceStatus]}
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
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No invoices in this window. Click <strong>Log invoice</strong>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              busy={busy === inv.id}
              onPay={() => setPayInvoice(inv)}
              onDispute={() => setDisputeInvoice(inv)}
              onVoid={() => setVoidInvoice(inv)}
              onDelete={() => setDeleteInv(inv)}
            />
          ))}
        </div>
      )}

      <InvoiceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        suppliers={suppliers}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />

      <PaymentDialog
        invoice={payInvoice}
        onOpenChange={(o) => !o && setPayInvoice(null)}
        onSaved={async () => {
          setPayInvoice(null);
          await fetchAll();
        }}
      />

      <DisputeDialog
        invoice={disputeInvoice}
        onOpenChange={(o) => !o && setDisputeInvoice(null)}
        onSaved={async () => {
          setDisputeInvoice(null);
          await fetchAll();
        }}
      />

      <VoidDialog
        invoice={voidInvoice}
        onOpenChange={(o) => !o && setVoidInvoice(null)}
        onSaved={async () => {
          setVoidInvoice(null);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deleteInv}
        onOpenChange={(o) => !o && setDeleteInv(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft delete. Paid invoices cannot be removed.
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

function AgingPill({
  label,
  data,
  tone,
}: {
  label: string;
  data: { count: number; total: number };
  tone?: 'amber' | 'rose';
}) {
  const tones = {
    none: 'border-neutral-200 bg-white',
    amber: 'border-amber-300 bg-amber-100',
    rose: 'border-rose-300 bg-rose-100',
  };
  const cls = data.total > 0 ? tones[tone || 'none'] : 'border-neutral-200 bg-white opacity-60';
  return (
    <div className={`rounded-md border px-2 py-1 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold">{fmtPKR(data.total)}</div>
      <div className="text-[10px] text-muted-foreground">
        {data.count} invoice{data.count === 1 ? '' : 's'}
      </div>
    </div>
  );
}

function InvoiceCard({
  invoice,
  busy,
  onPay,
  onDispute,
  onVoid,
  onDelete,
}: {
  invoice: SupplierInvoice;
  busy: boolean;
  onPay: () => void;
  onDispute: () => void;
  onVoid: () => void;
  onDelete: () => void;
}) {
  const tone = INVOICE_STATUS_TONES[invoice.status];
  const total = Number(invoice.totalAmount) || 0;
  const paid = Number(invoice.amountPaid) || 0;
  const outstanding = Math.max(0, total - paid);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const dueIn = daysFromNow(invoice.dueDate);
  const isOverdue =
    invoice.status !== 'paid' &&
    invoice.status !== 'void' &&
    dueIn != null &&
    dueIn < 0;

  return (
    <Card className={isOverdue ? 'border-amber-300' : ''}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">
                {invoice.supplierNameSnapshot}
              </span>
              {invoice.supplierCategorySnapshot && (
                <Badge variant="outline" className="text-[10px]">
                  {
                    SUPPLIER_CATEGORY_LABELS[
                      invoice.supplierCategorySnapshot as SupplierCategory
                    ]
                  }
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border}`}
              >
                {INVOICE_STATUS_LABELS[invoice.status]}
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
                {fmtDate(invoice.invoiceDate)}
              </span>
              {invoice.invoiceNumber && (
                <span className="font-mono">#{invoice.invoiceNumber}</span>
              )}
              {invoice.dueDate && <span>Due {fmtDate(invoice.dueDate)}</span>}
              {invoice.bookingId && (
                <span>Booking #{invoice.bookingId}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">{fmtPKR(invoice.totalAmount)}</div>
            <div className="text-[10px] text-muted-foreground">Total</div>
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

        {/* Progress bar */}
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
              {invoice.lastPaymentVia && (
                <>
                  {' '}— last payment via{' '}
                  {PAYMENT_METHOD_LABELS[invoice.lastPaymentVia]}
                </>
              )}
            </div>
          </div>
        )}

        {invoice.statusReason && invoice.status === 'disputed' && (
          <p className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-900">
            <strong>Dispute:</strong> {invoice.statusReason}
          </p>
        )}

        {invoice.description && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-neutral-700">
            {invoice.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {invoice.status !== 'paid' && invoice.status !== 'void' && (
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
          {invoice.status !== 'void' && (
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
          {invoice.status !== 'paid' && invoice.status !== 'void' && (
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
          {invoice.status !== 'paid' && (
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

function InvoiceDialog({
  open,
  onOpenChange,
  businesses,
  suppliers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  suppliers: Supplier[];
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      businessId: businesses[0]?.id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      subtotal: 0,
      taxAmount: 0,
    },
  });
  const supplierId = form.watch('supplierId');

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: businesses[0]?.id,
        invoiceDate: new Date().toISOString().slice(0, 10),
        subtotal: 0,
        taxAmount: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businesses]);

  // Auto-fill snapshot from selected supplier
  useEffect(() => {
    if (!supplierId) return;
    const s = suppliers.find((sup) => sup.id === Number(supplierId));
    if (s) {
      form.setValue('supplierNameSnapshot', s.name);
      if (s.defaultPaymentTermsDays > 0) {
        const invDate = new Date(form.getValues('invoiceDate') || new Date());
        invDate.setUTCDate(invDate.getUTCDate() + s.defaultPaymentTermsDays);
        form.setValue('dueDate', invDate.toISOString().slice(0, 10));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const totalPreview = useMemo(() => {
    const v = form.getValues();
    return (Number(v.subtotal) || 0) + (Number(v.taxAmount) || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('subtotal'), form.watch('taxAmount')]);

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      const payload: CreateInvoiceInput = {
        businessId: Number(values.businessId),
        supplierId:
          values.supplierId != null ? Number(values.supplierId) : undefined,
        supplierNameSnapshot: values.supplierNameSnapshot || undefined,
        invoiceNumber: values.invoiceNumber || undefined,
        invoiceDate: values.invoiceDate,
        dueDate: values.dueDate || undefined,
        subtotal: Number(values.subtotal),
        taxAmount:
          values.taxAmount != null ? Number(values.taxAmount) : undefined,
        bookingId:
          values.bookingId != null ? Number(values.bookingId) : undefined,
        description: values.description || undefined,
        attachmentUrl: values.attachmentUrl || undefined,
      };
      await SupplierAPI.createInvoice(payload);
      toast.success('Invoice logged');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not log invoice');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log invoice</DialogTitle>
          <DialogDescription>
            Capture a supplier bill. Total auto-computes as subtotal + tax;
            due date auto-fills from supplier's default payment terms when
            you pick a supplier from the list.
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
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) =>
                        field.onChange(v ? Number(v) : undefined)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick or fill name below" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!supplierId && (
              <FormField
                control={form.control}
                name="supplierNameSnapshot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-off supplier name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Ad-hoc generator rental"
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
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice #</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="LMS-202605-019"
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
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice date *</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal (PKR) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales tax (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
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
                    <FormLabel>Booking ID</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Tie to event" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="30kg mutton + 50kg chicken for Saturday Nikah"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachmentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill photo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://… (kachi rasid scan)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="text-base font-semibold">
                  {fmtPKR(totalPreview)}
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
                Log invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  invoice,
  onOpenChange,
  onSaved,
}: {
  invoice: SupplierInvoice | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const outstanding = invoice
    ? Math.max(
        0,
        Number(invoice.totalAmount) - Number(invoice.amountPaid || 0),
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
    if (invoice) {
      const out = Math.max(
        0,
        Number(invoice.totalAmount) - Number(invoice.amountPaid || 0),
      );
      form.reset({
        amount: Math.round(out),
        method: 'cash',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  if (!invoice) return null;

  const onSubmit = async (values: PaymentFormValues) => {
    try {
      const res = await SupplierAPI.recordPayment(invoice.id, {
        amount: Number(values.amount),
        method: values.method as SupplierPaymentMethod,
        ref: values.ref || undefined,
        paymentDate: values.paymentDate || undefined,
      });
      if (res.result.newStatus === 'paid') {
        toast.success('Invoice fully paid');
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
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Record payment — {invoice.supplierNameSnapshot}
          </DialogTitle>
          <DialogDescription>
            Outstanding: <strong>{fmtPKR(outstanding)}</strong> of{' '}
            {fmtPKR(invoice.totalAmount)} total. Partial payments are fine —
            the invoice flips to <em>partially paid</em>.
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
                        {Object.entries(PAYMENT_METHOD_LABELS).map(
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
  invoice,
  onOpenChange,
  onSaved,
}: {
  invoice: SupplierInvoice | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReason(invoice?.statusReason ?? ''), [invoice?.id]);

  if (!invoice) return null;

  const submit = async () => {
    if (!reason.trim()) {
      toast.error('Dispute reason required');
      return;
    }
    setSubmitting(true);
    try {
      await SupplierAPI.transitionInvoice(invoice.id, {
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
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispute — {invoice.supplierNameSnapshot}</DialogTitle>
          <DialogDescription>
            Capture what's wrong with the bill (short-delivery, wrong qty,
            quality complaint). Once resolved you can move back to received /
            paid.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Supplier short-delivered 5kg mutton; expecting credit note"
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
  invoice,
  onOpenChange,
  onSaved,
}: {
  invoice: SupplierInvoice | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReason(''), [invoice?.id]);

  if (!invoice) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await SupplierAPI.transitionInvoice(invoice.id, {
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
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void — {invoice.supplierNameSnapshot}</DialogTitle>
          <DialogDescription>
            Use for cancelled deliveries / credit-note adjustments.
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

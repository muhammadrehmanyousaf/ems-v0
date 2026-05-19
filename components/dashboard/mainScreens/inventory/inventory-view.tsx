'use client';

/**
 * Vendor Portal Phase 2 #8.1 — Inventory tracker view.
 *
 * Replaces the copy-pencil / Excel stock register that Pakistani
 * wedding vendors use today. Universal across category:
 *   - Caterer: chicken kg, mutton kg, oil litres, atta kg
 *   - Decor: mandap kits, gold chairs, sherwani lighting
 *   - Photographer: cameras, lenses, SD cards
 *   - Venue: toilet paper, soap, water bottles, gas refills
 *
 * Surfaces:
 *   - Summary strip: items tracked / low-stock count / total
 *     snapshot value (currentStock × lastRestockCostPerUnit)
 *   - Category filter chips with per-category count
 *   - Low-stock toggle
 *   - Search across name / SKU / supplier
 *   - Card list with per-row stock badge + low-stock warning + per-
 *     row "Record movement" button (opens a movement dialog that
 *     surfaces the right field set for the chosen type)
 *   - "Add item" dialog (Pakistani-specific category/unit pickers)
 *
 * Live-system safety: pure consumer of new /api/v1/inventory.
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
  Boxes,
  AlertTriangle,
  Building,
  Filter,
  Search,
  Trash2,
  Pencil,
  PackagePlus,
  PackageMinus,
  PackageX,
  ArrowLeftRight,
  ClipboardCheck,
  History,
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
  InventoryAPI,
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_UNIT_LABELS,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_TONES,
  CATEGORY_TONES,
  type InventoryItem,
  type InventoryCategory,
  type InventoryUnit,
  type InventorySummary,
  type CreateItemInput,
  type MovementType,
} from '@/lib/api/inventory';

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

function fmtStock(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  // 3-decimal max but trim trailing zeros.
  const s = (Math.round(x * 1000) / 1000).toString();
  return s;
}

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const t = new Date(iso).getTime();
    const diff = Math.round((Date.now() - t) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.round(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-PK');
  } catch {
    return iso;
  }
}

// ─── Schemas ──────────────────────────────────────────────────────

const itemSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  name: z.string().trim().min(1, 'Required').max(160),
  category: z.enum([
    'ingredient',
    'rental',
    'equipment',
    'consumable',
    'linen',
    'stationery',
    'other',
  ]),
  unit: z.enum([
    'piece',
    'dozen',
    'pair',
    'set',
    'kg',
    'gram',
    'litre',
    'ml',
    'metre',
    'bottle',
    'packet',
    'tray',
    'thaal',
    'tola',
    'box',
    'roll',
    'other',
  ]),
  sku: z.string().trim().max(60).optional(),
  currentStock: z.coerce.number().min(0).max(1_000_000).optional(),
  lowStockThreshold: z.coerce.number().min(0).max(1_000_000).optional(),
  reorderLeadTimeDays: z.coerce.number().int().min(0).max(365).optional(),
  lastRestockCostPerUnit: z.coerce.number().min(0).max(500_000_000).optional(),
  defaultSupplierName: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(5000).optional(),
});
type ItemFormValues = z.input<typeof itemSchema>;

const movementSchema = z.object({
  type: z.enum([
    'restock',
    'consumed',
    'wastage',
    'transfer_out',
    'transfer_in',
    'adjustment',
  ]),
  quantity: z.coerce.number().min(0).max(1_000_000),
  supplierName: z.string().trim().max(160).optional(),
  costPerUnit: z.coerce.number().min(0).max(500_000_000).optional(),
  reason: z.string().trim().max(200).optional(),
  bookingId: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(5000).optional(),
  occurredAt: z.string().trim().optional(),
});
type MovementFormValues = z.input<typeof movementSchema>;

// ─── Main view ────────────────────────────────────────────────────

interface VendorBusinessOption {
  id: number;
  name: string;
}

export default function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    byCategory: {},
    totalStockValue: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<
    InventoryCategory | 'all'
  >('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);

  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await InventoryAPI.listItems({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        lowStockOnly: lowStockOnly || undefined,
        search: search.trim() || undefined,
      });
      setItems(res.items || []);
      setSummary(
        res.summary || {
          byCategory: {},
          totalStockValue: 0,
          lowStockCount: 0,
        },
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, lowStockOnly]);

  useEffect(() => {
    const id = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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

  const totalItems = items.length;

  const handleDelete = async () => {
    if (!deleteItem) return;
    setBusy(deleteItem.id);
    try {
      await InventoryAPI.removeItem(deleteItem.id);
      toast.success('Item removed');
      setDeleteItem(null);
      await fetchItems();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove item');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          One place for every stock count — caterer ingredients, decor rental
          fleet, photographer kit, venue consumables. Movements are an
          immutable ledger; the running stock can only change through one.
        </p>
        <Button onClick={() => setAddItemOpen(true)} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" /> Add item
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Items tracked
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <Boxes className="h-5 w-5 text-neutral-500" />
              {totalItems}
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            summary.lowStockCount > 0
              ? 'border-amber-300 bg-amber-50/40'
              : ''
          }
        >
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Low stock
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <AlertTriangle
                className={`h-5 w-5 ${
                  summary.lowStockCount > 0
                    ? 'text-amber-600'
                    : 'text-neutral-400'
                }`}
              />
              {summary.lowStockCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Stock value (last-restock cost)
            </div>
            <div className="text-2xl font-semibold">
              {fmtPKR(summary.totalStockValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
          {(
            Object.keys(INVENTORY_CATEGORY_LABELS) as InventoryCategory[]
          ).map((cat) => {
            const active = categoryFilter === cat;
            const count = summary.byCategory[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(active ? 'all' : cat)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {INVENTORY_CATEGORY_LABELS[cat]}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setLowStockOnly((v) => !v)}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              lowStockOnly
                ? 'border-amber-500 bg-amber-100 text-amber-900'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            Low stock only
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, supplier…"
            className="pl-8"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Boxes className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No inventory items match this filter. Click <strong>Add
              item</strong> to start tracking your first stock keeping unit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              busy={busy === item.id}
              onRecordMovement={() => setMovementItem(item)}
              onEdit={() => setEditItem(item)}
              onDelete={() => setDeleteItem(item)}
            />
          ))}
        </div>
      )}

      {/* Add item dialog */}
      <ItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        businesses={businesses}
        onSaved={async () => {
          setAddItemOpen(false);
          await fetchItems();
        }}
      />

      {/* Edit item dialog */}
      <ItemDialog
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
        businesses={businesses}
        item={editItem || undefined}
        onSaved={async () => {
          setEditItem(null);
          await fetchItems();
        }}
      />

      {/* Record movement dialog */}
      <MovementDialog
        item={movementItem}
        onOpenChange={(o) => !o && setMovementItem(null)}
        onSaved={async () => {
          setMovementItem(null);
          await fetchItems();
        }}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this item?</AlertDialogTitle>
            <AlertDialogDescription>
              The item is soft-deleted and disappears from your inventory.
              The movement ledger stays in the database for audit. You can
              restore it later.
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

// ─── Item card ────────────────────────────────────────────────────

function ItemCard({
  item,
  busy,
  onRecordMovement,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  busy: boolean;
  onRecordMovement: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const current = Number(item.currentStock);
  const threshold = Number(item.lowStockThreshold);
  const isLow = threshold > 0 && current <= threshold;
  const unit = INVENTORY_UNIT_LABELS[item.unit];
  const catTone = CATEGORY_TONES[item.category];
  const stockValue = current * Number(item.lastRestockCostPerUnit || 0);

  return (
    <Card className={isLow ? 'border-amber-300' : ''}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{item.name}</span>
              <Badge
                variant="outline"
                className={`${catTone.bg} ${catTone.text} ${catTone.border}`}
              >
                {INVENTORY_CATEGORY_LABELS[item.category]}
              </Badge>
              {item.sku && (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {item.sku}
                </Badge>
              )}
              {isLow && (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-900"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Low stock
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {item.business?.name && (
                <span className="inline-flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {item.business.name}
                </span>
              )}
              {item.defaultSupplierName && (
                <span>Supplier: {item.defaultSupplierName}</span>
              )}
              {item.reorderLeadTimeDays != null && (
                <span>Lead time: {item.reorderLeadTimeDays}d</span>
              )}
              {item.lastRestockAt && (
                <span>Last restock: {fmtRelative(item.lastRestockAt)}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold leading-tight">
              {fmtStock(item.currentStock)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                {unit}
              </span>
            </div>
            {threshold > 0 && (
              <div className="text-[11px] text-muted-foreground">
                Reorder at {fmtStock(item.lowStockThreshold)} {unit}
              </div>
            )}
            {stockValue > 0 && (
              <div className="text-[11px] text-muted-foreground">
                {fmtPKR(stockValue)} on shelf
              </div>
            )}
          </div>
        </div>

        {item.notes && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-neutral-700">
            {item.notes}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onRecordMovement}
            disabled={busy}
          >
            <History className="mr-1 h-3 w-3" />
            Record movement
          </Button>
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

// ─── Item create/edit dialog ──────────────────────────────────────

function ItemDialog({
  open,
  onOpenChange,
  businesses,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  item?: InventoryItem;
  onSaved: () => Promise<void> | void;
}) {
  const isEdit = !!item;
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      businessId: item?.businessId ?? businesses[0]?.id,
      name: item?.name ?? '',
      category: item?.category ?? 'ingredient',
      unit: item?.unit ?? 'piece',
      sku: item?.sku ?? '',
      currentStock: item ? Number(item.currentStock) : 0,
      lowStockThreshold: item ? Number(item.lowStockThreshold) : 0,
      reorderLeadTimeDays: item?.reorderLeadTimeDays ?? undefined,
      lastRestockCostPerUnit:
        item?.lastRestockCostPerUnit != null
          ? Number(item.lastRestockCostPerUnit)
          : undefined,
      defaultSupplierName: item?.defaultSupplierName ?? '',
      notes: item?.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: item?.businessId ?? businesses[0]?.id,
        name: item?.name ?? '',
        category: item?.category ?? 'ingredient',
        unit: item?.unit ?? 'piece',
        sku: item?.sku ?? '',
        currentStock: item ? Number(item.currentStock) : 0,
        lowStockThreshold: item ? Number(item.lowStockThreshold) : 0,
        reorderLeadTimeDays: item?.reorderLeadTimeDays ?? undefined,
        lastRestockCostPerUnit:
          item?.lastRestockCostPerUnit != null
            ? Number(item.lastRestockCostPerUnit)
            : undefined,
        defaultSupplierName: item?.defaultSupplierName ?? '',
        notes: item?.notes ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, businesses]);

  const onSubmit = async (values: ItemFormValues) => {
    try {
      if (isEdit && item) {
        await InventoryAPI.updateItem(item.id, {
          name: values.name,
          category: values.category as InventoryCategory,
          unit: values.unit as InventoryUnit,
          sku: values.sku || null,
          lowStockThreshold: Number(values.lowStockThreshold || 0),
          reorderLeadTimeDays:
            values.reorderLeadTimeDays != null
              ? Number(values.reorderLeadTimeDays)
              : null,
          lastRestockCostPerUnit:
            values.lastRestockCostPerUnit != null
              ? Number(values.lastRestockCostPerUnit)
              : null,
          defaultSupplierName: values.defaultSupplierName || null,
          notes: values.notes || null,
        });
        toast.success('Item updated');
      } else {
        const payload: CreateItemInput = {
          businessId: Number(values.businessId),
          name: values.name,
          category: values.category as InventoryCategory,
          unit: values.unit as InventoryUnit,
          sku: values.sku || undefined,
          currentStock:
            values.currentStock != null ? Number(values.currentStock) : 0,
          lowStockThreshold:
            values.lowStockThreshold != null
              ? Number(values.lowStockThreshold)
              : 0,
          reorderLeadTimeDays:
            values.reorderLeadTimeDays != null
              ? Number(values.reorderLeadTimeDays)
              : undefined,
          lastRestockCostPerUnit:
            values.lastRestockCostPerUnit != null
              ? Number(values.lastRestockCostPerUnit)
              : undefined,
          defaultSupplierName: values.defaultSupplierName || undefined,
          notes: values.notes || undefined,
        };
        await InventoryAPI.createItem(payload);
        toast.success('Item added');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit item' : 'Add inventory item'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Item fields can change but the current stock count can only move via a movement (audit-trail safety).'
              : 'Set the starting stock count here. After that, every change must come through a movement so the ledger stays auditable.'}
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Mutton (boneless) / Gold chair / Canon 5D body"
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
                        {Object.entries(INVENTORY_CATEGORY_LABELS).map(
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(INVENTORY_UNIT_LABELS).map(
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
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="MEAT-MUT-BL"
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
                name="currentStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isEdit ? 'Current stock (read-only)' : 'Starting stock'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min={0}
                        disabled={isEdit}
                        {...field}
                      />
                    </FormControl>
                    {isEdit && (
                      <FormDescription>
                        Use “Record movement” to change stock.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low-stock threshold</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" min={0} {...field} />
                    </FormControl>
                    <FormDescription>
                      You'll see a warning when stock hits this level.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorderLeadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder lead time (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={365} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="lastRestockCostPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per unit (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="e.g. 2500"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Used to compute "stock value on shelf". Re-stamped on
                      every restock movement.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultSupplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default supplier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Liaqat Meat Shop / K-Electric / etc."
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
                    <Textarea
                      rows={2}
                      placeholder="Storage location, handling notes…"
                      {...field}
                    />
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
                {isEdit ? 'Save changes' : 'Add item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Movement dialog ──────────────────────────────────────────────

function MovementDialog({
  item,
  onOpenChange,
  onSaved,
}: {
  item: InventoryItem | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'restock',
      quantity: 0,
    },
  });
  const type = form.watch('type') as MovementType | undefined;

  useEffect(() => {
    if (item) {
      form.reset({ type: 'restock', quantity: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) return null;

  const unit = INVENTORY_UNIT_LABELS[item.unit];
  const current = Number(item.currentStock);

  const onSubmit = async (values: MovementFormValues) => {
    try {
      await InventoryAPI.createMovement({
        inventoryItemId: item.id,
        type: values.type as MovementType,
        quantity: Number(values.quantity),
        supplierName: values.supplierName || undefined,
        costPerUnit:
          values.costPerUnit != null
            ? Number(values.costPerUnit)
            : undefined,
        reason: values.reason || undefined,
        bookingId:
          values.bookingId != null
            ? Number(values.bookingId)
            : undefined,
        notes: values.notes || undefined,
        occurredAt: values.occurredAt || undefined,
      });
      toast.success('Movement recorded');
      await onSaved();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not record movement';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record movement — {item.name}</DialogTitle>
          <DialogDescription>
            Current stock:{' '}
            <span className="font-semibold">
              {fmtStock(item.currentStock)} {unit}
            </span>
            . Every stock change must come through one of these movement
            types — the ledger stays immutable.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="restock">
                        Restock (incoming from supplier)
                      </SelectItem>
                      <SelectItem value="consumed">
                        Consumed (used in event / daily ops)
                      </SelectItem>
                      <SelectItem value="wastage">
                        Wastage (damaged / expired / lost)
                      </SelectItem>
                      <SelectItem value="transfer_out">
                        Transfer out (sent away)
                      </SelectItem>
                      <SelectItem value="transfer_in">
                        Transfer in (received from elsewhere)
                      </SelectItem>
                      <SelectItem value="adjustment">
                        Stock-take (override to absolute count)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {type === 'adjustment'
                      ? `New absolute stock (${unit}) *`
                      : `Quantity (${unit}) *`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      min={0}
                      placeholder="e.g. 10"
                      {...field}
                    />
                  </FormControl>
                  {type === 'adjustment' ? (
                    <FormDescription>
                      This sets stock to the new absolute value — used for
                      physical stock-takes when the count disagrees with the
                      ledger.
                    </FormDescription>
                  ) : type === 'consumed' ||
                    type === 'wastage' ||
                    type === 'transfer_out' ? (
                    <FormDescription>
                      Cannot exceed current stock ({fmtStock(current)} {unit}).
                    </FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {(type === 'restock' || type === 'transfer_in') && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier / source</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            item.defaultSupplierName || 'e.g. Liaqat Meat Shop'
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per unit (PKR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="e.g. 2500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {(type === 'consumed' || type === 'wastage') && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bookingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Tie to a specific event"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            type === 'wastage'
                              ? 'e.g. expired, damaged in transit'
                              : 'e.g. main course Walima'
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                    Defaults to now if left blank.
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
                Record movement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

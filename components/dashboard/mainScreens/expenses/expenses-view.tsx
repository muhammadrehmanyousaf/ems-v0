'use client';

/**
 * Vendor Portal Phase 2 #8.3 — Expenses ledger view.
 *
 * Outflow tracking — the natural complement to the payment trio.
 * Every rupee spent: mandi cash, generator diesel, casual day-wages,
 * broker commissions. Tagged optionally to a booking so the per-event
 * P&L view (separate endpoint) can compute net profit.
 *
 * Surfaces:
 *   - Summary: total spent + per-category breakdown
 *   - Category filter
 *   - Card list (most recent first) with category badges + photo-
 *     receipt links + tagged-booking links
 *   - "Log expense" / "Edit" dialogs with category + payment-method
 *     pickers
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
  Wallet,
  Calendar,
  Pencil,
  Trash2,
  Filter,
  AlertTriangle,
  ReceiptText,
  Tag,
} from 'lucide-react';

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

import { LinkedFunctionSheetBadge } from '@/components/shared/linked-function-sheet-badge';
import {
  ExpensesAPI,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_TONES,
  EXPENSE_PAYMENT_METHOD_LABELS,
  type VendorExpense,
  type ExpenseCategory,
  type ExpensePaymentMethod,
  type ExpenseSummary,
  type CreateExpenseInput,
} from '@/lib/api/vendorExpenses';

const CATEGORIES: ExpenseCategory[] = [
  'ingredients',
  'fuel',
  'labour',
  'electricity',
  'rentals',
  'repairs',
  'marketing',
  'brokerage',
  'tax',
  'supplies',
  'transport',
  'other',
];

const PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'cash',
  'bank_transfer',
  'cheque',
  'jazzcash',
  'easypaisa',
  'raast',
  'ibft',
  'card',
  'other',
];

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Expense form ─────────────────────────────────────────────────

const schema = z.object({
  amount: z.string().refine((v) => Number(v) > 0, {
    message: 'Amount must be a positive number.',
  }),
  category: z.enum(CATEGORIES as [ExpenseCategory, ...ExpenseCategory[]]),
  subcategory: z.string().max(80).optional(),
  vendorName: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  spentDate: z.string().min(1, { message: 'Date is required.' }),
  paymentMethod: z
    .enum(PAYMENT_METHODS as [ExpensePaymentMethod, ...ExpensePaymentMethod[]])
    .optional(),
  photoUrl: z.string().url().or(z.literal('')).optional(),
  bookingId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: VendorExpense | null;
  onSaved: () => void;
}

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  open,
  onOpenChange,
  editing,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      amount: '',
      category: 'ingredients',
      subcategory: '',
      vendorName: '',
      description: '',
      spentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: undefined,
      photoUrl: '',
      bookingId: '',
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        amount: String(Number(editing.amount) || 0),
        category: editing.category,
        subcategory: editing.subcategory || '',
        vendorName: editing.vendorName || '',
        description: editing.description || '',
        spentDate: editing.spentDate,
        paymentMethod: editing.paymentMethod || undefined,
        photoUrl: editing.photoUrl || '',
        bookingId: editing.bookingId != null ? String(editing.bookingId) : '',
      });
    } else if (open) {
      form.reset({
        amount: '',
        category: 'ingredients',
        subcategory: '',
        vendorName: '',
        description: '',
        spentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: undefined,
        photoUrl: '',
        bookingId: '',
      });
    }
  }, [editing, open, form]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const body = {
        amount: Number(values.amount),
        category: values.category,
        subcategory: values.subcategory?.trim() || undefined,
        vendorName: values.vendorName?.trim() || undefined,
        description: values.description?.trim() || undefined,
        spentDate: values.spentDate,
        paymentMethod: values.paymentMethod,
        photoUrl: values.photoUrl?.trim() || undefined,
        bookingId: values.bookingId ? Number(values.bookingId) : null,
      } as CreateExpenseInput;
      if (editing) {
        await ExpensesAPI.update(editing.id, body);
        toast.success('Expense updated');
      } else {
        await ExpensesAPI.create(body);
        toast.success('Expense logged');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit expense' : 'Log an expense'}</DialogTitle>
          <DialogDescription>
            Mandi cash, generator diesel, casual day-wages — log it here as
            soon as it&apos;s spent so the per-event P&L stays accurate. Tag
            to a booking to count it against that booking&apos;s net profit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as never)}
            className="space-y-4 pt-2"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (Rs.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g. 15000"
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
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {EXPENSE_CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date spent</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid via (optional)</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) =>
                        field.onChange(v ? (v as ExpensePaymentMethod) : undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {EXPENSE_PAYMENT_METHOD_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier / vendor (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Liaqat Meat Shop, K-Electric"
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
                    <FormLabel>Booking ID (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Counts against this booking's P&L"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Leave blank for recurring overhead (rent, utilities).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => {
                // Issue #42 — when "Other" is picked, prompt the vendor to
                // describe the expense type so it doesn't just sit as a
                // generic "Other" row in the rollup. Field stays optional
                // for all other categories.
                const isOther = form.watch('category') === 'other';
                return (
                  <FormItem>
                    <FormLabel>
                      {isOther
                        ? 'What kind of expense is this? *'
                        : 'Sub-category (optional)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          isOther
                            ? 'e.g. Wedding gift for client, internet bill, license renewal'
                            : 'e.g. mutton + chicken, generator diesel'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Free-text — what was bought, why"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt photo URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://… (paper bill snap)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {editing ? 'Save' : 'Log expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main view ─────────────────────────────────────────────────────

const ExpensesView = () => {
  const [expenses, setExpenses] = useState<VendorExpense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorExpense | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<VendorExpense | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await ExpensesAPI.list(
        categoryFilter === 'all' ? {} : { category: categoryFilter },
      );
      setExpenses(res.expenses || []);
      setSummary(res.summary || { total: 0, byCategory: {} });
    } catch (e) {
      toast.error('Could not load expenses');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => expenses, [expenses]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: VendorExpense) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await ExpensesAPI.remove(confirmDelete.id);
      toast.success('Expense removed');
      setConfirmDelete(null);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  // Top 4 categories by spend for the summary cards (plus "Total").
  const topCategories: ExpenseCategory[] = useMemo(() => {
    if (!summary?.byCategory) return [];
    return (Object.entries(summary.byCategory) as Array<[ExpenseCategory, number]>)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 4)
      .map(([k]) => k);
  }, [summary]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Expenses</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-prose">
            Mandi cash, generator diesel, casual day-wages, broker commission,
            FBR tax — log every rupee spent here. Tag to a booking to count
            it against that booking&apos;s net profit (per-event P&L).
            Untagged expenses are recurring overhead.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Log expense
        </Button>
      </div>

      {/* Summary cards: Total + top 4 categories */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-bridal-cream/60 border-bridal-gold/40">
          <CardContent className="p-3">
            <p className="text-[10.5px] uppercase tracking-wider font-semibold text-bridal-gold-dark">
              Total spent
            </p>
            <p className="text-base font-semibold mt-1 tabular-nums">
              {fmtPKR(summary?.total || 0)}
            </p>
          </CardContent>
        </Card>
        {topCategories.map((cat) => {
          const tone = EXPENSE_CATEGORY_TONES[cat];
          return (
            <Card key={cat} className={`${tone.bg} ${tone.border}`}>
              <CardContent className="p-3">
                <p className={`text-[10.5px] uppercase tracking-wider font-semibold ${tone.text}`}>
                  {EXPENSE_CATEGORY_LABELS[cat]}
                </p>
                <p className="text-base font-semibold mt-1 tabular-nums">
                  {fmtPKR(summary?.byCategory?.[cat] || 0)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as ExpenseCategory | 'all')}
        >
          <SelectTrigger className="w-[240px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Wallet className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No expenses logged yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Log every rupee spent — mandi cash, generator diesel, casual
                labour, broker commission. Without this, your per-event P&L
                shows revenue but not net profit.
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Log your first expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const tone = EXPENSE_CATEGORY_TONES[row.category];
            return (
              <Card key={row.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-lg font-semibold tabular-nums">
                          {fmtPKR(row.amount)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] gap-1 ${tone.bg} ${tone.text} ${tone.border}`}
                        >
                          <Tag className="h-3 w-3" />
                          {EXPENSE_CATEGORY_LABELS[row.category]}
                        </Badge>
                        {row.paymentMethod && (
                          <Badge variant="outline" className="text-[10px]">
                            {EXPENSE_PAYMENT_METHOD_LABELS[row.paymentMethod]}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(row.spentDate)}
                        </span>
                        {row.vendorName && (
                          <span className="font-medium">→ {row.vendorName}</span>
                        )}
                        {row.subcategory && (
                          <span className="italic">· {row.subcategory}</span>
                        )}
                      </div>
                      {row.booking?.id && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[11px] text-muted-foreground">
                            Tagged to booking #{row.booking.id}
                            {row.booking.customerName ? ` (${row.booking.customerName})` : ''}
                          </p>
                          <LinkedFunctionSheetBadge bookingId={row.booking.id} variant="inline" />
                        </div>
                      )}
                      {row.description && (
                        <p className="text-[11px] text-muted-foreground italic">
                          &ldquo;{row.description}&rdquo;
                        </p>
                      )}
                      {row.photoUrl && (
                        <a
                          href={row.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary underline hover:no-underline inline-flex items-center gap-1"
                        >
                          <ReceiptText className="h-3 w-3" />
                          View receipt
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        aria-label="Edit expense"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(row)}
                        disabled={deletingId === row.id}
                        aria-label="Delete expense"
                      >
                        {deletingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={load}
      />
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Remove this expense?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Soft-delete only — Wedding Wala keeps the row so the audit
              trail survives. Use this if you logged a duplicate or the
              wrong amount.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpensesView;

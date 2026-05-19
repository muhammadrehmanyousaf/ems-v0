'use client';

/**
 * Vendor Portal Phase 1 #7.5 — Payment Receipt ledger view.
 *
 * Sibling to the PDC ledger. Where PDCs are cheques the vendor is
 * still HOLDING, receipts are payments that have already LANDED —
 * cash handovers, JazzCash, Easypaisa, Raast, IBFT, bank transfers.
 *
 * Surfaces:
 *   - Summary cards: total received this period + per-method
 *     breakdown (cash · JazzCash · Easypaisa · Raast · IBFT)
 *   - Method filter
 *   - Card list of receipts (most recent first) with method badge,
 *     amount, transaction ref (digital), notes, customer + booking
 *     links
 *   - Add receipt dialog with per-method-aware fields (cash hides
 *     the transactionRef field; digital methods require it)
 *
 * Live-system safety: pure consumer of /api/v1/receipts shipped in
 * this same release. No mutation of any existing surface.
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
  Banknote,
  Receipt,
  Smartphone,
  Building,
  Calendar,
  Pencil,
  Trash2,
  Filter,
  AlertTriangle,
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
  ReceiptsAPI,
  RECEIPT_METHOD_LABELS,
  RECEIPT_METHOD_TONES,
  RECEIPT_METHODS_NEEDING_REF,
  type PaymentReceipt,
  type ReceiptMethod,
  type ReceiptSummary,
  type CreateReceiptInput,
  type UpdateReceiptInput,
} from '@/lib/api/paymentReceipts';

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

// ─── Receipt form ──────────────────────────────────────────────────

const schema = z
  .object({
    method: z.enum(['cash', 'jazzcash', 'easypaisa', 'raast', 'ibft', 'bank_transfer', 'other']),
    amount: z.string().refine((v) => Number(v) > 0, {
      message: 'Amount must be a positive number.',
    }),
    receivedDate: z.string().min(1, { message: 'Date received is required.' }),
    transactionRef: z.string().optional(),
    photoUrl: z.string().url().or(z.literal('')).optional(),
    notes: z.string().max(2000).optional(),
    customerUserId: z.string().refine((v) => Number(v) > 0, {
      message: 'Customer user ID required (find from booking).',
    }),
    bookingId: z.string().optional(),
  })
  .refine(
    (data) =>
      !RECEIPT_METHODS_NEEDING_REF.includes(data.method) ||
      (data.transactionRef && data.transactionRef.trim().length > 0),
    {
      message: 'Transaction reference required for this payment method.',
      path: ['transactionRef'],
    },
  );

type FormValues = z.infer<typeof schema>;

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: PaymentReceipt | null;
  onSaved: () => void;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  open,
  onOpenChange,
  editing,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      method: 'cash',
      amount: '',
      receivedDate: new Date().toISOString().slice(0, 10),
      transactionRef: '',
      photoUrl: '',
      notes: '',
      customerUserId: '',
      bookingId: '',
    },
  });
  const watchMethod = form.watch('method');
  const needsRef = RECEIPT_METHODS_NEEDING_REF.includes(watchMethod);

  useEffect(() => {
    if (editing) {
      form.reset({
        method: editing.method,
        amount: String(Number(editing.amount) || 0),
        receivedDate: editing.receivedDate,
        transactionRef: editing.transactionRef || '',
        photoUrl: editing.photoUrl || '',
        notes: editing.notes || '',
        customerUserId: String(editing.customerUserId),
        bookingId: editing.bookingId != null ? String(editing.bookingId) : '',
      });
    } else if (open) {
      form.reset({
        method: 'cash',
        amount: '',
        receivedDate: new Date().toISOString().slice(0, 10),
        transactionRef: '',
        photoUrl: '',
        notes: '',
        customerUserId: '',
        bookingId: '',
      });
    }
  }, [editing, open, form]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const base = {
        method: values.method,
        amount: Number(values.amount),
        receivedDate: values.receivedDate,
        transactionRef: values.transactionRef?.trim() || undefined,
        photoUrl: values.photoUrl?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        bookingId: values.bookingId ? Number(values.bookingId) : null,
      };
      if (editing) {
        await ReceiptsAPI.update(editing.id, base as UpdateReceiptInput);
        toast.success('Receipt updated');
      } else {
        const body: CreateReceiptInput = {
          ...base,
          customerUserId: Number(values.customerUserId),
        };
        await ReceiptsAPI.create(body);
        toast.success('Receipt logged');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit receipt' : 'Log a payment received'}</DialogTitle>
          <DialogDescription>
            Cash, JazzCash, Easypaisa, Raast, IBFT, or bank transfer — log it
            here as soon as the payment lands so your outstanding-balance
            view stays accurate.
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
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="jazzcash">JazzCash</SelectItem>
                        <SelectItem value="easypaisa">Easypaisa</SelectItem>
                        <SelectItem value="raast">Raast</SelectItem>
                        <SelectItem value="ibft">Bank IBFT</SelectItem>
                        <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        placeholder="e.g. 50000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receivedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date received</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {needsRef && (
                <FormField
                  control={form.control}
                  name="transactionRef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction reference</FormLabel>
                      <FormControl>
                        <Input placeholder="From SMS / screenshot" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Required for {RECEIPT_METHOD_LABELS[watchMethod]}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {!editing && (
                <FormField
                  control={form.control}
                  name="customerUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer user ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="Copy from a booking"
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
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking ID (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g. 142"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Standalone receipts (advance against a quote) can skip this.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt photo URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://… (upload to your portfolio first)" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Paper chit photo for cash · JazzCash / Easypaisa screenshot
                    for digital. Strongly recommended for cash.
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="e.g. Advance handed over at office · against Walima booking"
                      {...field}
                    />
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
                {editing ? 'Save' : 'Log receipt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main view ─────────────────────────────────────────────────────

const methodIcon = (m: ReceiptMethod) => {
  if (m === 'cash') return Banknote;
  if (m === 'jazzcash' || m === 'easypaisa') return Smartphone;
  return Building;
};

const ReceiptsLedgerView = () => {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [summary, setSummary] = useState<ReceiptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<ReceiptMethod | 'all'>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentReceipt | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<PaymentReceipt | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReceiptsAPI.list(
        methodFilter === 'all' ? {} : { method: methodFilter },
      );
      setReceipts(res.receipts || []);
      setSummary(res.summary || { total: 0, byMethod: {} });
    } catch (e) {
      toast.error('Could not load receipts');
    } finally {
      setLoading(false);
    }
  }, [methodFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Already sorted by date desc on the backend; we keep that.
  const rows = useMemo(() => receipts, [receipts]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: PaymentReceipt) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await ReceiptsAPI.remove(confirmDelete.id);
      toast.success('Receipt removed');
      setConfirmDelete(null);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const summaryCards: Array<{ key: ReceiptMethod | 'all'; label: string }> = [
    { key: 'all', label: 'Total received' },
    { key: 'cash', label: 'Cash' },
    { key: 'jazzcash', label: 'JazzCash' },
    { key: 'easypaisa', label: 'Easypaisa' },
    { key: 'raast', label: 'Raast' },
    { key: 'ibft', label: 'IBFT / Bank' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Payment receipts</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-prose">
            Cash + JazzCash + Easypaisa + Raast + IBFT + bank transfers. Log
            every payment as soon as it lands so the outstanding-balance view
            on each booking stays accurate. Bounced cheques live in the{' '}
            <strong>Cheque ledger</strong> tab; card/Stripe payments record
            themselves automatically.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Log a receipt
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {summaryCards.map((s) => {
          const amt =
            s.key === 'all'
              ? summary?.total || 0
              : summary?.byMethod?.[s.key] || 0;
          const tone =
            s.key === 'all'
              ? { bg: 'bg-bridal-cream/60', text: 'text-bridal-gold-dark', border: 'border-bridal-gold/40' }
              : RECEIPT_METHOD_TONES[s.key as ReceiptMethod];
          return (
            <Card key={s.key} className={`${tone.bg} ${tone.border}`}>
              <CardContent className="p-3">
                <p
                  className={`text-[10.5px] uppercase tracking-wider font-semibold ${tone.text}`}
                >
                  {s.label}
                </p>
                <p className="text-base font-semibold mt-1 tabular-nums">{fmtPKR(amt)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select
          value={methodFilter}
          onValueChange={(v) => setMethodFilter(v as ReceiptMethod | 'all')}
        >
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="jazzcash">JazzCash</SelectItem>
            <SelectItem value="easypaisa">Easypaisa</SelectItem>
            <SelectItem value="raast">Raast</SelectItem>
            <SelectItem value="ibft">Bank IBFT</SelectItem>
            <SelectItem value="bank_transfer">Bank transfer</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
            <Receipt className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No receipts logged yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Log every cash handover + JazzCash / Easypaisa transfer +
                bank deposit. The outstanding-balance view on each booking
                stays accurate when this list is current.
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Log your first receipt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const tone = RECEIPT_METHOD_TONES[row.method];
            const Icon = methodIcon(row.method);
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
                          <Icon className="h-3 w-3" />
                          {RECEIPT_METHOD_LABELS[row.method]}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(row.receivedDate)}
                        </span>
                        {row.transactionRef && (
                          <span className="font-mono text-[10.5px] bg-muted px-1.5 py-0.5 rounded">
                            ref · {row.transactionRef}
                          </span>
                        )}
                      </div>
                      {row.customer?.fullName && (
                        <p className="text-[11px] text-muted-foreground">
                          From: <strong>{row.customer.fullName}</strong>
                          {row.customer.phoneNumber ? ` · ${row.customer.phoneNumber}` : ''}
                        </p>
                      )}
                      {row.booking?.id && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[11px] text-muted-foreground">
                            Linked to booking #{row.booking.id} ({fmtDate(row.booking.bookingDate)})
                          </p>
                          <LinkedFunctionSheetBadge bookingId={row.booking.id} variant="inline" />
                        </div>
                      )}
                      {row.notes && (
                        <p className="text-[11px] text-muted-foreground italic">
                          &ldquo;{row.notes}&rdquo;
                        </p>
                      )}
                      {row.photoUrl && (
                        <a
                          href={row.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary underline hover:no-underline"
                        >
                          View receipt photo →
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        aria-label="Edit receipt"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(row)}
                        disabled={deletingId === row.id}
                        aria-label="Delete receipt"
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

      <ReceiptDialog
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
              Remove this receipt?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Soft-delete only — Wedding Wala keeps the row so the audit
              trail survives. Use this if you logged the receipt by mistake
              (wrong booking, wrong amount, etc.).
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

export default ReceiptsLedgerView;

'use client';

/**
 * Vendor Portal Phase 1 #7.4 — Post-Dated Cheque ledger view.
 *
 * Pakistani wedding vendors hold dozens of post-dated cheques at any
 * given time. This view replaces the paper register or Excel sheet
 * they use today with a sortable, filterable, status-aware ledger.
 *
 * Surfaces:
 *   - Summary cards: PKR held + deposited + cleared + bounced
 *   - Filter chips: status, due-window
 *   - Card list (mobile-first, since vendors check this on the floor)
 *     with per-row actions to mark cheques deposited / cleared /
 *     bounced / cancelled — every status write goes through the
 *     backend's `pdcStatusTransition` helper (single source of truth)
 *   - "Add PDC" dialog (currently requires a booking id so we can
 *     auto-resolve the customer; standalone-PDC entry is a follow-up
 *     when the customer-record-by-id surface is ready)
 *
 * Live-system safety: pure consumer of the new /api/v1/pdcs endpoint
 * shipped in this same release. No mutation of any existing surface.
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
  Building,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Banknote,
  Filter,
  CheckCircle2,
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
  PdcAPI,
  PDC_STATUS_LABELS,
  PDC_STATUS_TONES,
  type PostDatedCheque,
  type PdcStatus,
  type PdcSummary,
  type CreatePdcInput,
  type UpdatePdcInput,
} from '@/lib/api/postDatedCheques';

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

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Create / Edit dialog ──────────────────────────────────────────

// Issue #41 — see receipts-ledger-view for the rationale. BE cdccdd2
// derives customerUserId from booking when it's omitted.
const baseSchema = z.object({
  chequeNumber: z
    .string()
    .regex(/^\d{4,20}$/, { message: 'Cheque number must be 4-20 digits.' }),
  bankName: z.string().min(2).max(120),
  branchCode: z.string().max(20).optional(),
  amount: z.string().refine((v) => Number(v) > 0, {
    message: 'Amount must be a positive number.',
  }),
  chequeDate: z.string().min(1, { message: 'Cheque date is required.' }),
  customerUserId: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v.trim()), {
      message: 'Customer ID must be a number (not an email or name).',
    }),
  bookingId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

const createSchema = baseSchema.refine(
  (data) =>
    (data.bookingId && data.bookingId.trim().length > 0) ||
    (data.customerUserId && Number(data.customerUserId) > 0),
  {
    message: 'Pick a booking — or enter a customer ID for a standalone PDC.',
    path: ['customerUserId'],
  },
);

type CreateFormValues = z.infer<typeof createSchema>;

const editSchema = baseSchema.omit({ customerUserId: true });
type EditFormValues = z.infer<typeof editSchema>;

interface PdcDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: PostDatedCheque | null;
  onSaved: () => void;
}

const PdcDialog: React.FC<PdcDialogProps> = ({ open, onOpenChange, editing, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(editing ? editSchema : createSchema) as never,
    defaultValues: {
      chequeNumber: '',
      bankName: '',
      branchCode: '',
      amount: '',
      chequeDate: '',
      customerUserId: '',
      bookingId: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        chequeNumber: editing.chequeNumber,
        bankName: editing.bankName,
        branchCode: editing.branchCode || '',
        amount: String(Number(editing.amount) || 0),
        chequeDate: editing.chequeDate,
        customerUserId: String(editing.customerUserId),
        bookingId: editing.bookingId != null ? String(editing.bookingId) : '',
        notes: editing.notes || '',
      });
    } else if (open) {
      form.reset({
        chequeNumber: '',
        bankName: '',
        branchCode: '',
        amount: '',
        chequeDate: new Date().toISOString().slice(0, 10),
        customerUserId: '',
        bookingId: '',
        notes: '',
      });
    }
  }, [editing, open, form]);

  const onSubmit = async (values: CreateFormValues) => {
    setSaving(true);
    try {
      if (editing) {
        const patch: UpdatePdcInput = {
          chequeNumber: values.chequeNumber,
          bankName: values.bankName,
          branchCode: values.branchCode?.trim() || null,
          amount: Number(values.amount),
          chequeDate: values.chequeDate,
          bookingId: values.bookingId ? Number(values.bookingId) : null,
          notes: values.notes?.trim() || null,
        };
        await PdcAPI.update(editing.id, patch);
        toast.success('PDC updated');
      } else {
        // Issue #41 — only send customerUserId for standalone PDCs.
        const trimmedCustomerId = (values.customerUserId || '').trim();
        const body = {
          chequeNumber: values.chequeNumber,
          bankName: values.bankName,
          branchCode: values.branchCode?.trim() || undefined,
          amount: Number(values.amount),
          chequeDate: values.chequeDate,
          customerUserId: trimmedCustomerId ? Number(trimmedCustomerId) : undefined,
          bookingId: values.bookingId ? Number(values.bookingId) : null,
          notes: values.notes?.trim() || undefined,
        } as CreatePdcInput;
        await PdcAPI.create(body);
        toast.success('PDC logged');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save PDC');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit cheque' : 'Log a new post-dated cheque'}</DialogTitle>
          <DialogDescription>
            Match the details on the cheque face exactly. Cheque number, bank,
            amount, and date are what your bank will validate on deposit day.
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
                name="chequeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cheque number</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="e.g. 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <FormControl>
                      <Input placeholder="HBL / Meezan / UBL / Allied …" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (Rs.)</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="e.g. 80000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chequeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date on cheque</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      The &quot;do not deposit before&quot; date on the cheque face.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branchCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch code (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="0234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!editing && !form.watch('bookingId') && (
                <FormField
                  control={form.control}
                  name="customerUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Only if no booking is picked"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Standalone PDC only. Most PDCs: pick a booking and
                        leave this blank.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="bookingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking ID (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" placeholder="e.g. 142" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Link this cheque to a specific booking. A standalone PDC
                    (covers multiple bookings, or an advance against a quote)
                    can be logged without one.
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
                      placeholder="e.g. Balance against Walima booking · post-dated 7 days pre-event"
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
                {editing ? 'Save' : 'Log cheque'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Transition dialog ─────────────────────────────────────────────

interface TransitionDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pdc: PostDatedCheque | null;
  target: PdcStatus | null;
  onSaved: () => void;
}

const TransitionDialog: React.FC<TransitionDialogProps> = ({
  open,
  onOpenChange,
  pdc,
  target,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const [depositDate, setDepositDate] = useState('');
  const [bounceReason, setBounceReason] = useState('');

  useEffect(() => {
    if (open && pdc && target) {
      setDepositDate(target === 'deposited' ? new Date().toISOString().slice(0, 10) : '');
      setBounceReason('');
    }
  }, [open, pdc, target]);

  if (!pdc || !target) return null;

  const onConfirm = async () => {
    if (target === 'deposited' && !depositDate) {
      toast.error('Deposit date is required');
      return;
    }
    if (target === 'bounced' && !bounceReason.trim()) {
      toast.error('Bounce reason is required');
      return;
    }
    setSaving(true);
    try {
      await PdcAPI.transition(pdc.id, {
        to: target,
        depositDate: depositDate || undefined,
        bounceReason: bounceReason.trim() || undefined,
      });
      toast.success(`Cheque marked ${PDC_STATUS_LABELS[target].toLowerCase()}`);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Transition failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark cheque {PDC_STATUS_LABELS[target].toLowerCase()}?</DialogTitle>
          <DialogDescription>
            Cheque #{pdc.chequeNumber} from {pdc.bankName} ·{' '}
            {fmtPKR(pdc.amount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {target === 'deposited' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Deposit date</label>
              <Input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Banks won&apos;t honour a deposit before the cheque face date
                ({fmtDate(pdc.chequeDate)}).
              </p>
            </div>
          )}
          {target === 'bounced' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Bounce reason</label>
              <Textarea
                rows={3}
                value={bounceReason}
                onChange={(e) => setBounceReason(e.target.value)}
                placeholder="e.g. Insufficient funds · Signature mismatch · Account closed"
              />
              <p className="text-[11px] text-muted-foreground">
                A bounced cheque under PKR 489-F is grounds for legal recovery —
                keep the bank&apos;s return memo with this record.
              </p>
            </div>
          )}
          {target === 'cleared' && (
            <p className="text-xs text-muted-foreground">
              Confirming the cheque cleared moves it to a terminal state. You
              won&apos;t be able to edit content fields after this.
            </p>
          )}
          {target === 'cancelled' && (
            <p className="text-xs text-muted-foreground">
              Cancelling marks the cheque as never-to-be-deposited (e.g.
              customer requested a replacement). Terminal — content fields
              lock after this.
            </p>
          )}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main view ─────────────────────────────────────────────────────

const PdcLedgerView = () => {
  const [pdcs, setPdcs] = useState<PostDatedCheque[]>([]);
  const [summary, setSummary] = useState<PdcSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PdcStatus | 'all'>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PostDatedCheque | null>(null);

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [transitionPdc, setTransitionPdc] = useState<PostDatedCheque | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<PdcStatus | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<PostDatedCheque | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await PdcAPI.list(
        statusFilter === 'all' ? {} : { status: statusFilter },
      );
      setPdcs(res.pdcs || []);
      setSummary(res.summary || { total: 0, byStatus: {} });
    } catch (e) {
      toast.error('Could not load PDC ledger');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Sort: held cheques due soonest first, then deposited (awaiting),
  // then closed states by date descending.
  const sorted = useMemo(() => {
    const order: Record<PdcStatus, number> = {
      held: 0,
      deposited: 1,
      bounced: 2,
      cleared: 3,
      cancelled: 4,
    };
    return [...pdcs].sort((a, b) => {
      const ao = order[a.status] ?? 99;
      const bo = order[b.status] ?? 99;
      if (ao !== bo) return ao - bo;
      const aDays = daysUntil(a.chequeDate) ?? 999999;
      const bDays = daysUntil(b.chequeDate) ?? 999999;
      return aDays - bDays;
    });
  }, [pdcs]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: PostDatedCheque) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const startTransition = (row: PostDatedCheque, target: PdcStatus) => {
    setTransitionPdc(row);
    setTransitionTarget(target);
    setTransitionOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await PdcAPI.remove(confirmDelete.id);
      toast.success('PDC removed');
      setConfirmDelete(null);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const summaryCards: Array<{ key: PdcStatus; label: string }> = [
    { key: 'held', label: 'Currently held' },
    { key: 'deposited', label: 'Awaiting clearance' },
    { key: 'cleared', label: 'Cleared (lifetime)' },
    { key: 'bounced', label: 'Bounced (lifetime)' },
  ];

  return (
    <div className="space-y-5">
      {/* Heading + add */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Post-dated cheque ledger</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-prose">
            The cheques you&apos;re holding. Mark each one deposited on its
            face date, then cleared or bounced based on what the bank says.
            Bounced cheques carry legal weight under PKR 489-F — keep the
            return memo with this record.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Log a cheque
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s) => {
          const amt = summary?.byStatus?.[s.key] || 0;
          const tone = PDC_STATUS_TONES[s.key];
          return (
            <Card key={s.key} className={`${tone.bg} ${tone.border}`}>
              <CardContent className="p-3">
                <p className={`text-[10.5px] uppercase tracking-wider font-semibold ${tone.text}`}>
                  {s.label}
                </p>
                <p className="text-lg font-semibold mt-1 tabular-nums">
                  {fmtPKR(amt)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PdcStatus | 'all')}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="held">Held</SelectItem>
            <SelectItem value="deposited">Awaiting clearance</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Banknote className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No cheques logged yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Log every post-dated cheque you accept so the ledger keeps a
                paper trail your accountant + your lawyer (if it bounces) can
                rely on.
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Log your first cheque
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((row) => {
            const tone = PDC_STATUS_TONES[row.status];
            const days = daysUntil(row.chequeDate);
            const isTerminal = ['cleared', 'bounced', 'cancelled'].includes(row.status);
            return (
              <Card key={row.id}>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          #{row.chequeNumber} · {row.bankName}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${tone.bg} ${tone.text} ${tone.border}`}
                        >
                          {PDC_STATUS_LABELS[row.status]}
                        </Badge>
                        {row.status === 'held' && days != null && (
                          <Badge
                            variant="outline"
                            className={
                              days < 0
                                ? 'text-[10px] border-rose-300 bg-rose-50 text-rose-700'
                                : days <= 3
                                ? 'text-[10px] border-amber-300 bg-amber-50 text-amber-700'
                                : 'text-[10px] text-muted-foreground'
                            }
                          >
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {days < 0
                              ? `${Math.abs(days)} d overdue`
                              : days === 0
                              ? 'Due today'
                              : `Due in ${days} d`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-semibold tabular-nums">
                        {fmtPKR(row.amount)}
                      </p>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Face date: {fmtDate(row.chequeDate)}
                        </span>
                        {row.depositDate && (
                          <span className="inline-flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Deposited: {fmtDate(row.depositDate)}
                          </span>
                        )}
                        {row.branchCode && <span>Branch {row.branchCode}</span>}
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
                      {row.bounceReason && row.status === 'bounced' && (
                        <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded px-2 py-1 inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Bounce reason: {row.bounceReason}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isTerminal && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(row)}
                          aria-label="Edit cheque"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(row)}
                        disabled={deletingId === row.id}
                        aria-label="Delete cheque"
                      >
                        {deletingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Transition action row */}
                  {!isTerminal && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/50">
                      {row.status === 'held' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => startTransition(row, 'deposited')}
                        >
                          <Building className="h-3 w-3" />
                          Mark deposited
                        </Button>
                      )}
                      {row.status === 'deposited' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs text-emerald-700 border-emerald-300"
                            onClick={() => startTransition(row, 'cleared')}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Cleared
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs text-rose-700 border-rose-300"
                            onClick={() => startTransition(row, 'bounced')}
                          >
                            <ShieldAlert className="h-3 w-3" />
                            Bounced
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-muted-foreground"
                        onClick={() => startTransition(row, 'cancelled')}
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PdcDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={load}
      />
      <TransitionDialog
        open={transitionOpen}
        onOpenChange={setTransitionOpen}
        pdc={transitionPdc}
        target={transitionTarget}
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
              Remove this cheque?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Soft-delete only — Wedding Wala keeps the row so the audit
              trail survives. Contact support if you need it permanently
              purged.
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

export default PdcLedgerView;

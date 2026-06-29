'use client';

/**
 * Staff — redesigned (Track C). Payroll subsystem dialogs.
 *
 * These port the ALREADY-WORKING shift / payment / attendance dialogs from the
 * original staff-view.tsx (which kept them as un-exported internal functions, so
 * they couldn't be imported directly). The form schemas, validation and — most
 * importantly — the StaffAPI calls are byte-for-byte the same as the original, so
 * functional parity is preserved. They are intentionally rendered in the legacy
 * (shadcn Form / Dialog) style; the *shell* around them (payroll-tab.tsx) is the
 * redesign surface. This mirrors how the redesigned bookings view reuses
 * OfflineBookingDialog / EditBookingDialog unchanged.
 *
 * Live-system safety: pure consumer of /api/v1/staff. Zero mutation of any
 * existing surface; the original staff-view.tsx is untouched.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import {
  StaffAPI,
  STAFF_ROLE_LABELS,
  PAYMENT_METHOD_LABELS,
  type StaffMember,
  type StaffShift,
  type StaffRole,
  type PaymentMethod,
  type CreateShiftInput,
} from '@/lib/api/staff';

export interface VendorBusinessOption {
  id: number;
  name: string;
}

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

// ─── Log shift ────────────────────────────────────────────────────

const shiftSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  staffMemberId: z.coerce.number().int().positive().optional(),
  staffNameSnapshot: z.string().trim().max(160).optional(),
  roleSnapshot: z.string().max(30).optional(),
  bookingId: z.coerce.number().int().positive().optional(),
  shiftDate: z.string().trim().min(1, 'Required'),
  dihariRate: z.coerce.number().min(0).max(100_000),
  overtimeHours: z.coerce.number().min(0).max(24).optional(),
  overtimeRate: z.coerce.number().min(0).max(50_000).optional(),
  bonusAmount: z.coerce.number().min(0).max(1_000_000).optional(),
  deductionAmount: z.coerce.number().min(0).max(1_000_000).optional(),
  deductionReason: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});
type ShiftFormValues = z.input<typeof shiftSchema>;

export function ShiftDialog({
  open,
  onOpenChange,
  businesses,
  members,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  members: StaffMember[];
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      businessId: businesses[0]?.id,
      shiftDate: new Date().toISOString().slice(0, 10),
      dihariRate: 1500,
    },
  });
  const memberId = form.watch('staffMemberId');

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: businesses[0]?.id,
        shiftDate: new Date().toISOString().slice(0, 10),
        dihariRate: 1500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businesses]);

  // Auto-populate dihariRate when a member is picked.
  useEffect(() => {
    if (!memberId) return;
    const m = members.find((mm) => mm.id === Number(memberId));
    if (m?.defaultDihariRate != null) {
      form.setValue('dihariRate', Number(m.defaultDihariRate));
    }
    if (m?.role) {
      form.setValue('roleSnapshot', m.role);
    }
    if (m?.fullName) {
      form.setValue('staffNameSnapshot', m.fullName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const liveBreakdown = useMemo(() => {
    const v = form.getValues();
    const base = Number(v.dihariRate) || 0;
    const ot = (Number(v.overtimeHours) || 0) * (Number(v.overtimeRate) || 0);
    const bonus = Number(v.bonusAmount) || 0;
    const ded = Number(v.deductionAmount) || 0;
    const gross = base + ot + bonus;
    const net = Math.max(0, gross - ded);
    return { base, ot, bonus, ded, gross, net };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.watch('dihariRate'),
    form.watch('overtimeHours'),
    form.watch('overtimeRate'),
    form.watch('bonusAmount'),
    form.watch('deductionAmount'),
  ]);

  const onSubmit = async (values: ShiftFormValues) => {
    try {
      const payload: CreateShiftInput = {
        businessId: Number(values.businessId),
        staffMemberId:
          values.staffMemberId != null
            ? Number(values.staffMemberId)
            : undefined,
        staffNameSnapshot: values.staffNameSnapshot || undefined,
        roleSnapshot: (values.roleSnapshot as StaffRole) || undefined,
        bookingId:
          values.bookingId != null ? Number(values.bookingId) : undefined,
        shiftDate: values.shiftDate,
        dihariRate: Number(values.dihariRate),
        overtimeHours:
          values.overtimeHours != null
            ? Number(values.overtimeHours)
            : undefined,
        overtimeRate:
          values.overtimeRate != null
            ? Number(values.overtimeRate)
            : undefined,
        bonusAmount:
          values.bonusAmount != null ? Number(values.bonusAmount) : undefined,
        deductionAmount:
          values.deductionAmount != null
            ? Number(values.deductionAmount)
            : undefined,
        deductionReason: values.deductionReason || undefined,
        notes: values.notes || undefined,
      };
      await StaffAPI.createShift(payload);
      toast.success('Shift logged');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not log shift');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a shift</DialogTitle>
          <DialogDescription>
            Record a casual or permanent staff assignment. Gross + net pay
            are computed server-side and snapshotted onto the row.
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
              <FormField
                control={form.control}
                name="staffMemberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff member</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) =>
                        field.onChange(v ? Number(v) : undefined)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick from roster (or fill name below)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.fullName} — {STAFF_ROLE_LABELS[m.role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Or leave blank and type a one-off name below.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!memberId && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="staffNameSnapshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-off name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ad-hoc dhol player" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roleSnapshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-off role</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(STAFF_ROLE_LABELS).map(([k, label]) => (
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
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="shiftDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dihariRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dihari rate (PKR) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100_000}
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
                    <FormLabel>Booking ID</FormLabel>
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="overtimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.25"
                        min={0}
                        max={24}
                        placeholder="e.g. 4 (for Walima past midnight)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="overtimeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime rate (PKR / hour)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="e.g. 250"
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
                name="bonusAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonus / bakshish share (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deductionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deduction (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deductionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deduction reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Advance taken / discipline / broken glass"
                      {...field}
                    />
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

            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
              <div className="mb-1 font-semibold">Live pay preview</div>
              <div className="flex flex-wrap gap-2">
                <span>Base {fmtPKR(liveBreakdown.base)}</span>
                {liveBreakdown.ot > 0 && (
                  <span>+ OT {fmtPKR(liveBreakdown.ot)}</span>
                )}
                {liveBreakdown.bonus > 0 && (
                  <span>+ Bonus {fmtPKR(liveBreakdown.bonus)}</span>
                )}
                {liveBreakdown.ded > 0 && (
                  <span>− Deduction {fmtPKR(liveBreakdown.ded)}</span>
                )}
                <span className="ml-auto rounded bg-neutral-900 px-2 text-white">
                  Gross {fmtPKR(liveBreakdown.gross)}
                </span>
                <span className="rounded bg-emerald-600 px-2 text-white">
                  Net {fmtPKR(liveBreakdown.net)}
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
                Log shift
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mark paid (partial-pay aware) ────────────────────────────────

const transitionPaidSchema = z.object({
  paidAmount: z.coerce.number().min(0),
  paidVia: z.enum([
    'cash',
    'jazzcash',
    'easypaisa',
    'raast',
    'ibft',
    'bank_transfer',
    'sadapay',
    'nayapay',
    'other',
  ]),
  paymentRef: z.string().trim().max(100).optional(),
  receiptPhotoUrl: z.string().trim().max(500).optional(),
  thumbprintCaptured: z.boolean().optional(),
});
type TransitionPaidValues = z.input<typeof transitionPaidSchema>;

export function PayDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<TransitionPaidValues>({
    resolver: zodResolver(transitionPaidSchema),
    defaultValues: {
      paidAmount: shift ? Math.round(Number(shift.netPayable)) : 0,
      paidVia: 'cash',
      thumbprintCaptured: false,
    },
  });

  useEffect(() => {
    if (shift) {
      form.reset({
        paidAmount: Math.round(Number(shift.netPayable)),
        paidVia: 'cash',
        thumbprintCaptured: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift?.id]);

  if (!shift) return null;

  const onSubmit = async (values: TransitionPaidValues) => {
    try {
      await StaffAPI.transitionShift(shift.id, {
        to: 'paid',
        paidAmount: Number(values.paidAmount),
        paidVia: values.paidVia as PaymentMethod,
        paymentRef: values.paymentRef || undefined,
        receiptPhotoUrl: values.receiptPhotoUrl || undefined,
        thumbprintCaptured: !!values.thumbprintCaptured,
      });
      toast.success('Marked paid');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not mark paid');
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark paid — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            Net payable was{' '}
            <strong>{fmtPKR(shift.netPayable)}</strong>. You can record a
            different amount if you paid more or less in practice.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount paid (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidVia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
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

            {(() => {
              const amt = Math.round(Number(form.watch('paidAmount')) || 0);
              const net = Math.round(Number(shift.netPayable) || 0);
              if (amt > 0 && amt < net) {
                return (
                  <p className="rounded-md bg-orange-50 px-3 py-2 text-xs font-medium text-orange-800">
                    Less than the {fmtPKR(net)} net payable — this records as{' '}
                    <strong>Partial</strong>, with {fmtPKR(net - amt)} still due.
                  </p>
                );
              }
              return null;
            })()}

            <FormField
              control={form.control}
              name="paymentRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ref</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="JazzCash / Easypaisa / IBFT txn id"
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
              name="receiptPhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt photo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://… (thumbprint receipt photo)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbprintCaptured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(!!v)}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Thumbprint captured on receipt
                  </FormLabel>
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
                Confirm paid
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dispute ──────────────────────────────────────────────────────

export function DisputeDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNotes('');
  }, [shift?.id]);

  if (!shift) return null;

  const submit = async () => {
    if (!notes.trim()) {
      toast.error('Dispute notes required');
      return;
    }
    setSubmitting(true);
    try {
      await StaffAPI.transitionShift(shift.id, {
        to: 'disputed',
        disputeNotes: notes.trim(),
      });
      toast.success('Moved to disputed');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not move to disputed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark disputed — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            Capture the specifics of the dispute (staff says X, vendor says Y).
            You can move back to paid once resolved.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Staff says he was underpaid by Rs. 500 for the Walima overtime"
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
            Save dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Void ─────────────────────────────────────────────────────────

export function VoidDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReason(''), [shift?.id]);

  if (!shift) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await StaffAPI.transitionShift(shift.id, {
        to: 'void',
        reason: reason.trim() || undefined,
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
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void shift — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            Use for cancelled bookings, no-shows, or any case where the
            shift was logged but no pay is owed.
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
            Confirm void
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign replacement (attendance) ──────────────────────────────

export function ReplaceDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rate, setRate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName('');
    setPhone('');
    setRate('');
    setNote('');
  }, [shift?.id]);

  if (!shift) return null;

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Replacement name required');
      return;
    }
    setSubmitting(true);
    try {
      await StaffAPI.markAttendance(shift.id, {
        to: 'replaced',
        replacement: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          role: shift.roleSnapshot,
          rate: rate ? Number(rate) : undefined,
          note: note.trim() || undefined,
        },
      });
      toast.success('Replacement recorded');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not record replacement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign replacement — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            {shift.staffNameSnapshot} couldn&apos;t make it. Record who covered the
            shift so the rota and your records stay accurate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Replacement name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asif Khan"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone (optional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rate paid (optional)</Label>
              <Input
                type="number"
                min={0}
                max={100000}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Rs."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Regular cover, came on short notice"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record replacement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

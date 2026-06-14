'use client';

/**
 * Function Sheet Composer dialog — create OR edit a Smart-File
 * morphing doc. Handles:
 *   - Customer block (free-text fallback; customerUserId optional)
 *   - Event block (title required, event date, validUntil for quotes)
 *   - Line-item builder (add/edit/delete rows; live qty × unit math)
 *   - Discount + tax inputs with live grand-total recompute
 *   - Terms editor: bullet-list mode (one line per bullet) OR free
 *     text mode
 *   - Payment schedule editor (label / due date / amount rows)
 *   - Save: POST or PATCH depending on mode
 *
 * Editing is REFUSED by the backend on terminal rows (paid /
 * archived / cancelled); we pre-check and gray out the dialog in
 * that case.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Trash2,
  ListChecks,
  FileText,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  FunctionSheetAPI,
  type FunctionSheet,
  type CreateFunctionSheetInput,
  type UpdateFunctionSheetInput,
  type FunctionSheetLineItem,
  type PaymentScheduleEntry,
} from '@/lib/api/functionSheets';

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

// ─── Schema ─────────────────────────────────────────────────────

const lineItemSchema = z.object({
  label: z.string().trim().min(1, 'Required').max(200),
  qty: z.coerce.number().min(0.001, '> 0').max(1_000_000),
  unitPrice: z.coerce.number().min(0).max(50_000_000),
  notes: z.string().trim().max(500).optional(),
});

const scheduleSchema = z.object({
  label: z.string().trim().min(1, 'Required').max(200),
  dueDate: z.string().trim().optional(),
  amount: z.coerce.number().min(0).max(500_000_000),
});

const composerSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  title: z.string().trim().min(1, 'Required').max(200),
  bookingId: z.coerce.number().int().positive().optional(),
  customerName: z.string().trim().max(120).optional(),
  customerEmail: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Invalid email',
    ),
  customerPhone: z.string().trim().max(30).optional(),
  eventDate: z.string().trim().optional(),
  validUntil: z.string().trim().optional(),
  lineItems: z.array(lineItemSchema).max(100, 'Max 100 line items'),
  discountAmount: z.coerce.number().min(0).max(500_000_000).optional(),
  taxAmount: z.coerce.number().min(0).max(500_000_000).optional(),
  termsMode: z.enum(['bullets', 'text']),
  termsBullets: z.array(z.string().trim().max(500)).optional(),
  termsText: z.string().trim().max(5000).optional(),
  paymentSchedule: z.array(scheduleSchema).max(20).optional(),
  notes: z.string().trim().max(5000).optional(),
});

type ComposerValues = z.input<typeof composerSchema>;

interface VendorBusinessOption {
  id: number;
  name: string;
}

export interface FunctionSheetComposerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  sheet?: FunctionSheet;
  onSaved: () => Promise<void> | void;
}

export function FunctionSheetComposer({
  open,
  onOpenChange,
  businesses,
  sheet,
  onSaved,
}: FunctionSheetComposerProps) {
  const isEdit = !!sheet;
  const terminal =
    sheet?.state === 'archived' ||
    sheet?.state === 'cancelled' ||
    sheet?.state === 'paid';

  // Map server-stored terms (object/string) → form-mode + lists.
  const initialTermsMode: 'bullets' | 'text' = useMemo(() => {
    if (!sheet?.termsJson) return 'bullets';
    const t = sheet.termsJson as any;
    if (Array.isArray(t?.lines)) return 'bullets';
    if (typeof t === 'string' || t?.text) return 'text';
    return 'bullets';
  }, [sheet?.termsJson]);

  const initialTermsBullets: string[] = useMemo(() => {
    const t = sheet?.termsJson as any;
    if (Array.isArray(t?.lines)) return t.lines;
    return [];
  }, [sheet?.termsJson]);

  const initialTermsText: string = useMemo(() => {
    const t = sheet?.termsJson as any;
    if (typeof t === 'string') return t;
    if (t?.text) return String(t.text);
    return '';
  }, [sheet?.termsJson]);

  const initialPaymentSchedule = useMemo<
    Array<{ label: string; dueDate?: string; amount: number }>
  >(() => {
    const ps = sheet?.paymentScheduleJson;
    if (Array.isArray(ps)) {
      return ps.map((p: any) => ({
        label: p?.label ?? '',
        dueDate: p?.dueDate ?? '',
        amount: Number(p?.amount) || 0,
      }));
    }
    return [];
  }, [sheet?.paymentScheduleJson]);

  const form = useForm<ComposerValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: {
      businessId: sheet?.businessId ?? businesses[0]?.id,
      title: sheet?.title ?? '',
      bookingId: sheet?.bookingId ?? undefined,
      customerName: sheet?.customerName ?? '',
      customerEmail: sheet?.customerEmail ?? '',
      customerPhone: sheet?.customerPhone ?? '',
      eventDate: sheet?.eventDate ?? '',
      validUntil: sheet?.validUntil ?? '',
      lineItems: Array.isArray(sheet?.lineItemsJson)
        ? sheet!.lineItemsJson.map((it) => ({
            label: it.label,
            qty: Number(it.qty) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            notes: it.notes ?? undefined,
          }))
        : [],
      discountAmount: sheet ? Number(sheet.discountAmount) || 0 : 0,
      taxAmount: sheet ? Number(sheet.taxAmount) || 0 : 0,
      termsMode: initialTermsMode,
      termsBullets: initialTermsBullets,
      termsText: initialTermsText,
      paymentSchedule: initialPaymentSchedule,
      notes: sheet?.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: sheet?.businessId ?? businesses[0]?.id,
        title: sheet?.title ?? '',
        bookingId: sheet?.bookingId ?? undefined,
        customerName: sheet?.customerName ?? '',
        customerEmail: sheet?.customerEmail ?? '',
        customerPhone: sheet?.customerPhone ?? '',
        eventDate: sheet?.eventDate ?? '',
        validUntil: sheet?.validUntil ?? '',
        lineItems: Array.isArray(sheet?.lineItemsJson)
          ? sheet!.lineItemsJson.map((it) => ({
              label: it.label,
              qty: Number(it.qty) || 0,
              unitPrice: Number(it.unitPrice) || 0,
              notes: it.notes ?? undefined,
            }))
          : [],
        discountAmount: sheet ? Number(sheet.discountAmount) || 0 : 0,
        taxAmount: sheet ? Number(sheet.taxAmount) || 0 : 0,
        termsMode: initialTermsMode,
        termsBullets: initialTermsBullets,
        termsText: initialTermsText,
        paymentSchedule: initialPaymentSchedule,
        notes: sheet?.notes ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sheet, businesses]);

  const lineItemsFA = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const scheduleFA = useFieldArray({
    control: form.control,
    // @ts-ignore — useFieldArray name typing fights generic arrays
    name: 'paymentSchedule',
  });

  // Live totals computed every render (cheap).
  // Issue #18 — form.watch('lineItems') doesn't reliably re-fire on
  // nested-field edits (the per-row qty/unitPrice inputs at this
  // path edit children, not the array reference). Subtotal silently
  // stayed at 0 while the per-line "Rs. 18,000" updated fine because
  // those bind directly to lineItems.${idx}.qty paths. useWatch
  // forces a subscription to the array AND its nested fields so any
  // edit re-runs the reduce below.
  const liveItems =
    useWatch({ control: form.control, name: 'lineItems' }) || [];
  const liveDiscount =
    Number(useWatch({ control: form.control, name: 'discountAmount' })) || 0;
  const liveTax =
    Number(useWatch({ control: form.control, name: 'taxAmount' })) || 0;
  const subtotal = useMemo(() => {
    return liveItems.reduce((sum: number, it: any) => {
      const qty = Number(it?.qty) || 0;
      const unit = Number(it?.unitPrice) || 0;
      return sum + Math.round(qty * unit);
    }, 0);
  }, [liveItems]);
  const grandTotal = Math.max(0, subtotal - liveDiscount + liveTax);

  const onSubmit = async (values: ComposerValues) => {
    if (terminal) {
      toast.error(
        `Cannot edit a ${sheet!.state} function sheet (terminal). Create a new one instead.`,
      );
      return;
    }
    try {
      const termsJson =
        values.termsMode === 'bullets'
          ? {
              lines: (values.termsBullets || []).filter(
                (l) => l && l.trim().length > 0,
              ),
            }
          : values.termsText
            ? { text: values.termsText }
            : null;

      const paymentScheduleJson =
        Array.isArray(values.paymentSchedule) &&
        values.paymentSchedule.length > 0
          ? values.paymentSchedule.map((p) => ({
              label: p.label,
              dueDate: p.dueDate || null,
              amount: Number(p.amount) || 0,
            }))
          : null;

      const lineItems: FunctionSheetLineItem[] = (values.lineItems || []).map(
        (it) => ({
          label: it.label,
          qty: Number(it.qty),
          unitPrice: Number(it.unitPrice),
          notes: it.notes || null,
        }),
      );

      if (isEdit && sheet) {
        const body: UpdateFunctionSheetInput = {
          title: values.title,
          bookingId:
            values.bookingId != null ? Number(values.bookingId) : null,
          customerName: values.customerName || null,
          customerEmail: values.customerEmail || null,
          customerPhone: values.customerPhone || null,
          eventDate: values.eventDate || null,
          validUntil: values.validUntil || null,
          lineItemsJson: lineItems,
          discountAmount: Number(values.discountAmount) || 0,
          taxAmount: Number(values.taxAmount) || 0,
          termsJson,
          paymentScheduleJson,
          notes: values.notes || null,
        };
        await FunctionSheetAPI.update(sheet.id, body);
        toast.success('Function sheet updated');
      } else {
        const body: CreateFunctionSheetInput = {
          businessId: Number(values.businessId),
          title: values.title,
          bookingId:
            values.bookingId != null ? Number(values.bookingId) : undefined,
          customerName: values.customerName || undefined,
          customerEmail: values.customerEmail || undefined,
          customerPhone: values.customerPhone || undefined,
          eventDate: values.eventDate || undefined,
          validUntil: values.validUntil || undefined,
          lineItemsJson: lineItems,
          discountAmount: Number(values.discountAmount) || 0,
          taxAmount: Number(values.taxAmount) || 0,
          termsJson: termsJson ?? undefined,
          paymentScheduleJson: paymentScheduleJson ?? undefined,
          notes: values.notes || undefined,
        };
        await FunctionSheetAPI.create(body);
        toast.success('Function sheet created');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save sheet');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit function sheet' : 'New function sheet'}
          </DialogTitle>
          <DialogDescription>
            The Smart File starts here. The same row morphs into Quote,
            Contract, BEO, Invoice, and Receipt as you advance the
            lifecycle — totals are snapshotted on each save so historical
            documents stay immutable.
          </DialogDescription>
        </DialogHeader>

        {terminal && (
          <div className="flex items-start gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This sheet is <strong>{sheet?.state}</strong> (terminal). Edits
              are refused server-side — create a new sheet instead.
            </span>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={`space-y-4 ${terminal ? 'pointer-events-none opacity-60' : ''}`}
          >
            {/* ─── Business + booking + title ─────────────────────── */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Walima dinner — Royal Palm DHA"
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
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking #</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event date</FormLabel>
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
                    <FormLabel>Quote valid until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Only printed on Quote PDF.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ─── Customer block ─────────────────────────────────── */}
            <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Customer
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sana Khan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
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
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.pk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ─── Line items ─────────────────────────────────────── */}
            <div className="space-y-2 rounded-md border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Line items
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    lineItemsFA.append({
                      label: '',
                      qty: 1,
                      unitPrice: 0,
                      notes: '',
                    })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add row
                </Button>
              </div>

              {lineItemsFA.fields.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No line items yet. Click <strong>Add row</strong> to start
                  building the quote (e.g. 600 buffet plates @ Rs. 1,500).
                </p>
              ) : (
                <div className="space-y-2">
                  {lineItemsFA.fields.map((row, idx) => {
                    const qty = Number(form.watch(`lineItems.${idx}.qty`)) || 0;
                    const unit =
                      Number(form.watch(`lineItems.${idx}.unitPrice`)) || 0;
                    const lineTotal = Math.round(qty * unit);
                    return (
                      <div
                        key={row.id}
                        className="grid grid-cols-12 gap-2 rounded-md border border-neutral-200 bg-white p-2"
                      >
                        <FormField
                          control={form.control}
                          name={`lineItems.${idx}.label`}
                          render={({ field }) => (
                            <FormItem className="col-span-12 sm:col-span-5">
                              <FormLabel className="text-[10px] uppercase">
                                Description
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Buffet plate"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`lineItems.${idx}.qty`}
                          render={({ field }) => (
                            <FormItem className="col-span-3 sm:col-span-2">
                              <FormLabel className="text-[10px] uppercase">
                                Qty
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`lineItems.${idx}.unitPrice`}
                          render={({ field }) => (
                            <FormItem className="col-span-5 sm:col-span-2">
                              <FormLabel className="text-[10px] uppercase">
                                Unit (PKR)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="col-span-3 sm:col-span-2">
                          <div className="text-[10px] uppercase text-muted-foreground">
                            Total
                          </div>
                          <div className="mt-2 h-9 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-right text-sm font-medium">
                            {fmtPKR(lineTotal)}
                          </div>
                        </div>
                        <div className="col-span-1 flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => lineItemsFA.remove(idx)}
                            className="h-9 w-9 text-rose-700 hover:text-rose-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormField
                          control={form.control}
                          name={`lineItems.${idx}.notes`}
                          render={({ field }) => (
                            <FormItem className="col-span-12">
                              <FormControl>
                                <Input
                                  placeholder="Notes (optional)"
                                  className="text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── Totals strip ───────────────────────────────────── */}
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (PKR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          {...field}
                        />
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
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        17% PK Federal sales tax typical.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-md border border-emerald-300 bg-white p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Live totals
                  </div>
                  <div className="text-xs text-neutral-700">
                    Subtotal {fmtPKR(subtotal)}
                  </div>
                  {liveDiscount > 0 && (
                    <div className="text-xs text-rose-700">
                      − Discount {fmtPKR(liveDiscount)}
                    </div>
                  )}
                  {liveTax > 0 && (
                    <div className="text-xs text-blue-700">
                      + Tax {fmtPKR(liveTax)}
                    </div>
                  )}
                  <div className="mt-1 border-t border-neutral-200 pt-1 text-base font-bold text-emerald-700">
                    {fmtPKR(grandTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Terms + payment schedule (tabs) ─────────────────── */}
            <Tabs defaultValue="terms" className="space-y-2">
              <TabsList>
                <TabsTrigger value="terms">
                  <ListChecks className="mr-1 h-3 w-3" />
                  Terms
                </TabsTrigger>
                <TabsTrigger value="schedule">
                  <CalendarClock className="mr-1 h-3 w-3" />
                  Payment schedule
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <FileText className="mr-1 h-3 w-3" />
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="terms" className="space-y-2">
                <FormField
                  control={form.control}
                  name="termsMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bullets">Bullet list</SelectItem>
                          <SelectItem value="text">Free text</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Bullet list reads cleaner on the printed contract;
                        free text suits custom legalese.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('termsMode') === 'bullets' ? (
                  <BulletsEditor form={form} />
                ) : (
                  <FormField
                    control={form.control}
                    name="termsText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms text</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="e.g. Payment due within 7 days post-event. Cancellations 30+ days prior receive full refund…"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Schedule prints on Invoice + Receipt PDFs. Typical: 50%
                    confirmation deposit, balance on event day.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      scheduleFA.append({
                        label: '',
                        dueDate: '',
                        amount: 0,
                      })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add row
                  </Button>
                </div>
                {scheduleFA.fields.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No schedule entries.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scheduleFA.fields.map((row, idx) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-12 gap-2 rounded-md border border-neutral-200 bg-white p-2"
                      >
                        <FormField
                          control={form.control}
                          name={`paymentSchedule.${idx}.label`}
                          render={({ field }) => (
                            <FormItem className="col-span-12 sm:col-span-5">
                              <FormLabel className="text-[10px] uppercase">
                                Label
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Confirmation deposit"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`paymentSchedule.${idx}.dueDate`}
                          render={({ field }) => (
                            <FormItem className="col-span-6 sm:col-span-3">
                              <FormLabel className="text-[10px] uppercase">
                                Due date
                              </FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`paymentSchedule.${idx}.amount`}
                          render={({ field }) => (
                            <FormItem className="col-span-5 sm:col-span-3">
                              <FormLabel className="text-[10px] uppercase">
                                Amount (PKR)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="col-span-1 flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => scheduleFA.remove(idx)}
                            className="h-9 w-9 text-rose-700 hover:text-rose-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Total scheduled vs grand total */}
                    {(() => {
                      const ps = form.watch('paymentSchedule') || [];
                      const total = ps.reduce(
                        (s: number, p: any) =>
                          s + (Math.round(Number(p?.amount)) || 0),
                        0,
                      );
                      const diff = total - grandTotal;
                      if (total <= 0) return null;
                      return (
                        <div className="rounded-md bg-neutral-50 px-2 py-1 text-xs">
                          Schedule totals <strong>{fmtPKR(total)}</strong>
                          {diff === 0 ? (
                            <Badge
                              variant="outline"
                              className="ml-2 border-emerald-300 bg-emerald-50 text-emerald-800"
                            >
                              matches grand total
                            </Badge>
                          ) : diff < 0 ? (
                            <Badge
                              variant="outline"
                              className="ml-2 border-amber-300 bg-amber-50 text-amber-800"
                            >
                              short by {fmtPKR(Math.abs(diff))}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="ml-2 border-rose-300 bg-rose-50 text-rose-800"
                            >
                              over by {fmtPKR(diff)}
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Internal-only notes (won't print on PDFs)."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting || terminal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || terminal}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? 'Save changes' : 'Create draft'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bullets editor (sub-component) ──────────────────────────────

function BulletsEditor({ form }: { form: any }) {
  const bullets: string[] = form.watch('termsBullets') || [];

  const updateAt = (idx: number, v: string) => {
    const next = [...bullets];
    next[idx] = v;
    form.setValue('termsBullets', next, { shouldDirty: true });
  };
  const removeAt = (idx: number) => {
    const next = bullets.filter((_, i) => i !== idx);
    form.setValue('termsBullets', next, { shouldDirty: true });
  };
  const addRow = () => {
    form.setValue('termsBullets', [...bullets, ''], { shouldDirty: true });
  };

  return (
    <div className="space-y-2">
      {bullets.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          No bullets yet. Add one — e.g. "50% advance to confirm booking".
        </p>
      ) : (
        bullets.map((b, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white p-2"
          >
            <span className="text-xs text-muted-foreground">•</span>
            <Input
              value={b}
              onChange={(e) => updateAt(idx, e.target.value)}
              placeholder={
                idx === 0
                  ? '50% advance to confirm booking'
                  : 'Add a bullet'
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAt(idx)}
              className="h-9 w-9 text-rose-700 hover:text-rose-900"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1 h-3 w-3" />
        Add bullet
      </Button>
    </div>
  );
}

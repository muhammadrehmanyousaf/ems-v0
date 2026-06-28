"use client"

/**
 * A/P invoice dialogs for the redesigned Suppliers screen.
 *
 * These are faithful ports of the four working invoice dialogs that live —
 * non-exported — inside the original `suppliers-view.tsx` (Log invoice / Record
 * payment / Dispute / Void). The original file must not be touched, and those
 * components aren't exported, so the dialogs are reproduced here verbatim in
 * behavior and wired to the SAME backend methods (`SupplierAPI.createInvoice`,
 * `recordPayment`, `transitionInvoice`). The redesigned invoices tab imports
 * these instead of rebuilding the forms. Old form styling inside the new shell
 * is intentional — functional parity is the goal.
 */

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  SupplierAPI,
  PAYMENT_METHOD_LABELS,
  type Supplier,
  type SupplierInvoice,
  type SupplierPaymentMethod,
  type CreateInvoiceInput,
} from "@/lib/api/suppliers"

export interface VendorBusinessOption {
  id: number
  name: string
}

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n)
  if (!Number.isFinite(x)) return "—"
  return `Rs. ${Math.round(x).toLocaleString("en-PK")}`
}

// ─── Log invoice ──────────────────────────────────────────────────

const invoiceSchema = z.object({
  businessId: z.coerce.number().int().positive("Pick a business"),
  supplierId: z.coerce.number().int().positive().optional(),
  supplierNameSnapshot: z.string().trim().max(200).optional(),
  invoiceNumber: z.string().trim().max(60).optional(),
  invoiceDate: z.string().trim().min(1, "Required"),
  dueDate: z.string().trim().optional(),
  subtotal: z.coerce.number().min(0).max(100_000_000),
  taxAmount: z.coerce.number().min(0).max(100_000_000).optional(),
  bookingId: z.coerce.number().int().positive().optional(),
  description: z.string().trim().max(5000).optional(),
  attachmentUrl: z.string().trim().max(500).optional(),
})
type InvoiceFormValues = z.input<typeof invoiceSchema>

export function LogInvoiceDialog({
  open,
  onOpenChange,
  businesses,
  suppliers,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  businesses: VendorBusinessOption[]
  suppliers: Supplier[]
  onSaved: () => Promise<void> | void
}) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      businessId: businesses[0]?.id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      subtotal: 0,
      taxAmount: 0,
    },
  })
  const supplierId = form.watch("supplierId")

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: businesses[0]?.id,
        invoiceDate: new Date().toISOString().slice(0, 10),
        subtotal: 0,
        taxAmount: 0,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businesses])

  // Auto-fill snapshot + due date from selected supplier.
  useEffect(() => {
    if (!supplierId) return
    const s = suppliers.find((sup) => sup.id === Number(supplierId))
    if (s) {
      form.setValue("supplierNameSnapshot", s.name)
      if (s.defaultPaymentTermsDays > 0) {
        const invDate = new Date(form.getValues("invoiceDate") || new Date())
        invDate.setUTCDate(invDate.getUTCDate() + s.defaultPaymentTermsDays)
        form.setValue("dueDate", invDate.toISOString().slice(0, 10))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId])

  const totalPreview = useMemo(() => {
    const v = form.getValues()
    return (Number(v.subtotal) || 0) + (Number(v.taxAmount) || 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("subtotal"), form.watch("taxAmount")])

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
      }
      await SupplierAPI.createInvoice(payload)
      toast.success("Invoice logged")
      await onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not log invoice")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log invoice</DialogTitle>
          <DialogDescription>
            Capture a supplier bill. Total auto-computes as subtotal + tax; due
            date auto-fills from supplier's default payment terms when you pick a
            supplier from the list.
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
                      value={String(field.value ?? "")}
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
                      value={field.value ? String(field.value) : ""}
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
  )
}

// ─── Record payment ───────────────────────────────────────────────

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01),
  method: z.enum([
    "cash",
    "jazzcash",
    "easypaisa",
    "raast",
    "ibft",
    "bank_transfer",
    "sadapay",
    "nayapay",
    "cheque",
    "post_dated_cheque",
    "other",
  ]),
  ref: z.string().trim().max(100).optional(),
  paymentDate: z.string().trim().optional(),
})
type PaymentFormValues = z.input<typeof paymentSchema>

export function RecordPaymentDialog({
  invoice,
  onOpenChange,
  onSaved,
}: {
  invoice: SupplierInvoice | null
  onOpenChange: (v: boolean) => void
  onSaved: () => Promise<void> | void
}) {
  const outstanding = invoice
    ? Math.max(0, Number(invoice.totalAmount) - Number(invoice.amountPaid || 0))
    : 0
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: Math.round(outstanding),
      method: "cash",
    },
  })

  useEffect(() => {
    if (invoice) {
      const out = Math.max(
        0,
        Number(invoice.totalAmount) - Number(invoice.amountPaid || 0),
      )
      form.reset({
        amount: Math.round(out),
        method: "cash",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id])

  if (!invoice) return null

  const onSubmit = async (values: PaymentFormValues) => {
    try {
      const res = await SupplierAPI.recordPayment(invoice.id, {
        amount: Number(values.amount),
        method: values.method as SupplierPaymentMethod,
        ref: values.ref || undefined,
        paymentDate: values.paymentDate || undefined,
      })
      if (res.result.newStatus === "paid") {
        toast.success("Invoice fully paid")
      } else {
        toast.success(
          `Payment recorded. Outstanding: ${fmtPKR(res.result.newAmountOutstanding)}`,
        )
      }
      await onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not record payment")
    }
  }

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Record payment — {invoice.supplierNameSnapshot}
          </DialogTitle>
          <DialogDescription>
            Outstanding: <strong>{fmtPKR(outstanding)}</strong> of{" "}
            {fmtPKR(invoice.totalAmount)} total. Partial payments are fine — the
            invoice flips to <em>partially paid</em>.
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
  )
}

// ─── Dispute ──────────────────────────────────────────────────────

export function DisputeInvoiceDialog({
  invoice,
  onOpenChange,
  onSaved,
}: {
  invoice: SupplierInvoice | null
  onOpenChange: (v: boolean) => void
  onSaved: () => Promise<void> | void
}) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => setReason(invoice?.statusReason ?? ""), [invoice?.id])

  if (!invoice) return null

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("Dispute reason required")
      return
    }
    setSubmitting(true)
    try {
      await SupplierAPI.transitionInvoice(invoice.id, {
        to: "disputed",
        statusReason: reason.trim(),
      })
      toast.success("Moved to disputed")
      await onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not dispute")
    } finally {
      setSubmitting(false)
    }
  }

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
  )
}

// ─── Void ─────────────────────────────────────────────────────────

export function VoidInvoiceDialog({
  invoice,
  onOpenChange,
  onSaved,
}: {
  invoice: SupplierInvoice | null
  onOpenChange: (v: boolean) => void
  onSaved: () => Promise<void> | void
}) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => setReason(""), [invoice?.id])

  if (!invoice) return null

  const submit = async () => {
    setSubmitting(true)
    try {
      await SupplierAPI.transitionInvoice(invoice.id, {
        to: "void",
        statusReason: reason.trim() || undefined,
      })
      toast.success("Voided")
      await onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not void")
    } finally {
      setSubmitting(false)
    }
  }

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
  )
}

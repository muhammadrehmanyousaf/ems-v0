'use client';

import { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { BookingsAPI, type PaymentType } from '@/lib/api/dashboard';
import { ReceiptsAPI, type ReceiptMethod } from '@/lib/api/paymentReceipts';
import type { BookingData } from '@/lib/dashboard-types';

/* The three preset types below post to /bookings/:id/record-payment, which
   accepts ONLY "down_payment" | "remaining" | "full_payment" and carries no
   amount field. That left no way to record a part-payment: a couple paying
   Rs 200,000 against a Rs 100,000 advance on a Rs 450,000 booking had no option,
   and instalments — three or four payments across the months before a shaadi,
   which is the norm here — could not be entered at all. After the first
   down payment the only remaining choice was "pay everything left".

   "custom" fixes that by writing a PaymentReceipt instead. That path already
   takes a free `amount`, and paymentReceiptController._syncBookingFromReceipts
   recomputes downPayment + paymentStatus from the SUM of receipts — so two
   part-payments correctly land as Partial and the last one flips it to Paid.
   Same ledger the khata screen uses, so the money reconciles in one place. */
const CUSTOM = 'custom' as const;

/* The receipts ledger accepts a NARROWER method list than this dialog offers:
   cash | jazzcash | easypaisa | raast | ibft | bank_transfer | other
   (paymentReceiptValidator.METHODS). Cheque, online, credit_card and debit_card
   are not in it, so posting them raw would 400 — a silent failure of exactly the
   kind this dialog is being fixed to avoid. Map them onto "other", which is what
   the ledger provides for precisely this case. */
const RECEIPT_METHOD_MAP: Record<string, ReceiptMethod> = {
    cash: 'cash',
    bank_transfer: 'bank_transfer',
    raast: 'raast',
    easypaisa: 'easypaisa',
    jazzcash: 'jazzcash',
    cheque: 'other',
    online: 'other',
    credit_card: 'other',
    debit_card: 'other',
};

/* These five are refused without a transactionRef
   (paymentReceiptValidator.METHODS_REQUIRING_TXN_REF), so the field below is
   required for them rather than optional. */
const NEEDS_TXN_REF = new Set(['jazzcash', 'easypaisa', 'raast', 'ibft', 'bank_transfer']);

interface RecordPaymentDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    booking: BookingData | null;
    onSuccess: () => void;
}

// `custom` is a FE-only choice — it never reaches /record-payment (which accepts
// only the three PaymentType values); it routes to the receipts ledger instead.
type DialogPaymentType = PaymentType | typeof CUSTOM

const PAYMENT_TYPES: { value: DialogPaymentType; label: string; description: string }[] = [
    { value: 'down_payment', label: 'Down Payment', description: 'Customer pays advance — status becomes Partial, booking gets Confirmed' },
    { value: 'remaining', label: 'Remaining Balance', description: 'Customer pays the rest — status becomes Paid' },
    { value: 'full_payment', label: 'Full Payment', description: 'Customer pays everything at once — status becomes Paid, booking gets Confirmed' },
    { value: CUSTOM, label: 'Custom amount', description: 'Any amount — part-payment, instalment, or a top-up on the advance' },
];

// Pakistani payment-mode coverage — every channel a vendor actually receives
// money through. Backend accepts the method string permissively (see
// bookingController.recordPayment line ~3232), so this is FE-only & additive.
const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'raast', label: 'Raast (SBP instant)' },
    { value: 'easypaisa', label: 'Easypaisa' },
    { value: 'jazzcash', label: 'JazzCash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online / payment gateway' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
];

export function RecordPaymentDialog({ open, onOpenChange, booking, onSuccess }: RecordPaymentDialogProps) {
    const [paymentType, setPaymentType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [txnRef, setTxnRef] = useState('');
    const [saving, setSaving] = useState(false);

    if (!booking) return null;

    const isPaid = booking.paymentStatus === 'Paid';
    const isPartial = booking.paymentStatus === 'Partial';

    // Derive accurate amounts from bookingDetails (booking-level fields can be 0)
    const details = booking.bookingDetails || [];
    const vendorTotal = details.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    const vendorDP    = details.reduce((sum, d) => sum + (Number(d.downPayment)  || 0), 0);
    const total       = vendorTotal > 0 ? vendorTotal : Number(booking.totalAmount)  || 0;
    const dp          = vendorDP    > 0 ? vendorDP    : Number(booking.downPayment)  || 0;
    const remaining   = isPaid ? 0 : isPartial ? Math.max(0, total - dp) : total;

    // Filter payment types based on current status
    const availableTypes = PAYMENT_TYPES.filter((t) => {
        if (isPaid) return false;
        // "custom" stays available in every unpaid state — that is the whole point
        // of it, and it is the only way to enter an instalment once the advance
        // has already been taken.
        if (t.value === CUSTOM) return true;
        if (t.value === 'remaining' && !isPartial) return false;
        if (t.value === 'down_payment' && isPartial) return false;
        return true;
    });

    const customValue = Number(customAmount);
    const customValid = Number.isFinite(customValue) && customValue > 0;
    const mappedMethod = RECEIPT_METHOD_MAP[paymentMethod] ?? 'other';
    const txnRefRequired = paymentType === CUSTOM && NEEDS_TXN_REF.has(mappedMethod);

    const handleSubmit = async () => {
        if (!paymentType || !paymentMethod) {
            toast.error('Please select payment type and method');
            return;
        }
        if (paymentType === CUSTOM && !customValid) {
            toast.error('Enter the amount received');
            return;
        }
        if (txnRefRequired && !txnRef.trim()) {
            toast.error('This payment method needs a transaction reference');
            return;
        }

        setSaving(true);
        try {
            if (paymentType === CUSTOM) {
                // Free-amount path — writes to the receipts ledger, which the
                // backend then rolls up into the booking's downPayment and
                // paymentStatus. Deliberately NOT capped at the remaining
                // balance: the vendor is recording money they have actually
                // been handed, and refusing to write it down would only make
                // the ledger disagree with the cash box. An overpayment shows
                // as a credit to settle later.
                await ReceiptsAPI.create({
                    bookingId: booking.id,
                    amount: customValue,
                    method: mappedMethod,
                    receivedDate: new Date().toISOString().slice(0, 10),
                    ...(txnRef.trim() ? { transactionRef: txnRef.trim() } : {}),
                    // Keep the vendor's actual choice when it had to be mapped to
                    // "other", so the khata still shows "cheque" rather than losing it.
                    ...(mappedMethod === 'other' && paymentMethod
                        ? { notes: `Method: ${paymentMethod.replace(/_/g, ' ')}` }
                        : {}),
                });
            } else {
                await BookingsAPI.recordPayment(
                    booking.id,
                    paymentType as PaymentType,
                    paymentMethod
                );
            }
            toast.success('Payment recorded successfully');
            setPaymentType('');
            setPaymentMethod('');
            setCustomAmount('');
            setTxnRef('');
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to record payment';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const selectedType = PAYMENT_TYPES.find((t) => t.value === paymentType);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Record Payment
                    </DialogTitle>
                    <DialogDescription>
                        Booking #{booking.id} — {booking.customerName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Amount summary */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                        <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-semibold">Rs. {total.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Down Payment</p>
                            <p className="font-semibold">Rs. {dp.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Current Status</p>
                            <p className="font-semibold capitalize">{booking.paymentStatus}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Remaining</p>
                            <p className="font-semibold">Rs. {remaining.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Payment Type */}
                    <div className="space-y-1.5">
                        <Label>Payment Type *</Label>
                        <Select value={paymentType} onValueChange={setPaymentType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTypes.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedType && (
                            <p className="text-xs text-muted-foreground">{selectedType.description}</p>
                        )}
                    </div>

                    {/* Amount — only for the custom path; the three presets derive
                        their own amount server-side. */}
                    {paymentType === CUSTOM && (
                        <div className="space-y-1.5">
                            <Label>Amount received (Rs) *</Label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder={remaining > 0 ? String(remaining) : '50000'}
                            />
                            <p className="text-xs text-muted-foreground">
                                {customValid && remaining > 0 && customValue > remaining
                                    ? `That is Rs ${(customValue - remaining).toLocaleString()} more than the balance — it will be recorded as a credit.`
                                    : `Enter exactly what the customer handed over. Remaining balance is Rs ${remaining.toLocaleString()}.`}
                            </p>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                        <Label>Payment Method *</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {paymentMethod === 'cheque' ? (
                            <p className="text-[11px] text-amber-700 leading-snug">
                                Cheques need cheque number, date, and bank — log them from the
                                PDC module for a complete record. Recording here won&apos;t
                                create a PDC entry.
                            </p>
                        ) : paymentMethod ? (
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                A matching receipt will be auto-logged in the receipts ledger
                                and the receivables view will update.
                            </p>
                        ) : null}
                    </div>

                    {/* Digital rails are refused by the receipts ledger without a
                        reference, so ask for it up front rather than letting the
                        save fail. */}
                    {txnRefRequired && (
                        <div className="space-y-1.5">
                            <Label>Transaction reference *</Label>
                            <Input
                                value={txnRef}
                                onChange={(e) => setTxnRef(e.target.value)}
                                placeholder="e.g. TRX-93481022"
                            />
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                Required for {paymentMethod.replace(/_/g, ' ')} — it is how this
                                payment is matched against your bank statement later.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            saving ||
                            !paymentType ||
                            !paymentMethod ||
                            (paymentType === CUSTOM && !customValid) ||
                            (txnRefRequired && !txnRef.trim())
                        }
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

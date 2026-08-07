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
import { todayInKarachi } from "@/lib/utils/pk-date"
import {
    bookedOn, receivedOn, outstandingOn, derivedPaymentStatus,
} from "@/lib/utils/booking-money"

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
    // WWL-113 — explicit acknowledgement that an amount well over the balance
    // is intended. Reset whenever the amount changes, so a tick can never
    // carry over onto a different figure.
    const [confirmOverpay, setConfirmOverpay] = useState(false);
    const [txnRef, setTxnRef] = useState('');
    const [saving, setSaving] = useState(false);

    if (!booking) return null;

    // WWL-040 — `remaining` used to be read off `paymentStatus`: a booking
    // flagged `Pending` was assumed to have collected nothing, so this dialog
    // told the vendor to take the full Rs 350,000 from a customer who had
    // already handed over Rs 35,000 and owed Rs 315,000. It is the one screen
    // in the product that is open while the customer is at the counter, so it
    // is the one that must not guess. Balance is now the arithmetic, and the
    // `Paid`/`Partial` gates below follow the money rather than the flag.
    const total     = bookedOn(booking);
    const dp        = receivedOn(booking);
    const remaining = outstandingOn(booking);
    const derived   = derivedPaymentStatus(booking);
    const isPaid    = derived === 'Paid';
    const isPartial = derived === 'Partial';

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

    /**
     * WWL-113 — an over-payment guard relative to the booking.
     *
     * The tolerance is deliberate: rounding a Rs 1,673,250 balance up to
     * Rs 1,675,000 in cash is ordinary, and making the vendor tick a box for
     * Rs 1,750 of change would train them to tick it without reading. The
     * threshold is the larger of Rs 1,000 and 1% of the balance — below that it
     * is change, above it is a decision.
     */
    // Reference is the balance, floored at 0 — so an amount recorded against a
    // booking that owes nothing is also a decision, not a silent write.
    const overReference = Math.max(0, remaining);
    const overBy = customValid ? customValue - overReference : 0;
    const overTolerance = Math.max(1000, overReference * 0.01);
    const suspiciousAmount = customValid && overBy > overTolerance;
    const overMultiple = remaining > 0 ? customValue / remaining : 0;
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
                    receivedDate: todayInKarachi(),
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
                                onChange={(e) => { setCustomAmount(e.target.value); setConfirmOverpay(false); }}
                                placeholder={remaining > 0 ? String(remaining) : '50000'}
                            />
                            {/* WWL-113 — there was an absolute sanity cap and
                                nothing relative to the booking, so Rs 99,999,999
                                against a Rs 1,673,250 booking saved silently:
                                ~60x the total, and one extra zero on a real
                                figure desynchronises the ledger permanently.

                                Not refused — vendors do take genuine
                                overpayments, and a payment that is real but
                                unrecordable makes the khata disagree with the
                                cash box, which is worse. It has to be confirmed
                                instead, and the likely typo is named. */}
                            {suspiciousAmount ? (
                                <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 space-y-1.5 dark:border-amber-800 dark:bg-amber-950/40">
                                    <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                                        {overMultiple >= 10
                                            ? `That is about ${Math.round(overMultiple)}× the remaining balance of Rs ${remaining.toLocaleString()}. Did you mean Rs ${Math.round(customValue / 10).toLocaleString()}?`
                                            : `That is Rs ${(customValue - remaining).toLocaleString()} more than the Rs ${remaining.toLocaleString()} balance.`}
                                    </p>
                                    <label className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5"
                                            checked={confirmOverpay}
                                            onChange={(e) => setConfirmOverpay(e.target.checked)}
                                        />
                                        <span>
                                            Yes — the customer handed over Rs {customValue.toLocaleString()}.
                                            Record the extra as a credit.
                                        </span>
                                    </label>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Enter exactly what the customer handed over. Remaining balance is Rs {remaining.toLocaleString()}.
                                </p>
                            )}
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
                            // WWL-113 — an amount well above the balance is a
                            // decision, not a keystroke.
                            (paymentType === CUSTOM && suspiciousAmount && !confirmOverpay) ||
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

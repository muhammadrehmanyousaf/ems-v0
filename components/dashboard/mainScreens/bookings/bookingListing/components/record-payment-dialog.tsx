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
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { BookingsAPI, type PaymentType } from '@/lib/api/dashboard';
import type { BookingData } from '@/lib/dashboard-types';

interface RecordPaymentDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    booking: BookingData | null;
    onSuccess: () => void;
}

const PAYMENT_TYPES: { value: PaymentType; label: string; description: string }[] = [
    { value: 'down_payment', label: 'Down Payment', description: 'Customer pays advance — status becomes Partial, booking gets Confirmed' },
    { value: 'remaining', label: 'Remaining Balance', description: 'Customer pays the rest — status becomes Paid' },
    { value: 'full_payment', label: 'Full Payment', description: 'Customer pays everything at once — status becomes Paid, booking gets Confirmed' },
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
        if (t.value === 'remaining' && !isPartial) return false;
        if (t.value === 'down_payment' && isPartial) return false;
        return true;
    });

    const handleSubmit = async () => {
        if (!paymentType || !paymentMethod) {
            toast.error('Please select payment type and method');
            return;
        }

        setSaving(true);
        try {
            await BookingsAPI.recordPayment(
                booking.id,
                paymentType as PaymentType,
                paymentMethod
            );
            toast.success('Payment recorded successfully');
            setPaymentType('');
            setPaymentMethod('');
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
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving || !paymentType || !paymentMethod}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

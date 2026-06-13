'use client';

/**
 * Issue #63 — Record a manual refund on an offline booking.
 *
 * Mirrors record-payment-dialog.tsx but in reverse: the vendor enters
 * an amount they're returning to the customer, picks the refund
 * method, and we POST to /bookings/:id/refund. The BE walks back
 * BookingInstallment.amountPaid + writes a negative PaymentReceipt
 * tagged [REFUND] + re-derives Booking.paymentStatus.
 */

import { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosConfig';
import type { BookingData } from '@/lib/dashboard-types';

interface RecordRefundDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    booking: BookingData | null;
    onSuccess: () => void;
}

// Mirrors the PaymentReceipt method whitelist on the BE.
const REFUND_METHODS = [
    { value: 'cash', label: 'Cash returned' },
    { value: 'bank_transfer', label: 'Bank transfer' },
    { value: 'raast', label: 'Raast (SBP instant)' },
    { value: 'easypaisa', label: 'Easypaisa' },
    { value: 'jazzcash', label: 'JazzCash' },
    { value: 'ibft', label: 'Bank IBFT' },
    { value: 'other', label: 'Other' },
];

export function RecordRefundDialog({
    open, onOpenChange, booking, onSuccess,
}: RecordRefundDialogProps) {
    const [amount, setAmount] = useState('');
    const [refundMethod, setRefundMethod] = useState('cash');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    if (!booking) return null;

    // Derive max-refundable from what's actually been received against
    // this booking. Use booking-row downPayment as the conservative
    // floor — the BE will reject anything that doesn't reconcile
    // against the installment ledger anyway.
    const details = booking.bookingDetails || [];
    const vendorTotal = details.reduce((s, d) => s + (Number(d.totalAmount) || 0), 0);
    const vendorDP = details.reduce((s, d) => s + (Number(d.downPayment) || 0), 0);
    const total = vendorTotal > 0 ? vendorTotal : Number(booking.totalAmount) || 0;
    const isPartial = booking.paymentStatus === 'Partial';
    const isPaid = booking.paymentStatus === 'Paid';
    const received = isPaid ? total : isPartial ? (vendorDP || Number(booking.downPayment) || 0) : 0;

    const handleSubmit = async () => {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) {
            toast.error('Enter a positive refund amount');
            return;
        }
        if (amt > received + 0.01) {
            toast.error(
                `Refund (Rs ${amt.toLocaleString()}) exceeds amount received (Rs ${received.toLocaleString()}).`,
            );
            return;
        }
        if (!refundMethod) {
            toast.error('Pick a refund method');
            return;
        }

        setSaving(true);
        try {
            await axiosInstance.post(`/api/v1/bookings/${booking.id}/refund`, {
                amount: amt,
                refundMethod,
                reason: reason.trim() || undefined,
            });
            toast.success('Refund recorded');
            setAmount('');
            setReason('');
            setRefundMethod('cash');
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to record refund');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Undo2 className="h-5 w-5 text-amber-600" />
                        Record refund
                    </DialogTitle>
                    <DialogDescription>
                        Booking #{booking.id} — {booking.customerName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Context */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                        <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold">Rs. {total.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Received so far</p>
                            <p className="font-semibold">Rs. {received.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-semibold capitalize">{booking.paymentStatus}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Max refundable</p>
                            <p className="font-semibold text-amber-700">Rs. {received.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Refund amount (Rs) *</Label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            placeholder="e.g. 25000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Refund method *</Label>
                        <Select value={refundMethod} onValueChange={setRefundMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {REFUND_METHODS.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Reason (optional)</Label>
                        <Textarea
                            rows={2}
                            placeholder="e.g. Goodwill discount, scope reduction…"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Goes into the receipt ledger note. Not visible to the customer.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !amount}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record refund
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

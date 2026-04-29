'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Globe, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorPayment } from '@/lib/dashboard-types';

interface ViewPaymentDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    payment: VendorPayment | null;
}

const fmt = (n: number) => `Rs. ${n.toLocaleString()}`

const paymentStatusColors: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-300',
    Partial: 'bg-blue-50 text-blue-700 border-blue-300',
    Paid:    'bg-green-50 text-green-700 border-green-300',
}

const formatTime = (time?: string) => {
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    if (isNaN(h)) return time
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m ?? 0).padStart(2, '0')} ${period}`
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right">{value}</span>
    </div>
)

export function ViewPaymentDialog({ open, onOpenChange, payment }: ViewPaymentDialogProps) {
    if (!payment) return null

    const isOffline = payment.bookingSource === 'offline'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Payment Details</DialogTitle>
                        <span className={cn(
                            'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border',
                            isOffline
                                ? 'bg-orange-50 text-orange-700 border-orange-300'
                                : 'bg-blue-50 text-blue-700 border-blue-300'
                        )}>
                            {isOffline ? <Store className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                            {isOffline ? 'Offline' : 'Online'}
                        </span>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Customer */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
                        <Row label="Name"  value={payment.customerName} />
                        <Row label="Phone" value={payment.customerPhone || '—'} />
                        {payment.customerEmail && (
                            <Row label="Email" value={payment.customerEmail} />
                        )}
                    </div>

                    <Separator />

                    {/* Booking */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Booking</p>
                        <Row label="Booking ID" value={<span className="font-mono">#{payment.bookingId}</span>} />
                        <Row label="Business"   value={payment.businessName || '—'} />
                        <Row label="Date"       value={payment.bookingDate ? new Date(payment.bookingDate).toLocaleDateString() : '—'} />
                        <Row label="Time"       value={formatTime(payment.bookingTime) || '—'} />
                        <Row label="Status"     value={payment.status} />
                    </div>

                    <Separator />

                    {/* Financials */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Financials</p>
                        <Row label="Total Amount" value={<span className="font-semibold">{fmt(payment.totalAmount)}</span>} />
                        <Row label="Received"     value={<span className="text-green-600 font-semibold">{fmt(payment.received)}</span>} />
                        {payment.due > 0 && (
                            <Row label="Due" value={<span className="text-orange-500 font-semibold">{fmt(payment.due)}</span>} />
                        )}
                        <Row
                            label="Payment Status"
                            value={
                                <span className={cn('px-2.5 py-0.5 border text-xs rounded-md font-medium', paymentStatusColors[payment.paymentStatus] || 'border-neutral-300 text-neutral-600 bg-neutral-50')}>
                                    {payment.paymentStatus}
                                </span>
                            }
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

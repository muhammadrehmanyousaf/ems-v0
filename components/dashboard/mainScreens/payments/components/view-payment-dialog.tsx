'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Payment } from '@/lib/dashboard-types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ViewPaymentDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    payment: Payment | null;
}

const statusColor: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    scheduled: 'bg-blue-500/10 text-blue-600 border-blue-200',
    failed: 'bg-red-500/10 text-red-600 border-red-200',
    hold: 'bg-orange-500/10 text-orange-600 border-orange-200',
    refunded: 'bg-purple-500/10 text-purple-600 border-purple-200',
};

export function ViewPaymentDialog({ open, onOpenChange, payment }: ViewPaymentDialogProps) {
    if (!payment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Payment Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Payment ID</span>
                        <span className="font-mono text-sm">{payment.paymentId}</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">Customer</p>
                            <p className="font-medium">{payment.customerName}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Booking ID</p>
                            <p className="font-medium">{payment.orderId}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Business</p>
                            <p className="font-medium">{payment.eventType || '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Method</p>
                            <p className="font-medium capitalize">{payment.paymentMethod || '—'}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">Payout Amount</p>
                            <p className="font-semibold text-lg text-green-600">{payment.currency} {(Number(payment.advanceAmount) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Booking Amount</p>
                            <p className="font-medium">{payment.currency} {(Number(payment.totalAmount) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Platform Fee</p>
                            <p className="font-medium">{payment.currency} {(Number(payment.balanceAmount) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <Badge className={`capitalize ${statusColor[payment.paymentStatus?.toLowerCase()] || ''}`}>
                                {payment.paymentStatus}
                            </Badge>
                        </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">Payout ID</p>
                            <p className="font-mono text-xs">{payment.transactionId || '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Payout Date</p>
                            <p className="font-medium">
                                {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'Pending'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Scheduled Date</p>
                            <p className="font-medium">
                                {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

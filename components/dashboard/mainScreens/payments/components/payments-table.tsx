'use client';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import React, { useEffect, useState, useCallback } from 'react';
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table';
import { Payment } from '@/lib/dashboard-types';
import { columns } from './columns';
import { PaymentTableActions } from './payment-table-actions';
import { PaymentsAPI } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewPaymentDialog } from './view-payment-dialog';
import { toast } from 'sonner';

const PaymentsTable = () => {
    const [data, setData] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewPayment, setViewPayment] = useState<Payment | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        PaymentsAPI.getVendorPayouts()
            .then((result) => {
                const mapped: Payment[] = result.payouts.map((p) => ({
                    paymentId: `PO-${p.id}`,
                    customerName: p.booking?.customerName || 'Unknown',
                    email: '',
                    phone: '',
                    eventType: p.business?.name || 'N/A',
                    eventDate: p.booking?.bookingDate || '',
                    venue: '',
                    guestsCount: 0,
                    packageSelected: '',
                    totalAmount: Number(p.originalAmount) || 0,
                    advanceAmount: Number(p.payoutAmount) || 0,
                    balanceAmount: Number(p.platformFee) || 0,
                    currency: 'PKR',
                    paymentStatus: p.status,
                    paymentMethod: (p.payoutMethod || 'bank') as Payment['paymentMethod'],
                    transactionId: `PO-${p.id}`,
                    invoiceId: '',
                    orderId: `BK-${p.bookingId}`,
                    paymentDate: p.processedDate || p.createdAt,
                    dueDate: p.scheduledDate || '',
                }));
                setData(mapped);
            })
            .catch(() => { setData([]); toast.error('Failed to load payment history'); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const { table, paginationState } = useDataTable<Payment>({
        data,
        columns: columns(
            (payment) => setViewPayment(payment),
        ),
        totalItems: data.length,
    });

    if (loading) {
        return (
            <div className="space-y-4 w-full">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-60" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className='space-y-4 w-full'>
            <PaymentTableActions table={table} />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={data.length}
            />

            <ViewPaymentDialog
                open={!!viewPayment}
                onOpenChange={(v) => !v && setViewPayment(null)}
                payment={viewPayment}
            />
        </div>
    );
};

export default PaymentsTable;

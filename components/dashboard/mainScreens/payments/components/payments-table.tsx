'use client';
import React, { useState } from 'react';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table';
import { columns } from './columns';
import { PaymentTableActions } from './payment-table-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewPaymentDialog } from './view-payment-dialog';
import type { VendorPayment } from '@/lib/dashboard-types';
import { cn } from '@/lib/utils';

type SourceFilter = 'all' | 'offline' | 'online';

interface PaymentsTableProps {
    payments: VendorPayment[];
    loading: boolean;
    onRefresh: () => void;
}

const PaymentsTable = ({ payments, loading, onRefresh }: PaymentsTableProps) => {
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
    const [viewPayment, setViewPayment]   = useState<VendorPayment | null>(null);

    const filtered = sourceFilter === 'all'
        ? payments
        : payments.filter((p) => p.bookingSource === sourceFilter);

    const { table, paginationState } = useDataTable<VendorPayment>({
        data: filtered,
        columns: columns((p) => setViewPayment(p)),
        totalItems: filtered.length,
    });

    const tabs: { key: SourceFilter; label: string }[] = [
        { key: 'all',     label: `All (${payments.length})` },
        { key: 'offline', label: `Offline (${payments.filter(p => p.bookingSource === 'offline').length})` },
        { key: 'online',  label: `Online (${payments.filter(p => p.bookingSource === 'online').length})` },
    ];

    if (loading) {
        return (
            <div className="space-y-4 w-full">
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-3 w-full">
            {/* Source filter tabs */}
            <div className="flex items-center gap-1 border-b pb-0">
                {tabs.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setSourceFilter(key)}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                            sourceFilter === key
                                ? 'border-purple-600 text-purple-700'
                                : 'border-transparent text-muted-foreground hover:text-neutral-700'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <PaymentTableActions table={table} />

            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={filtered.length}
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

'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorPayment } from '@/lib/dashboard-types';

const fmt = (n: number) => `Rs. ${n.toLocaleString()}`

const paymentStatusColors: Record<string, string> = {
    Pending:  'border-amber-400 text-amber-700 bg-amber-50',
    Partial:  'border-blue-400 text-blue-700 bg-blue-50',
    Paid:     'border-green-400 text-green-700 bg-green-50',
}

const formatTime = (time?: string) => {
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    if (isNaN(h)) return time
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m ?? 0).padStart(2, '0')} ${period}`
}

export const columns = (
    onView: (p: VendorPayment) => void,
): ColumnDef<VendorPayment>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                aria-label="Select all"
                aria-checked={table.getIsSomePageRowsSelected() ? 'mixed' : table.getIsAllPageRowsSelected()}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 36,
    },
    {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-sm text-neutral-900">{row.original.customerName}</p>
                <p className="text-xs text-neutral-400">{row.original.customerPhone}</p>
            </div>
        ),
    },
    {
        id: 'bookingId',
        header: 'Booking ID',
        cell: ({ row }) => (
            <span className="text-sm text-neutral-600 font-mono">#{row.original.bookingId}</span>
        ),
    },
    {
        accessorKey: 'businessName',
        header: 'Business',
        cell: ({ row }) => (
            <span className="text-sm text-neutral-700">{row.original.businessName || '—'}</span>
        ),
    },
    {
        id: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
            const { totalAmount, received, due } = row.original
            return (
                <div>
                    <p className="text-sm font-semibold text-neutral-900">{fmt(totalAmount)}</p>
                    <p className="text-xs mt-0.5 space-x-1">
                        <span className="text-green-600 font-medium">Paid {received.toLocaleString()}</span>
                        {due > 0 && <span className="text-orange-500">· Due {due.toLocaleString()}</span>}
                    </p>
                </div>
            )
        },
    },
    {
        id: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => {
            const ps = row.original.paymentStatus || 'Pending'
            return (
                <span className={cn('px-2.5 py-1 border text-xs rounded-md font-medium inline-flex items-center', paymentStatusColors[ps] || 'border-neutral-300 text-neutral-600 bg-neutral-50')}>
                    {ps}
                </span>
            )
        },
    },
    {
        id: 'source',
        header: 'Source',
        cell: ({ row }) => {
            const isOffline = row.original.bookingSource === 'offline'
            return (
                <span className={cn(
                    'px-2 py-0.5 border text-xs rounded-md font-medium inline-flex items-center gap-1',
                    isOffline
                        ? 'border-orange-300 text-orange-700 bg-orange-50'
                        : 'border-blue-300 text-blue-700 bg-blue-50'
                )}>
                    {isOffline ? <><Store className="h-3 w-3" />Offline</> : <><Globe className="h-3 w-3" />Online</>}
                </span>
            )
        },
    },
    {
        id: 'date',
        header: 'Date',
        cell: ({ row }) => (
            <div>
                <p className="text-sm text-neutral-800">
                    {row.original.bookingDate ? new Date(row.original.bookingDate).toLocaleDateString() : '—'}
                </p>
                <p className="text-xs text-neutral-400">{formatTime(row.original.bookingTime)}</p>
            </div>
        ),
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => <RowActions data={row.original} onView={onView} />,
    },
];

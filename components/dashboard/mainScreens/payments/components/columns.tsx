'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Payment } from '@/lib/dashboard-types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatDateTime } from '@/lib/utils';

export const columns = (
    onView: (payment: Payment) => void,
): ColumnDef<Payment>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                aria-label="Select all"
                aria-checked={
                    table.getIsSomePageRowsSelected()
                        ? "mixed"
                        : table.getIsAllPageRowsSelected()
                }
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
        accessorKey: "customerName",
        header: "Full Name",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar className="h-[34px] w-[34px]">
                    <AvatarFallback className="bg-primary/20 text-primary">
                        {row.original.customerName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <span className="font-medium">{row.original.customerName}</span>
                    {row.original.email && (
                        <p className="text-xs text-muted-foreground">{row.original.email}</p>
                    )}
                </div>
            </div>
        ),
    },
    { accessorKey: "orderId", header: "Booking ID" },
    { accessorKey: "eventType", header: "Business" },
    {
        id: "paymentStatus",
        header: "Payment Status",
        cell: ({ row }) => {
            const status = row.original.paymentStatus;
            const statusColors: Record<string, string> = {
                pending: "border-amber-500 text-amber-800 bg-amber-50",
                scheduled: "border-blue-500 text-blue-600 bg-blue-50",
                completed: "border-green-500 text-green-600 bg-green-50",
                failed: "border-red-500 text-red-600 bg-red-50",
                hold: "border-orange-500 text-orange-600 bg-orange-50",
                refunded: "border-purple-500 text-purple-600 bg-purple-50",
            };
            const color =
                statusColors[status] ||
                "border-gray-400 text-gray-600 bg-gray-50";

            return (
                <span
                    className={cn(
                        "px-2 border h-7 flex items-center justify-center rounded-md font-medium dark:bg-transparent text-sm whitespace-nowrap capitalize",
                        color
                    )}
                >
                    {status}
                </span>
            );
        },
    },
    {
        id: "payout_amount",
        header: "Payout Amount",
        cell: ({ row }) => {
            const amount = Number(row.original.advanceAmount) || 0;
            return (
                <div className="max-w-32 flex justify-center">
                    {amount > 0 ? `Rs. ${amount.toLocaleString()}` : '—'}
                </div>
            );
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Booking Amount",
        cell: ({ row }) => (
            <div className="max-w-32 flex justify-center">
                {`Rs. ${(Number(row.original.totalAmount) || 0).toLocaleString()}`}
            </div>
        ),
    },
    {
        id: "platform_fee",
        header: "Platform Fee",
        cell: ({ row }) => {
            const fee = Number(row.original.balanceAmount) || 0;
            return (
                <div className="max-w-32 flex justify-center">
                    {fee > 0 ? `Rs. ${fee.toLocaleString()}` : '—'}
                </div>
            );
        },
    },
    {
        accessorKey: "paymentDate",
        header: "Payment Date",
        cell: ({ row }) => (
            <div className="max-w-32 flex justify-center whitespace-nowrap">
                {row.original.paymentDate ?
                    formatDateTime(row.original.paymentDate)
                    : 'Not Paid'
                }
            </div>
        ),
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
            <RowActions data={row.original} onView={onView} />
        ),
    },
];

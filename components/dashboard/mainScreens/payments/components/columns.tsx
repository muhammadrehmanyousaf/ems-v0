'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Payment } from '@/lib/dashboard-types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatDateTime } from '@/lib/utils';

export const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : ""

export const columns: ColumnDef<Payment>[] = [
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
                        {row.original.customerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {row.original.customerName}
            </div>
        ),
    },
    { accessorKey: "phone", header: "Phone Number" },
    { accessorKey: "eventType", header: "Booked Event" },
    {
        id: "paymentStatus",
        header: "Payment Status",
        cell: ({ row }) => {
            const status = row.original.paymentStatus;
            const statusColors: Record<string, string> = {
                Pending: "border-amber-500 text-amber-800 bg-amber-50",
                "Fully Paid": "border-green-500 text-green-600 bg-green-50",
                "Advance Paid": "border-blue-500 text-blue-600 bg-blue-50",
                Cancelled: "border-red-500 text-red-600 bg-red-50",
                Failed: "border-red-500 text-red-600 bg-red-50",
            };
            const color =
                statusColors[status] ||
                "border-gray-400 text-gray-600 bg-gray-50";

            return (
                <span
                    className={cn(
                        "px-2 border h-7 flex items-center justify-center rounded-md font-medium dark:bg-transparent text-sm",
                        color
                    )}
                >
                    {status}
                </span>
            );
        },
    },
    {
        id: "amount_paid",
        header: "Amount Paid",
        cell: ({ row }) => {
            const payemntStatus = row.original.paymentStatus
            const paymentPaid = payemntStatus === 'Advance Paid' ? row.original.advanceAmount :
                payemntStatus === 'Fully Paid' ? row.original.totalAmount : '-'
            return (
                <div className="max-w-32 flex justify-center">
                    {paymentPaid !== '-' ?
                        `Rs. ${paymentPaid.toLocaleString()}` :
                        '-'}
                </div>
            )
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
            <div className="max-w-32 flex justify-center">
                {`Rs. ${row.original.totalAmount.toLocaleString()}`}
            </div>
        ),
    },
    {
        accessorKey: "paymentDate",
        header: "Payment Date",
        cell: ({ row }) => (
            <div className="max-w-32 flex justify-center">
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
        cell: ({ row }) => <RowActions data={row.original} />,
    },
];

export const payments: Payment[] = [
    {
        paymentId: "PAY-2001",
        customerName: "Ali Khan",
        email: "ali.khan@example.com",
        phone: "+92-300-1234567",
        eventType: "Wedding",
        eventDate: "2025-09-10",
        venue: "Pearl Continental Lahore",
        guestsCount: 300,
        packageSelected: "Platinum",
        totalAmount: 250000,
        advanceAmount: 100000,
        balanceAmount: 150000,
        currency: "PKR",
        paymentStatus: "Advance Paid",
        paymentMethod: "Bank Transfer",
        transactionId: "TXN-10045",
        invoiceId: "INV-601",
        orderId: "EVT-9001",
        paymentDate: "2025-08-15T14:32:00Z",
        dueDate: "2025-09-05T00:00:00Z",
        notes: "Advance paid for wedding booking",
    },
    {
        paymentId: "PAY-2002",
        customerName: "Sara Ahmed",
        email: "sara.ahmed@example.com",
        phone: "+92-321-8765432",
        eventType: "Birthday Party",
        eventDate: "2025-08-25",
        venue: "Royal Palm Banquet Hall",
        guestsCount: 100,
        packageSelected: "Silver",
        totalAmount: 50000,
        advanceAmount: 20000,
        balanceAmount: 30000,
        currency: "PKR",
        paymentStatus: "Pending",
        paymentMethod: null,
        transactionId: null,
        invoiceId: "INV-602",
        orderId: "EVT-9002",
        paymentDate: null,
        dueDate: "2025-08-22T00:00:00Z",
        notes: "Booking confirmed, advance not yet received",
    },
    {
        paymentId: "PAY-2003",
        customerName: "Hamza Tariq",
        email: "hamza.tariq@example.com",
        phone: "+92-333-5678901",
        eventType: "Corporate Event",
        eventDate: "2025-09-15",
        venue: "Marriott Karachi",
        guestsCount: 500,
        packageSelected: "Gold",
        totalAmount: 400000,
        advanceAmount: 400000,
        balanceAmount: 0,
        currency: "PKR",
        paymentStatus: "Fully Paid",
        paymentMethod: "Credit Card",
        transactionId: "TXN-10046",
        invoiceId: "INV-603",
        orderId: "EVT-9003",
        paymentDate: "2025-08-16T11:20:00Z",
        dueDate: "2025-09-01T00:00:00Z",
        notes: "Full advance paid",
    },
    {
        paymentId: "PAY-2004",
        customerName: "Zainab Malik",
        email: "zainab.malik@example.com",
        phone: "+92-345-9876543",
        eventType: "Wedding",
        eventDate: "2025-09-20",
        venue: "Serena Hotel Islamabad",
        guestsCount: 250,
        packageSelected: "Gold",
        totalAmount: 200000,
        advanceAmount: 0,
        balanceAmount: 200000,
        currency: "PKR",
        paymentStatus: "Cancelled",
        paymentMethod: null,
        transactionId: null,
        invoiceId: "INV-604",
        orderId: "EVT-9004",
        paymentDate: null,
        dueDate: "2025-09-10T00:00:00Z",
        notes: "Booking cancelled by customer",
    },
];
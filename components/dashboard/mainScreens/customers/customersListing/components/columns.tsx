'use client';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomersType } from '@/lib/dashboard-types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "";

export const columns = (
    onView: (customer: CustomersType) => void,
): ColumnDef<CustomersType>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                aria-label="Select all"
                aria-checked={
                    table.getIsSomePageRowsSelected() ? "mixed" : table.getIsAllPageRowsSelected()
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
        accessorKey: "name",
        header: "Full Name",
        cell: ({ row }) => {
            // Listing _id is either the email or `offline_<N>` — both are
            // valid identifiers for the Customer 360 page.
            const id = row.original._id || '';
            const href = `/dashboard/customers/${encodeURIComponent(id)}`;
            return (
                <Link href={href} className='flex items-center gap-2 group'>
                    <Avatar className='h-[34px] w-[34px]'>
                        <AvatarFallback className='bg-primary/20 text-primary'>
                            {row.original.name?.charAt(0).toLocaleUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <span className="font-medium group-hover:text-bridal-gold-dark group-hover:underline underline-offset-2">
                            {row.original.name}
                        </span>
                        {row.original.email && (
                            <p className="text-xs text-muted-foreground">{row.original.email}</p>
                        )}
                    </div>
                </Link>
            );
        }
    },
    { accessorKey: "phone", header: "Phone Number" },
    {
        accessorKey: "total_booking",
        header: "Total Bookings",
        cell: ({ row }) => (
            <div className='max-w-32 flex justify-center'>
                <span className='bg-primary/20 text-primary rounded-md h-8 w-8 flex items-center justify-center font-medium'>{row.original.total_booking}</span>
            </div>
        )
    },
    {
        id: "last_booking",
        accessorFn: (row) => new Date(row.last_booking).getTime(),
        header: "Last Booking",
        cell: ({ row }) => formatDate((row.original?.last_booking as string) ?? ""),
        sortingFn: "basic",
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
            <RowActions data={row.original} onView={onView} />
        ),
    },
];

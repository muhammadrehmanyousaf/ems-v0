'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Booking, CustomersType } from '@/lib/dashboard-types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : ""

export const columns: ColumnDef<CustomersType>[] = [
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
        cell: ({ row }) => (
            <div className='flex items-center gap-2'>
                <Avatar className='h-[34px] w-[34px]'>
                    <AvatarFallback className='bg-primary/20 text-primary'>
                        {row.original.name.charAt(0).toLocaleUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {row.original.name}
            </div>
        )
    },
    { accessorKey: "phone", header: "Phone Number" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "address", header: "Address" },
    {
        accessorKey: "total_booking",
        header: "Total Bookings",
        cell: ({row})=> (
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
        cell: ({ row }) => <RowActions data={row.original} />,
    },
];

export const customers: CustomersType[] = [
    {
        _id: "BK-1001",
        name: "John Carter",
        phone: "+1 555 0123",
        email: "john@example.com",
        address: "123 Main Street, New York, USA",
        total_booking: 5,
        last_booking: "2025-08-15T14:30:00.000Z",
    },
    {
        _id: "BK-1002",
        name: "Sara Khan",
        phone: "+92 300 1112233",
        email: "sara@example.com",
        address: "Lahore, Pakistan",
        total_booking: 3,
        last_booking: "2025-08-16T09:00:00.000Z",
    },
    {
        _id: "BK-1003",
        name: "Michael Lee",
        phone: "+44 20 7946 0958",
        email: "michael.lee@example.co.uk",
        address: "London, UK",
        total_booking: 8,
        last_booking: "2025-08-17T16:00:00.000Z",
    },
    {
        _id: "BK-1004",
        name: "Ayesha Malik",
        phone: "+92 321 5556677",
        email: "ayesha.malik@example.com",
        address: "Karachi, Pakistan",
        total_booking: 2,
        last_booking: "2025-08-18T11:15:00.000Z",
    },
    {
        _id: "BK-1005",
        name: "David Brown",
        phone: "+1 404 555 8989",
        email: "david.brown@example.com",
        address: "Atlanta, USA",
        total_booking: 6,
        last_booking: "2025-08-19T13:45:00.000Z",
    },
    {
        _id: "BK-1006",
        name: "Fatima Noor",
        phone: "+971 50 123 4567",
        email: "fatima.noor@example.ae",
        address: "Dubai, UAE",
        total_booking: 4,
        last_booking: "2025-08-20T15:00:00.000Z",
    },
    {
        _id: "BK-1007",
        name: "Alex Johnson",
        phone: "+1 212 555 3344",
        email: "alex.j@example.com",
        address: "New York, USA",
        total_booking: 7,
        last_booking: "2025-08-21T10:30:00.000Z",
    },
    {
        _id: "BK-1008",
        name: "Zara Sheikh",
        phone: "+92 311 2223344",
        email: "zara.sheikh@example.com",
        address: "Islamabad, Pakistan",
        total_booking: 5,
        last_booking: "2025-08-22T09:15:00.000Z",
    },
    {
        _id: "BK-1009",
        name: "Chris Evans",
        phone: "+1 617 555 2299",
        email: "chris.evans@example.com",
        address: "Boston, USA",
        total_booking: 3,
        last_booking: "2025-08-23T12:00:00.000Z",
    },
    {
        _id: "BK-1010",
        name: "Mehwish Ahmed",
        phone: "+92 333 4567890",
        email: "mehwish.ahmed@example.com",
        address: "Faisalabad, Pakistan",
        total_booking: 2,
        last_booking: "2025-08-24T14:20:00.000Z",
    },
];

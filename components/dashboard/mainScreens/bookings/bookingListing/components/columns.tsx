'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Booking, BookingData } from '@/lib/dashboard-types';
import { cn } from '@/lib/utils';

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : ""

export const columns: ColumnDef<BookingData>[] = [
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
  { accessorKey: "customerName", header: "Full Name" },
  { accessorKey: "customerPhone", header: "Phone Number" },
  { accessorKey: "customerEmail", header: "Email" },
  // { accessorKey: "", header: "Event Type" },
  {
    id: "status",
    header: "Booking Status",
    cell: ({ row }) => {
      const status = row.original.status
      const color = status === "Pending" ?
        'border-amber-500 text-amber-800 bg-amber-50' : status === 'Confirmed' ?
          'border-blue-500 text-blue-600 bg-blue-50' : status === 'Completed' ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'
      return (
        <span className={cn('px-3 border h-7 flex items-center justify-center rounded-md font-medium dark:bg-transparent', color)}>
          {status.charAt(0).toUpperCase() +
            status.slice(1)}
        </span>
      )
    }
  },
  {
    id: "date",
    accessorFn: (row) => new Date(row.bookingDate).getTime(),
    header: "Booking Date",
    cell: ({ row }) => (
      `${formatDate((row.original?.bookingDate as string) ?? "")}, ${row.original.bookingTime}`
    ),
    sortingFn: "basic",
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <RowActions data={row.original} />,
  },
];

export const bookings: Booking[] = [
  {
    _id: "BK-1001",
    name: "John Carter",
    phone: "+1 555 0123",
    email: "john@example.com",
    event_type: "demo",
    status: "Completed",
    date: "2025-08-15T14:30:00.000Z",
  },
  {
    _id: "BK-1002",
    name: "Sara Khan",
    phone: "+92 300 1112233",
    email: "sara@example.com",
    event_type: "consultation",
    status: "Pending",
    date: "2025-08-16T09:00:00.000Z",
  },
  {
    _id: "BK-1003",
    name: "Michael Lee",
    phone: "+44 20 7946 0958",
    email: "michael.lee@example.co.uk",
    event_type: "installation",
    status: "Canceled",
    date: "2025-08-17T16:00:00.000Z",
  },
  {
    _id: "BK-1004",
    name: "Ayesha Malik",
    phone: "+92 321 5556677",
    email: "ayesha.malik@example.com",
    event_type: "support",
    status: "Pending",
    date: "2025-08-18T11:15:00.000Z",
  },
  {
    _id: "BK-1005",
    name: "David Brown",
    phone: "+1 404 555 8989",
    email: "david.brown@example.com",
    event_type: "demo",
    status: "Completed",
    date: "2025-08-19T13:45:00.000Z",
  },
  {
    _id: "BK-1006",
    name: "Fatima Noor",
    phone: "+971 50 123 4567",
    email: "fatima.noor@example.ae",
    event_type: "consultation",
    status: "Completed",
    date: "2025-08-20T15:00:00.000Z",
  },
  {
    _id: "BK-1007",
    name: "Alex Johnson",
    phone: "+1 212 555 3344",
    email: "alex.j@example.com",
    event_type: "installation",
    status: "Pending",
    date: "2025-08-21T10:30:00.000Z",
  },
  {
    _id: "BK-1008",
    name: "Zara Sheikh",
    phone: "+92 311 2223344",
    email: "zara.sheikh@example.com",
    event_type: "support",
    status: "Completed",
    date: "2025-08-22T09:15:00.000Z",
  },
  {
    _id: "BK-1009",
    name: "Chris Evans",
    phone: "+1 617 555 2299",
    email: "chris.evans@example.com",
    event_type: "follow_up",
    status: "Pending",
    date: "2025-08-23T12:00:00.000Z",
  },
  {
    _id: "BK-1010",
    name: "Mehwish Ahmed",
    phone: "+92 333 4567890",
    email: "mehwish.ahmed@example.com",
    event_type: "demo",
    status: "Pending",
    date: "2025-08-24T14:20:00.000Z",
  },
  {
    _id: "BK-1011",
    name: "Ryan Smith",
    phone: "+1 646 555 1122",
    email: "ryan.smith@example.com",
    event_type: "consultation",
    status: "Completed",
    date: "2025-08-25T08:45:00.000Z",
  },
  {
    _id: "BK-1012",
    name: "Ali Raza",
    phone: "+92 321 9876543",
    email: "ali.raza@example.com",
    event_type: "installation",
    status: "Completed",
    date: "2025-08-26T10:00:00.000Z",
  },
  {
    _id: "BK-1013",
    name: "Emily Davis",
    phone: "+44 161 555 7788",
    email: "emily.davis@example.co.uk",
    event_type: "support",
    status: "Canceled",
    date: "2025-08-27T11:10:00.000Z",
  },
  {
    _id: "BK-1014",
    name: "Usman Ali",
    phone: "+92 301 1234567",
    email: "usman.ali@example.com",
    event_type: "follow_up",
    status: "Pending",
    date: "2025-08-28T13:25:00.000Z",
  },
  {
    _id: "BK-1015",
    name: "Hannah Taylor",
    phone: "+1 305 555 7788",
    email: "hannah.taylor@example.com",
    event_type: "demo",
    status: "Pending",
    date: "2025-08-29T15:40:00.000Z",
  },
  {
    _id: "BK-1016",
    name: "Bilal Khan",
    phone: "+92 334 1112233",
    email: "bilal.khan@example.com",
    event_type: "consultation",
    status: "Completed",
    date: "2025-08-30T09:05:00.000Z",
  },
  {
    _id: "BK-1017",
    name: "Sophia Wilson",
    phone: "+1 818 555 6655",
    email: "sophia.wilson@example.com",
    event_type: "installation",
    status: "Pending",
    date: "2025-08-31T16:15:00.000Z",
  },
  {
    _id: "BK-1018",
    name: "Ahmed Hassan",
    phone: "+92 312 6549870",
    email: "ahmed.hassan@example.com",
    event_type: "support",
    status: "Pending",
    date: "2025-09-01T14:50:00.000Z",
  },
  {
    _id: "BK-1019",
    name: "Olivia Martinez",
    phone: "+34 91 555 1212",
    email: "olivia.martinez@example.es",
    event_type: "follow_up",
    status: "Completed",
    date: "2025-09-02T11:35:00.000Z",
  },
  {
    _id: "BK-1020",
    name: "Hamza Yousaf",
    phone: "+92 335 2223344",
    email: "hamza.yousaf@example.com",
    event_type: "demo",
    status: "Completed",
    date: "2025-09-03T10:10:00.000Z",
  },
]

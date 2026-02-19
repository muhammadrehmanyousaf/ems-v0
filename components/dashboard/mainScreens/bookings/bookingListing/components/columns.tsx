'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingData } from '@/lib/dashboard-types';
import { cn } from '@/lib/utils';

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : ""

const statusColors: Record<string, string> = {
  Pending: 'border-amber-500 text-amber-800 bg-amber-50',
  Confirmed: 'border-blue-500 text-blue-600 bg-blue-50',
  Completed: 'border-green-500 text-green-600 bg-green-50',
  Cancelled: 'border-red-500 text-red-600 bg-red-50',
}

const paymentColors: Record<string, string> = {
  Pending: 'border-amber-400 text-amber-700 bg-amber-50',
  Partial: 'border-blue-400 text-blue-700 bg-blue-50',
  Paid: 'border-green-400 text-green-700 bg-green-50',
}

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
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm text-neutral-900">{row.original.customerName}</p>
        <p className="text-xs text-neutral-400">{row.original.customerPhone}</p>
      </div>
    ),
  },
  {
    id: "service",
    header: "Service",
    cell: ({ row }) => {
      const details = row.original.bookingDetails || []
      if (details.length === 0) return <span className="text-xs text-neutral-400">-</span>
      const first = details[0]
      return (
        <div>
          <p className="text-sm text-neutral-800 truncate max-w-[160px]">{first.business?.name || '-'}</p>
          {first.package?.name && (
            <p className="text-xs text-purple-600 truncate max-w-[160px]">{first.package.name}</p>
          )}
        </div>
      )
    },
  },
  {
    id: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const details = row.original.bookingDetails || []
      const vendorTotal = details.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0)
      const amount = vendorTotal > 0 ? vendorTotal : Number(row.original.totalAmount) || 0
      return (
        <p className="text-sm font-semibold text-neutral-900">Rs. {amount.toLocaleString()}</p>
      )
    },
    sortingFn: "basic",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <span className={cn('px-2.5 py-1 border text-xs rounded-md font-medium inline-flex items-center', statusColors[status] || 'border-neutral-300 text-neutral-600 bg-neutral-50')}>
          {status}
        </span>
      )
    }
  },
  {
    id: "payment",
    header: "Payment",
    cell: ({ row }) => {
      const ps = row.original.paymentStatus || 'Pending'
      return (
        <span className={cn('px-2.5 py-1 border text-xs rounded-md font-medium inline-flex items-center', paymentColors[ps] || 'border-neutral-300 text-neutral-600 bg-neutral-50')}>
          {ps}
        </span>
      )
    }
  },
  {
    id: "date",
    accessorFn: (row) => new Date(row.bookingDate).getTime(),
    header: "Date",
    cell: ({ row }) => (
      <div>
        <p className="text-sm text-neutral-800">{formatDate(row.original.bookingDate)}</p>
        <p className="text-xs text-neutral-400">{row.original.bookingTime}</p>
      </div>
    ),
    sortingFn: "basic",
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <RowActions data={row.original} />,
  },
];

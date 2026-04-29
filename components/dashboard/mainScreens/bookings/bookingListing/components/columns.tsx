'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Globe, Store } from 'lucide-react';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingData } from '@/lib/dashboard-types';
import { cn } from '@/lib/utils';

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : ""

const formatTime = (time?: string) => {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (isNaN(h)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${period}`
}

const statusColors: Record<string, string> = {
  'Awaiting Payment': 'border-orange-400 text-orange-700 bg-orange-50',
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
    accessorFn: (row) => {
      const details = row.bookingDetails || []
      if (details.length === 0) return '-'
      const first = details[0]
      return [first.business?.name, first.package?.name].filter(Boolean).join(' – ')
    },
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
    accessorFn: (row) => {
      const details = row.bookingDetails || []
      const vendorTotal = details.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0)
      return vendorTotal > 0 ? vendorTotal : Number(row.totalAmount) || 0
    },
    cell: ({ row }) => {
      const details = row.original.bookingDetails || []
      const vendorTotal = details.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0)
      const vendorDP    = details.reduce((sum, d) => sum + (Number(d.downPayment)  || 0), 0)
      const total = vendorTotal > 0 ? vendorTotal : Number(row.original.totalAmount) || 0
      const dp    = vendorDP    > 0 ? vendorDP    : Number(row.original.downPayment)  || 0
      const ps   = row.original.paymentStatus
      const paid = ps === 'Paid' ? total : ps === 'Partial' ? dp : 0
      const due  = Math.max(0, total - paid)
      return (
        <div>
          <p className="text-sm font-semibold text-neutral-900">Rs. {total.toLocaleString()}</p>
          <p className="text-xs mt-0.5 space-x-1">
            <span className="text-green-600 font-medium">Paid {paid.toLocaleString()}</span>
            {due > 0 && <span className="text-orange-500">· Due {due.toLocaleString()}</span>}
          </p>
        </div>
      )
    },
    sortingFn: "basic",
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.status,
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
    accessorFn: (row) => row.paymentStatus || 'Pending',
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
    id: "source",
    header: "Source",
    accessorFn: (row) => row.bookingSource === 'offline' ? 'Offline' : 'Online',
    cell: ({ row }) => {
      const isOffline = row.original.bookingSource === 'offline'
      return (
        <span className={cn(
          'px-2 py-0.5 border text-xs rounded-md font-medium inline-flex items-center gap-1',
          isOffline
            ? 'border-orange-300 text-orange-700 bg-orange-50'
            : 'border-blue-300 text-blue-700 bg-blue-50'
        )}>
          {isOffline
            ? <><Store className="h-3 w-3" />Offline</>
            : <><Globe className="h-3 w-3" />Online</>
          }
        </span>
      )
    },
  },
  {
    id: "date",
    accessorFn: (row) => row.bookingDate ? new Date(row.bookingDate).toLocaleDateString() : "",
    header: "Date",
    cell: ({ row }) => (
      <div>
        <p className="text-sm text-neutral-800">{formatDate(row.original.bookingDate)}</p>
        <p className="text-xs text-neutral-400">{formatTime(row.original.bookingTime)}</p>
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

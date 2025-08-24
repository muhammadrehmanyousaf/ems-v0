'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Role } from '@/lib/dashboard-types';
import { Switch } from '@/components/ui/switch';
import { formatDateTime } from '@/lib/utils';

export const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : ""

export const columns: ColumnDef<Role>[] = [
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
        accessorKey: "title",
        header: "Title",
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
            <span className='text-ellipsis whitespace-nowrap max-w-36 overflow-hidden truncate'>
                {row.original.description}
            </span>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <span>
                <Switch size='md' checked={row.original.status === 'active'} />
            </span>
        )
    },
    {
        id: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
            <span>
                {formatDateTime(row.original.createdAt)}
            </span>
        )
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <RowActions data={row.original} />,
    },
];

export const roles: Role[] = [
    {
        id: '1',
        title: 'Manager',
        description: 'He will manage everything.',
        status: 'active',
        createdAt: '2025-08-15T14:32:00Z'
    },
    {
        id: '2',
        title: 'Chef',
        description: 'He will cook food.',
        status: 'active',
        createdAt: '2025-08-15T14:32:00Z'
    },
    {
        id: '3',
        title: 'Waiter',
        description: 'He will serve the food.',
        status: 'active',
        createdAt: '2025-08-15T14:32:00Z'
    },
];
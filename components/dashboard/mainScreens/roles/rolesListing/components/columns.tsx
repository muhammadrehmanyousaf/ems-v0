'use client';
import { ColumnDef } from '@tanstack/react-table';
import { RowActions } from './row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Role } from '@/lib/dashboard-types';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const columns = (
    onEdit: (role: Role) => void,
    onDelete: (role: Role) => void,
): ColumnDef<Role>[] => [
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
        id: "name",
        accessorFn: (row) => row.name || row.title,
        header: "Title",
        cell: ({ row }) => (
            <span className="font-medium capitalize">
                {row.original.name || row.original.title}
            </span>
        ),
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
            <span className='text-ellipsis whitespace-nowrap max-w-44 overflow-hidden truncate block'>
                {row.original.description || "—"}
            </span>
        )
    },
    {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
                {row.original.type || "general"}
            </Badge>
        ),
    },
    {
        id: "users",
        header: "Users",
        cell: ({ row }) => {
            const count = row.original.users?.length ?? 0;
            return (
                <div className="max-w-16 flex justify-center">
                    <span className="bg-primary/20 text-primary rounded-md h-8 w-8 flex items-center justify-center font-medium">
                        {count}
                    </span>
                </div>
            );
        },
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
        cell: ({ row }) => (
            <RowActions
                data={row.original}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        ),
    },
];

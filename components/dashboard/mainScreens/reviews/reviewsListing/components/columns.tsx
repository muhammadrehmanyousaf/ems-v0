'use client';
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { Review } from "@/lib/dashboard-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { StartComponent } from "./star-component";

export const columns = (
    onView: (review: Review) => void,
    onDelete: (review: Review) => void,
    onReply: (review: Review) => void,
): ColumnDef<Review>[] => [
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
        accessorKey: "reviewerName",
        header: "Full Name",
        cell: ({ row }) => (
            <div className='flex items-center gap-2'>
                <Avatar className='h-[34px] w-[34px]'>
                    <AvatarFallback className='bg-primary/20 text-primary'>
                        {row.original.reviewerName?.charAt(0).toLocaleUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <span className="font-medium">{row.original.reviewerName}</span>
                    {row.original.email && (
                        <p className="text-xs text-muted-foreground">{row.original.email}</p>
                    )}
                </div>
            </div>
        )
    },
    { accessorKey: "phone", header: "Phone Number" },
    { accessorKey: "bookingId", header: "Booking Id" },
    {
        id: "businessName",
        header: "Business",
        cell: ({ row }) => (
            <span className="whitespace-nowrap">{row.original.businessName || "—"}</span>
        ),
    },
    {
        id: 'rating',
        header: "Rating",
        cell: ({ row }) => <StartComponent value={row.original.rating} />
    },
    {
        id: 'createdAt',
        header: "Date",
        cell: ({ row }) => (
            <span>{formatDateTime(row.original.createdAt)}</span>
        )
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
            <RowActions
                data={row.original}
                onView={onView}
                onDelete={onDelete}
                onReply={onReply}
            />
        ),
    },
];

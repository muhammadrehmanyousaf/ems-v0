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
    // WWL-356 — no onDelete. A business cannot delete a review written about it.
    onReply: (review: Review) => void,
    onPin?: (review: Review) => void,
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
                // WWL-369/WWL-120 — every row announced the identical "Select row", so a
                // screen-reader user could not tell which review they were about to act on.
                aria-label={`Select review by ${row.original.reviewerName || "unknown reviewer"}`}
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
    {
        accessorKey: "bookingId",
        header: "Booking Id",
        cell: ({ row }) => {
            const id = row.original.bookingId
            return <span className="whitespace-nowrap">{id ? `#${id}` : "—"}</span>
        },
    },
    /**
     * WWL-357 — these three were declared with an `id` and a `cell` renderer
     * and NO `accessorKey`. `exportTableToCSV` reads `row.getValue(col.id)`,
     * and with no accessor there is nothing for `getValue` to call, so every
     * cell resolved to `undefined` → "". Three of the six promised columns
     * came out empty in every row of the export:
     *
     *   Full Name,Phone Number,Booking Id,Business,Rating,Date
     *   Zeeshan Akram,0335755699,#165,,,
     *
     * One of the empty ones is the rating — the only number the file exists to
     * carry. `accessorKey` gives `getValue` something to read; the `cell`
     * renderers are untouched, so the grid looks exactly as it did.
     */
    {
        accessorKey: "businessName",
        id: "businessName",
        header: "Business",
        cell: ({ row }) => (
            <span className="whitespace-nowrap">{row.original.businessName || "—"}</span>
        ),
    },
    {
        accessorKey: "rating",
        id: 'rating',
        header: "Rating",
        cell: ({ row }) => <StartComponent value={row.original.rating} />
    },
    {
        accessorKey: "createdAt",
        id: 'createdAt',
        header: "Date",
        cell: ({ row }) => (
            <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>
        )
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
            <RowActions
                data={row.original}
                onView={onView}
                onReply={onReply}
                onPin={onPin}
            />
        ),
    },
];

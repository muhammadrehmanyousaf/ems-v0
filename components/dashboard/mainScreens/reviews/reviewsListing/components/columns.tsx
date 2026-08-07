'use client';
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { Review } from "@/lib/dashboard-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { StartComponent } from "./star-component";
import { ArrowUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";

/**
 * WWL-368 — `getSortedRowModel` was wired into the shared hook and no header
 * exposed a control to reach it, so all eight headers were plain strings with
 * `cursor: auto` and no `aria-sort`. A reviews screen that cannot be sorted by
 * rating or date cannot answer either question it is opened to answer.
 */
function SortableHeader({ column, label }: { column: Column<Review, unknown>; label: string }) {
    const dir = column.getIsSorted();
    return (
        <button
            type="button"
            onClick={() => column.toggleSorting(dir === "asc")}
            aria-label={`Sort by ${label}${dir === "asc" ? ", currently ascending" : dir === "desc" ? ", currently descending" : ""}`}
            className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {label}
            <ArrowUpDown className={dir ? "h-3 w-3 text-foreground" : "h-3 w-3 opacity-40"} />
        </button>
    );
}

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
            /**
             * WWL-363 — the API used to send `#165` under a field named
             * `bookingId`, and this prefixed it again: every row read `##165`.
             * A review with no booking arrived as the STRING "#null", which is
             * truthy, so this em-dash was unreachable. The wire carries the
             * number now; the hash belongs here, once.
             */
            const id = row.original.bookingId
            const n = typeof id === "string" ? id.replace(/^#/, "") : id
            return <span className="whitespace-nowrap">{n && n !== "null" ? `#${n}` : "—"}</span>
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
        header: ({ column }) => <SortableHeader column={column} label="Rating" />,
        cell: ({ row }) => <StartComponent value={row.original.rating} />
    },
    {
        accessorKey: "createdAt",
        id: 'createdAt',
        header: ({ column }) => <SortableHeader column={column} label="Date" />,
        cell: ({ row }) => (
            <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>
        )
    },
    /**
     * WWL-368 — the review itself had no column: reading one meant opening the
     * row menu and choosing View, one at a time, on the screen whose entire
     * purpose is reading reviews. And "which have I not replied to?" was
     * unanswerable — the panel above says 100% and the table could not show the
     * other 0%.
     *
     * The text column is also what makes the global search (WWL-366) able to
     * reach the words inside a review, which is what a vendor actually types.
     */
    {
        accessorKey: "reviewText",
        id: "reviewText",
        header: "Review",
        cell: ({ row }) => (
            <p className="max-w-[320px] truncate text-muted-foreground" title={row.original.reviewText || undefined}>
                {row.original.reviewText || "—"}
            </p>
        ),
    },
    {
        accessorKey: "vendorReply",
        id: "vendorReply",
        header: "Replied",
        cell: ({ row }) =>
            row.original.vendorReply ? (
                <span className="whitespace-nowrap text-xs font-medium text-emerald-700 dark:text-emerald-400">Replied</span>
            ) : (
                <span className="whitespace-nowrap text-xs text-amber-700 dark:text-amber-400">Awaiting reply</span>
            ),
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

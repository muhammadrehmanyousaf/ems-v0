'use client';
import { Checkbox } from "@/components/ui/checkbox";
import { Business } from "@/lib/dashboard-types";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const businessColumns = (
    onView: (business: Business) => void,
    onDelete: (business: Business) => void,
): ColumnDef<Business>[] => [
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
    { accessorKey: "name", header: "Business Name" },
    {
        id: "vendorType",
        header: "Type",
        cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
                {row.original.vendorType || row.original.type || "N/A"}
            </Badge>
        ),
    },
    {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
            <span className="whitespace-nowrap">
                {[row.original.city, row.original.subArea].filter(Boolean).join(", ") || "N/A"}
            </span>
        ),
    },
    {
        id: "vendorName",
        header: "Vendor",
        cell: ({ row }) => (
            <span className="whitespace-nowrap">{row.original.vendorName || "N/A"}</span>
        ),
    },
    {
        accessorKey: "total_packages",
        header: "Packages",
        cell: ({ row }) => (
            <div className="max-w-16 flex justify-center">
                <span className="bg-primary/20 text-primary rounded-md h-8 w-8 flex items-center justify-center font-medium">
                    {row.original.total_packages ?? 0}
                </span>
            </div>
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
            <span>{formatDateTime(row.original.createdAt ?? "")}</span>
        ),
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
            <RowActions
                data={row.original}
                onView={onView}
                onDelete={onDelete}
            />
        ),
    },
];

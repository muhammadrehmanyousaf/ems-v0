import { Checkbox } from "@/components/ui/checkbox";
import { Business } from "@/lib/dashboard-types";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { formatDateTime } from "@/lib/utils";

export const businessColumns: ColumnDef<Business>[] = [
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
  { accessorKey: "type", header: "Type" },
  { accessorKey: "total_packages", header: "Total Packages" },
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
    cell: ({ row }) => <RowActions data={row.original} />,
  },
];

export const businesses: Business[] = [
  {
    id: "1",
    name: "Khan Fashion Hub",
    type: "Clothing",
    total_packages: 12,
    createdAt: "2025-06-10T09:15:00Z",
  },
  {
    id: "2",
    name: "Tech World",
    type: "Electronics",
    total_packages: 8,
    createdAt: "2025-07-02T14:40:00Z",
  },
  {
    id: "3",
    name: "Raza Foods",
    type: "Food & Beverages",
    total_packages: 20,
    createdAt: "2025-05-18T11:30:00Z",
  },
  {
    id: "4",
    name: "Elegant Interiors",
    type: "Home Decor",
    total_packages: 5,
    createdAt: "2025-08-12T17:20:00Z",
  },
  {
    id: "5",
    name: "Tariq Sports Store",
    type: "Sports",
    total_packages: 15,
    createdAt: "2025-04-25T10:00:00Z",
  },
];

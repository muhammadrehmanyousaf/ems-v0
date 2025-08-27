import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { User, Vendor } from "@/lib/dashboard-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export const columns: ColumnDef<Vendor>[] = [
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
        accessorKey: "fullName",
        header: "Full Name",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar className="h-[34px] w-[34px]">
                    <AvatarFallback className="bg-primary/20 text-primary">
                        {row.original.fullName.charAt(0).toLocaleUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {row.original.fullName}
            </div>
        ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phoneNumber", header: "Phone Number" },
    { accessorKey: "BusinessName", header: "Business Name" },
    { accessorKey: "businessType", header: "Business Type" },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Switch
                size="md"
                checked={row.original.status === "Active"}
                onCheckedChange={() => {
                    // here you can add toggle logic
                    console.log("Status toggled for", row.original.fullName);
                }}
            />
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Date",
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

export const vendors: Vendor[] = [
    {
        id: '1',
        fullName: "Ali Khan",
        email: "ali.khan@example.com",
        phoneNumber: "+92-300-1234567",
        businessType: "Clothing",
        BusinessName: "Khan Fashion Hub",
        status: "Active",
        createdAt: "2025-08-01T10:30:00Z",
    },
    {
        id: '2',
        fullName: "Sara Ahmed",
        email: "sara.ahmed@example.com",
        phoneNumber: "+92-321-7654321",
        businessType: "Electronics",
        BusinessName: "Tech World",
        status: "Inactive",
        createdAt: "2025-07-25T15:45:00Z",
    },
    {
        id: '3',
        fullName: "Hassan Raza",
        email: "hassan.raza@example.com",
        phoneNumber: "+92-333-9876543",
        businessType: "Food & Beverages",
        BusinessName: "Raza Foods",
        status: "Active",
        createdAt: "2025-06-15T09:00:00Z",
    },
    {
        id: '4',
        fullName: "Maria Iqbal",
        email: "maria.iqbal@example.com",
        phoneNumber: "+92-345-4567890",
        businessType: "Home Decor",
        BusinessName: "Elegant Interiors",
        status: "Pending",
        createdAt: "2025-08-20T18:20:00Z",
    },
    {
        id: '5',
        fullName: "Usman Tariq",
        email: "usman.tariq@example.com",
        phoneNumber: "+92-301-6549872",
        businessType: "Sports",
        BusinessName: "Tariq Sports Store",
        status: "Active",
        createdAt: "2025-05-10T12:10:00Z",
    },
];
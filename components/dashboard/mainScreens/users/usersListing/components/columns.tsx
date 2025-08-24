import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { User } from "@/lib/dashboard-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export const columns: ColumnDef<User>[] = [
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
        accessorKey: "fullName",
        header: "Full Name",
        cell: ({ row }) => (
            <div className='flex items-center gap-2'>
                <Avatar className='h-[34px] w-[34px]'>
                    <AvatarFallback className='bg-primary/20 text-primary'>
                        {row.original.fullName.charAt(0).toLocaleUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {row.original.fullName}
            </div>
        )
    },
    { accessorKey: "phoneNumber", header: "Phone Number" },
    { accessorKey: "role", header: "Role" },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
            <span>
                <Switch size="md" />
            </span>
        )
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
        cell: ({ row }) =>
            <RowActions data={row.original} />,
    },
];

export const users: User[] = [
    {
        id: 1,
        fullName: "Sophie Khan",
        phoneNumber: "+92-300-1234557",
        role: "Admin",
        status: true,
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: 2,
        fullName: "Ahmed Ali",
        phoneNumber: "+92-321-8765432",
        role: "Vendor",
        status: true,
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: 3,
        fullName: "Hassan Raza",
        phoneNumber: "+92-334-1825456",
        role: "Vendor",
        status: false,
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: 4,
        fullName: "Sana Malik",
        phoneNumber: "+92-334-1925456",
        role: "Manager",
        status: true,
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: 5,
        fullName: "Bilal Hussain",
        phoneNumber: "+92-310-6547890",
        role: "Admin",
        status: false,
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: 6,
        fullName: "Zainab Malik",
        phoneNumber: "+92-345-9876543",
        role: "Vendor",
        status: true,
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: 7,
        fullName: "Hamza Tariq",
        phoneNumber: "+92-333-5678901",
        role: "Manager",
        status: true,
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: 8,
        fullName: "Sara Ahmed",
        phoneNumber: "+92-321-4567890",
        role: "Vendor",
        status: false,
        createdAt: "2025-08-14 06:10 PM"
    },
];
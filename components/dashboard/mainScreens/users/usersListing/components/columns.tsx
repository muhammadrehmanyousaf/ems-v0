'use client';
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { User } from "@/lib/dashboard-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UsersAPI } from "@/lib/api/dashboard";
import { toast } from "sonner";

export const columns = (
    onEdit: (user: User) => void,
    onDelete: (user: User) => void,
): ColumnDef<User>[] => [
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
                        {row.original.fullName?.charAt(0).toLocaleUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <span className="font-medium">{row.original.fullName}</span>
                    {row.original.email && (
                        <p className="text-xs text-muted-foreground">{row.original.email}</p>
                    )}
                </div>
            </div>
        )
    },
    { accessorKey: "phoneNumber", header: "Phone Number" },
    {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
            const roles = row.original.roles || [];
            return (
                <div className="flex flex-wrap gap-1">
                    {roles.length > 0 ? roles.map((r) => (
                        <Badge key={r.id} variant="outline" className="text-xs capitalize">
                            {r.name}
                        </Badge>
                    )) : (
                        <Badge variant="secondary" className="text-xs">No role</Badge>
                    )}
                </div>
            );
        }
    },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const StatusSwitch = () => {
                const [checked, setChecked] = React.useState(row.original.active);
                const handleToggle = async (value: boolean) => {
                    setChecked(value);
                    try {
                        await UsersAPI.changeStatus(row.original.id, value);
                        toast.success(`User ${value ? 'activated' : 'deactivated'}`);
                    } catch {
                        setChecked(!value);
                        toast.error("Failed to update status");
                    }
                };
                return (
                    <Switch
                        size="md"
                        checked={checked}
                        onCheckedChange={handleToggle}
                    />
                );
            };
            return <StatusSwitch />;
        }
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
                onEdit={onEdit}
                onDelete={onDelete}
            />
        ),
    },
];

'use client';
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { Vendor } from "@/lib/dashboard-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosConfig";
import React from "react";
import { BACKEND_URL } from "@/lib/backend-url";

export const columns = (
    onEdit: (vendor: Vendor) => void,
    onDelete: (vendor: Vendor) => void,
    /** Issue #3 — open the profile-review dialog. Optional so legacy
        callers without the dialog keep compiling. */
    onView?: (vendor: Vendor) => void,
): ColumnDef<Vendor>[] => [
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
                        {row.original.fullName?.charAt(0).toLocaleUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <span className="font-medium">{row.original.fullName}</span>
                    <p className="text-xs text-muted-foreground">{row.original.email}</p>
                </div>
            </div>
        ),
    },
    { accessorKey: "phoneNumber", header: "Phone Number" },
    {
        id: "vendorType",
        header: "Vendor Type",
        cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
                {row.original.vendorType || "N/A"}
            </Badge>
        ),
    },
    {
        id: "profileApproval",
        header: "Profile Approved",
        cell: ({ row }) => {
            const ProfileSwitch = () => {
                const [checked, setChecked] = React.useState(row.original.reviewProfile ?? false);
                const handleToggle = async (value: boolean) => {
                    setChecked(value);
                    try {
                        await axiosInstance.patch(
                            `${BACKEND_URL}api/v1/users/vendor-profile-update?id=${row.original.id}&reviewProfile=${value}`
                        );
                        toast.success(
                            `Vendor profile ${value ? "approved" : "unapproved"}`
                        );
                    } catch {
                        setChecked(!value);
                        toast.error("Failed to update vendor profile status");
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
            return <ProfileSwitch />;
        },
    },
    {
        id: "activeStatus",
        header: "Active",
        cell: ({ row }) => {
            const ActiveSwitch = () => {
                const [active, setActive] = React.useState(row.original.active ?? true);
                const handleToggle = async (value: boolean) => {
                    setActive(value);
                    try {
                        await axiosInstance.patch(
                            `/api/v1/users/change-status?id=${row.original.id}&active=${value}`
                        );
                        toast.success(
                            `Vendor ${value ? "activated" : "deactivated"}`
                        );
                    } catch {
                        setActive(!value);
                        toast.error("Failed to update vendor status");
                    }
                };
                return (
                    <Switch
                        size="md"
                        checked={active}
                        onCheckedChange={handleToggle}
                    />
                );
            };
            return <ActiveSwitch />;
        },
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
        cell: ({ row }) => (
            <RowActions
                data={row.original}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
            />
        ),
    },
];

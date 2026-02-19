'use client';

import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Vendor } from "@/lib/dashboard-types";

interface RowActionsProps {
    data: Vendor;
    onEdit: (vendor: Vendor) => void;
    onDelete: (vendor: Vendor) => void;
}

export function RowActions({ data, onEdit, onDelete }: RowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                    aria-label="Open actions"
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={() => onEdit(data)}>
                    <PencilLine className="size-4 opacity-70" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    onClick={() => onDelete(data)}
                >
                    <Trash2 className="size-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

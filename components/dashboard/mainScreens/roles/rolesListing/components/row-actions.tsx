"use client"

import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Role } from "@/lib/dashboard-types"

interface DataTableRowActionsProps {
    data: Role;
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
}

export function RowActions({ data, onEdit, onDelete }: DataTableRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                >
                    <MoreHorizontal />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
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
    )
}

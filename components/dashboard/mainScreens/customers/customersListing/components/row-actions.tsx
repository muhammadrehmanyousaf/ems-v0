"use client"

import Link from "next/link"
import { Eye, MoreHorizontal, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomersType } from "@/lib/dashboard-types"

interface DataTableRowActionsProps {
    data: CustomersType;
    onView: (customer: CustomersType) => void;
}

export function RowActions({ data, onView }: DataTableRowActionsProps) {
    const id = data._id || ''
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
            <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={() => onView(data)}>
                    <Eye className="size-4 opacity-70" />
                    Quick view
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2">
                    <Link href={`/dashboard/customers/${encodeURIComponent(id)}`}>
                        <ExternalLink className="size-4 opacity-70" />
                        Open detail page
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

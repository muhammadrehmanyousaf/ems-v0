"use client";

import { Eye, MoreHorizontal, Trash2, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Review } from "@/lib/dashboard-types";

interface RowActionsProps {
    data: Review;
    onView: (review: Review) => void;
    onDelete: (review: Review) => void;
    onReply: (review: Review) => void;
}

export function RowActions({ data, onView, onDelete, onReply }: RowActionsProps) {
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
                <DropdownMenuItem className="gap-2" onClick={() => onView(data)}>
                    <Eye className="size-4 opacity-70" />
                    View
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => onReply(data)}>
                    <MessageSquareReply className="size-4 opacity-70" />
                    {data.vendorReply ? "Edit Reply" : "Reply"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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

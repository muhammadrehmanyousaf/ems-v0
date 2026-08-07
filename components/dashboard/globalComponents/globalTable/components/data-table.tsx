"use client"

import * as React from "react"
import type { Table as RTTable, Row as RTRow } from "@tanstack/react-table"
import { flexRender } from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { formatColumnId } from "@/lib/utils"

type CoreDataTableProps<TData extends object> = {
    table: RTTable<TData>
}

/**
 * F4 / WWL-053, 086, 093, 122, 146, 160, 244, 265, 280, 296, 377, 391, 459 —
 * "on a phone, nothing on a row can be done at all".
 *
 * Every screen built on this table rendered a single horizontally-scrolling grid
 * at every width. The `actions` column is the last one, so on a 360px phone it
 * sits far off the right edge of a scroller most people never discover — and the
 * sweep confirmed it by driving the real device: a booking could not be opened,
 * a receipt could not be edited, a cheque could not be marked cleared, a staff
 * row could not be actioned. Whole modules were readable and inert.
 *
 * Below `md` the same column config now renders as cards, with the actions cell
 * lifted out and given the full width at the bottom, where a thumb can reach it.
 * Nothing changes at desktop width.
 */
const ACTION_KEYS = new Set(["actions", "action", "row-actions", "rowActions", "menu"])
const SELECT_KEYS = new Set(["select", "selection"])

/** A human label for a card row: the string header if there is one, else the id. */
function labelFor(columnDef: { header?: unknown }, id: string): React.ReactNode {
    const h = columnDef?.header
    if (typeof h === "string") return h
    if (typeof h === "number") return String(h)
    return formatColumnId(id)
}

function MobileCards<TData extends object>({ table }: CoreDataTableProps<TData>) {
    const rows = table.getRowModel().rows
    if (!rows?.length) {
        return (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground md:hidden">
                No results.
            </div>
        )
    }
    return (
        <div className="space-y-2 md:hidden">
            {rows.map((row: RTRow<TData>) => {
                const cells = row.getVisibleCells()
                const select = cells.filter((c) => SELECT_KEYS.has(c.column.id))
                const actions = cells.filter((c) => ACTION_KEYS.has(c.column.id))
                const fields = cells.filter(
                    (c) => !ACTION_KEYS.has(c.column.id) && !SELECT_KEYS.has(c.column.id),
                )
                return (
                    <div
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="rounded-lg border bg-card p-3 data-[state=selected]:border-primary/60"
                    >
                        {select.length > 0 && (
                            <div className="mb-2 flex items-center gap-2 border-b pb-2">
                                {select.map((c) => (
                                    <React.Fragment key={c.id}>
                                        {flexRender(c.column.columnDef.cell, c.getContext())}
                                    </React.Fragment>
                                ))}
                                <span className="text-xs text-muted-foreground">Select</span>
                            </div>
                        )}
                        <dl className="space-y-1.5">
                            {fields.map((c) => (
                                <div key={c.id} className="flex items-start justify-between gap-3">
                                    <dt className="shrink-0 text-xs text-muted-foreground">
                                        {labelFor(c.column.columnDef, c.column.id)}
                                    </dt>
                                    <dd className="min-w-0 break-words text-right text-sm">
                                        {flexRender(c.column.columnDef.cell, c.getContext())}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        {actions.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-2 border-t pt-2">
                                {actions.map((c) => (
                                    <React.Fragment key={c.id}>
                                        {flexRender(c.column.columnDef.cell, c.getContext())}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export function DataTable<TData extends object>({
    table,
}: CoreDataTableProps<TData>) {
    return (
        <div className="w-full">
            {/* Desktop / tablet grid — unchanged. */}
            <ScrollArea className="hidden w-full max-w-full h-[calc(100dvh-260px)] overflow-auto rounded-md border md:grid md:h-[calc(100dvh-256px)]">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((h) => (
                                    <TableHead scope="col" key={h.id} colSpan={h.colSpan} className="whitespace-nowrap">
                                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <MobileCards table={table} />
        </div>
    )
}

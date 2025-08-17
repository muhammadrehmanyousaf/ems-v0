"use client"

import type { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { DataTableColumnView } from "@/components/dashboard/globalComponents/globalTable/components/data-table-column-view"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
}

export function PaymentTableActions<TData>({
    table,
}: DataTableToolbarProps<TData>) {

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Search Name..."
                    value={(table.getColumn("customerName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("customerName")?.setFilterValue(event.target.value)
                    }
                    className="h-9 w-[250px] xl:w-[300px]"
                />
            </div>
            <div className="ml-auto hidden lg:flex">
                <DataTableColumnView table={table} />
            </div>
        </div>
    )
}
import React from 'react'
import { DataTableColumnView } from '@/components/dashboard/globalComponents/globalTable/components/data-table-column-view'
import { Input } from '@/components/ui/input'
import type { Table } from "@tanstack/react-table"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
}

function UserTableActions<TData>({
    table,
}: DataTableToolbarProps<TData>) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Search user..."
                    value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("fullName")?.setFilterValue(event.target.value)
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

export default UserTableActions

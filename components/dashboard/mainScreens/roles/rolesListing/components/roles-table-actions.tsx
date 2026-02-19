import React from 'react'
import type { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DataTableColumnView } from "@/components/dashboard/globalComponents/globalTable/components/data-table-column-view"
import { exportTableToCSV } from "@/lib/utils/csv-export"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
}

export function RolesTableActions<TData>({ table }: DataTableToolbarProps<TData>) {

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Search role..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="h-9 w-[250px] xl:w-[300px]"
                />
            </div>
            <div className="ml-auto hidden lg:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => exportTableToCSV(table, "roles")}>
                    <Download className="mr-2 h-4 w-4" />Export
                </Button>
                <DataTableColumnView table={table} />
            </div>
        </div>
    )
}
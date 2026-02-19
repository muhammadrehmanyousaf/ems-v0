"use client"

import type { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Download, Plus } from "lucide-react"
import { DataTableColumnView } from "@/components/dashboard/globalComponents/globalTable/components/data-table-column-view"
import { DataTableSearch } from "@/components/dashboard/globalComponents/globalTable/components/data-table-search"
import { exportTableToCSV } from "@/lib/utils/csv-export"
import { Options } from "nuqs"

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
    searchQuery: string;
    setSearchQuery: (
        value: string | ((old: string) => string | null) | null,
        options?: Options<any> | undefined
    ) => Promise<URLSearchParams>;
    setPage: <Shallow>(
        value: number | ((old: number) => number | null) | null,
        options?: Options<Shallow> | undefined
    ) => Promise<URLSearchParams>;
    onAddBooking?: () => void;
}

export function BookingTableActions<TData>({
    table,
    searchQuery,
    setPage,
    setSearchQuery,
    onAddBooking,
}: DataTableToolbarProps<TData>) {

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <DataTableSearch
                    searchKey={'name'}
                    placeholder={'Search'}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setPage={setPage}
                />
            </div>
            <div className="ml-auto flex items-center gap-2">
                {onAddBooking && (
                    <Button size="sm" onClick={onAddBooking}>
                        <Plus className="mr-2 h-4 w-4" />Add Booking
                    </Button>
                )}
                <Button variant="outline" size="sm" className="hidden lg:flex" onClick={() => exportTableToCSV(table, "bookings")}>
                    <Download className="mr-2 h-4 w-4" />Export
                </Button>
                <div className="hidden lg:flex">
                    <DataTableColumnView table={table} />
                </div>
            </div>
        </div>
    )
}

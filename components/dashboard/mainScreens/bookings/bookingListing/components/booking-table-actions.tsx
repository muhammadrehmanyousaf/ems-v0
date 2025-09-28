"use client"

import type { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { DataTableColumnView } from "@/components/dashboard/globalComponents/globalTable/components/data-table-column-view"
import { DataTableSearch } from "@/components/dashboard/globalComponents/globalTable/components/data-table-search"
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
}

export function BookingTableActions<TData>({
    table,
    searchQuery,
    setPage,
    setSearchQuery,
}: DataTableToolbarProps<TData>) {

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                {/* <Input
                    placeholder="Search Booking..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="h-9 w-[250px] xl:w-[300px]"
                /> */}
                <DataTableSearch
                    searchKey={'name'}
                    placeholder={'Search'}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setPage={setPage}
                />
            </div>
            <div className="ml-auto hidden lg:flex">
                <DataTableColumnView table={table} />
            </div>
        </div>
    )
}
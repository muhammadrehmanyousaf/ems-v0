import React from 'react'
import { DataTableColumnView } from '@/components/dashboard/globalComponents/globalTable/components/data-table-column-view'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportTableToCSV } from '@/lib/utils/csv-export'
import type { Table } from "@tanstack/react-table"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
}

function ReviewsTableActions<TData>({
    table,
}: DataTableToolbarProps<TData>) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                {/**
                  * WWL-366 — the box said "Search Review" and filtered the
                  * reviewer's NAME. Driven live against eight reviews: "food"
                  * and "shandar" (words inside reviews) matched nothing, and so
                  * did the phone number, the booking id, the venue name and the
                  * email printed directly under the name that did match. Five of
                  * the six visible columns were unsearchable on a screen whose
                  * only job is finding a review.
                  */}
                <Input
                    placeholder="Search name, phone, venue, booking or review text…"
                    aria-label="Search reviews"
                    value={table.getState().globalFilter ?? ""}
                    onChange={(event) => table.setGlobalFilter(event.target.value)}
                    className="h-9 w-[250px] xl:w-[340px]"
                />
            </div>
            <div className="ml-auto hidden lg:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => exportTableToCSV(table, "reviews")}>
                    <Download className="mr-2 h-4 w-4" />Export
                </Button>
                <DataTableColumnView table={table} />
            </div>
        </div>
    )
}

export default ReviewsTableActions

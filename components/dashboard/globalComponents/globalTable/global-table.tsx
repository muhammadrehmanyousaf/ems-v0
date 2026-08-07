import React from 'react'
import { DataTable } from './components/data-table'
import { DataTablePagination } from './components/data-table-pagination'
import type { Table } from '@tanstack/react-table'
import { PaginationStateTypes } from './components/use-data-table'

type CoreDataTableProps<TData extends object> = {
    table: Table<TData>;
    paginationState: PaginationStateTypes;
    totalItems: number;
    setCurrentPage?: (v: number | ((old: number) => number | null) | null) => Promise<URLSearchParams>;
    setPageSizeValue?: (v: number | ((old: number) => number | null) | null) => Promise<URLSearchParams>;
    /** WWL-120/137/153/170/187 — screen-reader name for the table. */
    caption?: string;
}

export function GlobalTable<TData extends object>({ table, paginationState, totalItems, setCurrentPage, setPageSizeValue, caption }: CoreDataTableProps<TData>) {
    return (
        <div className='space-y-4 w-full max-w-full'>
            <DataTable table={table} caption={caption} />
            <DataTablePagination
                table={table}
                paginationState={paginationState}
                totalItems={totalItems}
                setCurrentPage={setCurrentPage}
                setPageSizeValue={setPageSizeValue}
            />
        </div>
    )
}

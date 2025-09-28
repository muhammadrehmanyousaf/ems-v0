import React from 'react'
import { DataTable } from './components/data-table'
import { DataTablePagination } from './components/data-table-pagination'
import type { Table } from '@tanstack/react-table'
import { PaginationStateTypes } from './components/use-data-table'

type CoreDataTableProps<TData extends object> = {
    table: Table<TData>;
    paginationState: PaginationStateTypes;
    totalItems: number
}

export function GlobalTable<TData extends object>({ table, paginationState, totalItems }: CoreDataTableProps<TData>) {
    return (
        <div className='space-y-4 w-full max-w-full'>
            <DataTable table={table} />
            <DataTablePagination table={table} paginationState={paginationState} totalItems={totalItems} />
        </div>
    )
}

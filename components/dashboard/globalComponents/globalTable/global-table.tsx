import React from 'react'
import { DataTable } from './components/data-table'
import { DataTablePagination } from './components/data-table-pagination'
import type { Table } from '@tanstack/react-table'

type CoreDataTableProps<TData extends object> = {
    table: Table<TData>
}

export function GlobalTable<TData extends object>({table}: CoreDataTableProps<TData>) {
    return (
        <div className='space-y-4 w-full max-w-full'>
            <DataTable table={table} />
            <DataTablePagination table={table} />
        </div>
    )
}

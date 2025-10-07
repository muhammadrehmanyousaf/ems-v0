'use client'
import React from 'react'
import { RolesTableActions } from './roles-table-actions'
import { Role } from '@/lib/dashboard-types'
import { roles, columns } from './columns'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'

const RolesTable = () => {
    const { table, paginationState } = useDataTable<Role>({ data: roles, columns, totalItems: roles.length })

    return (
        <div className='space-y-4'>
            <RolesTableActions
                table={table}
            />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={roles.length}
            />
        </div>
    )
}

export default RolesTable

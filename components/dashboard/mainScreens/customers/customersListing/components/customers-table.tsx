'use client'
import React from 'react'
import { CustomersType } from '@/lib/dashboard-types'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import { customers, columns } from './columns'
import { CustomersTableActions } from './customers-table-actions'

const CustomersTable = () => {
    const { table } = useDataTable<CustomersType>({ data: customers, columns })

    return (
        <div className='space-y-4 w-full'>
            <CustomersTableActions
                table={table}
            />
            <GlobalTable
                table={table}
            />
        </div>
    )
}

export default CustomersTable

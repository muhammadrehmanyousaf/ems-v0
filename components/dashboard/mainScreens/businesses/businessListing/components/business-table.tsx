'use client'
import React from 'react'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { Business } from '@/lib/dashboard-types';
import BusinessTableActions from './business-table-actions';
import { businesses, businessColumns } from './columns';

const BusinessTable = () => {
    const { table, paginationState } = useDataTable<Business>({ data: businesses, columns: businessColumns, totalItems: businesses.length });
    return (
        <div className='space-y-4'>
            <BusinessTableActions
                table={table}
            />
            <GlobalTable
                table={table}
                totalItems={businesses.length}
                paginationState={paginationState}
            />
        </div>
    )
}

export default BusinessTable

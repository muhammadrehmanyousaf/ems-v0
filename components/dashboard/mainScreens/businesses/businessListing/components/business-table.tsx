'use client'
import React from 'react'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { Business } from '@/lib/dashboard-types';
import BusinessTableActions from './business-table-actions';
import { businesses, businessColumns } from './columns';

const BusinessTable = () => {
    const { table } = useDataTable<Business>({ data: businesses, columns: businessColumns });
    return (
        <div className='space-y-4'>
            <BusinessTableActions
                table={table}
            />
            <GlobalTable
                table={table}
            />
        </div>
    )
}

export default BusinessTable

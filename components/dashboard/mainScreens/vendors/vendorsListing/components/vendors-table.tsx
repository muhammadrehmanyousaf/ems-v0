'use client'
import React from 'react'
import VendorTableActions from './vendor-table-actions'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { Vendor } from '@/lib/dashboard-types';
import { vendors, columns } from './columns';

const VendorsTable = () => {
    const { table } = useDataTable<Vendor>({ data: vendors, columns });
    return (
        <div className='space-y-4'>
            <VendorTableActions
                table={table}
            />
            <GlobalTable
                table={table}
            />
        </div>
    )
}

export default VendorsTable

import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import React from 'react'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { Payment } from '@/lib/dashboard-types'
import { columns, payments } from './columns'
import { PaymentTableActions } from './payment-table-actions'

const PaymentsTable = () => {
    const { table, paginationState } = useDataTable<Payment>({ data: payments, columns, totalItems: payments.length })

    return (
        <div className='space-y-4 w-full'>
            <PaymentTableActions
                table={table}
            />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={payments.length}
            />
        </div>
    )
}

export default PaymentsTable

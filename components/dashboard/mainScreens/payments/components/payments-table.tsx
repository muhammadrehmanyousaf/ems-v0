import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import React from 'react'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { Payment } from '@/lib/dashboard-types'
import { columns, payments } from './columns'
import { PaymentTableActions } from './payment-table-actions'

const PaymentsTable = () => {
    const { table } = useDataTable<Payment>({ data: payments, columns })

    return (
        <div className='space-y-4 w-full'>
            <PaymentTableActions
                table={table}
            />
            <GlobalTable
                table={table}
            />
        </div>
    )
}

export default PaymentsTable

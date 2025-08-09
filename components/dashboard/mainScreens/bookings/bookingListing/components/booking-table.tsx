'use client'
import React from 'react'
import { Booking } from '@/lib/dashboard-types'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { BookingTableActions } from './booking-table-actions'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import { bookings, columns } from './columns'

const BookingTable = () => {
    const { table } = useDataTable<Booking>({ data: bookings, columns })

    return (
        <div className='space-y-4 w-full'>
            <BookingTableActions
                table={table}
            />
            <GlobalTable
                table={table}
            />
        </div>
    )
}

export default BookingTable

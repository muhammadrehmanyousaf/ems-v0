'use client'
import React from 'react'
import { Booking } from '@/lib/dashboard-types'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { BookingTableActions } from './booking-table-actions'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import { bookings, columns } from './columns'
import BookingTableFilters from './booking-table-filters'

const BookingTable = ({page}: {page: number}) => {
    const { table, paginationState } = useDataTable<Booking>({ data: bookings, columns, totalItems:bookings.length  })
    const {setPage, searchQuery, setSearchQuery} = BookingTableFilters()

    return (
        <div className='space-y-4 w-full'>
            <BookingTableActions
                table={table}
                searchQuery={searchQuery}
                setPage={setPage}
                setSearchQuery={setSearchQuery}
            />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={bookings.length}
            />
        </div>
    )
}

export default BookingTable

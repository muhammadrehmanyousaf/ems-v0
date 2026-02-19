import React from 'react'
import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import BookingTable from './components/booking-table'
import { Separator } from '@/components/ui/separator'
import { searchParamsCache } from '@/lib/searchparams'

const BookingListingView = () => {
  const search = searchParamsCache.get('q');

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title='Bookings' />
          <Separator />
          <BookingTable search={search} />
        </div>
      </PageContainer>
    </div>
  )
}

export default BookingListingView

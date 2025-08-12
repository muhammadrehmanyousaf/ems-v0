import React from 'react'
import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import BookingTable from './components/booking-table'
import { Separator } from '@/components/ui/separator'
import CreationsButtons from './components/creations-buttons'

const BookingListingView = () => {

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <div className='w-full flex items-center justify-between'>
            <Heading
              title='Bookings'
            />
            <CreationsButtons />
          </div>
          <Separator />
          <BookingTable />
        </div>
      </PageContainer>
    </div>
  )
}

export default BookingListingView

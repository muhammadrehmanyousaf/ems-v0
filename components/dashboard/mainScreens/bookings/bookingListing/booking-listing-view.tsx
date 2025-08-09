'use client'
import React from 'react'
import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import BookingTable from './components/booking-table'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'

const BookingListingView = () => {

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <div className='w-full flex items-center justify-between'>
            <Heading
              title='Bookings'
            />
            <span className='flex items-center gap-2'>
              <Button variant={'outline'} className='gap-2 hidden md:flex'>
                <Download className='size-4' />
                Export
              </Button>
              <Button className='gap-2'>
                <Plus className='size-4' />
                Add New
              </Button>
            </span>
          </div>
          <Separator />
          <BookingTable />
        </div>
      </PageContainer>
    </div>
  )
}

export default BookingListingView

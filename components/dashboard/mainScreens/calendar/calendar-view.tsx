import React from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import MainCalendar from './components/main-calendar'
import { Separator } from '@/components/ui/separator'
import { CalendarFeedCard } from '@/components/dashboard/calendar-feed-card'

const CalendarView = () => {
  return (
    <div>
      <PageContainer>
        <div className='space-y-3'>
          <Heading
            title="Calendar"
          />
          <Separator />
          <MainCalendar />
          {/* Phase 4 polish — iCal subscription feed for vendors who
              want their bookings in Google/Apple/Outlook. */}
          <CalendarFeedCard />
        </div>
      </PageContainer>
    </div>
  )
}

export default CalendarView

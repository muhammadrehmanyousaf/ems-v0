import React from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import MainCalendar from './components/main-calendar'
import { Separator } from '@/components/ui/separator'

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
        </div>
      </PageContainer>
    </div>
  )
}

export default CalendarView

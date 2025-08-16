import React from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import MainCalendar from './components/main-calendar'

const CalendarView = () => {
  return (
    <div>
      <PageContainer>
        <div className='space-y-4'>
          <Heading
            title="Calendar"
          />
          <MainCalendar/>
        </div>
      </PageContainer>
    </div>
  )
}

export default CalendarView

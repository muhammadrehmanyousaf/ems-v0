import CalendarView from '@/components/dashboard/mainScreens/calendar/calendar-view';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Calendar',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    return <CalendarView />
}

export default page

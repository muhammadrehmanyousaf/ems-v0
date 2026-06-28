import CalendarView from '@/components/dashboard/mainScreens/calendar/calendar-view';
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { CalendarRedesignedView } from "@/components/dashboard/mainScreens/calendar/redesigned/calendar-redesigned-view";
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Calendar',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    if (isRedesignOn()) return <CalendarRedesignedView />;
    return <CalendarView />
}

export default page

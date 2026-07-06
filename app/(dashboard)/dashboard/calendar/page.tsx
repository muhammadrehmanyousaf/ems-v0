import CalendarView from '@/components/dashboard/mainScreens/calendar/calendar-view';
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { CalendarRedesignedView } from "@/components/dashboard/mainScreens/calendar/redesigned/calendar-redesigned-view";
import { CalendarV2Gate } from "@/components/dashboard/mainScreens/calendar/v2/calendar-v2-gate";
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Calendar',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    // Phase-1 EPIC 2 — the v2 availability grid sits above the existing calendar
    // for pilot vendors (venue_os_v2); everyone else's calendar is unchanged.
    return (
        <>
            <CalendarV2Gate />
            {isRedesignOn() ? <CalendarRedesignedView /> : <CalendarView />}
        </>
    );
}

export default page

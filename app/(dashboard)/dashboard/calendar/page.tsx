import { CalendarRedesignedView } from "@/components/dashboard/mainScreens/calendar/redesigned/calendar-redesigned-view";
import { CalendarV2Gate } from "@/components/dashboard/mainScreens/calendar/v2/calendar-v2-gate";
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Calendar',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    // The month grid comes FIRST. The availability strip used to sit above it,
    // so opening Calendar showed a two-week slot matrix and the Islamic-dates
    // blackout panel before a single booking — on a 900px window the actual
    // calendar started below the fold. Availability is a rules surface you go
    // looking for; the calendar is what the page is called.
    return (
        <>
            <CalendarRedesignedView />
            <CalendarV2Gate />
        </>
    );
}

export default page

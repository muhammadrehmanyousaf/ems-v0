import { CalendarRedesignedView } from "@/components/dashboard/mainScreens/calendar/redesigned/calendar-redesigned-view";
import { CalendarV2Gate } from "@/components/dashboard/mainScreens/calendar/v2/calendar-v2-gate";
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Calendar',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    // Phase-1 EPIC 2 — the v2 availability grid sits above the calendar for
    // vendors whose business uses a multi-resource availability primitive.
    return (
        <>
            <CalendarV2Gate />
            <CalendarRedesignedView />
        </>
    );
}

export default page

import { CalendarRedesignedView } from "@/components/dashboard/mainScreens/calendar/redesigned/calendar-redesigned-view";
// import { CalendarV2Gate } from "@/components/dashboard/mainScreens/calendar/v2/calendar-v2-gate";
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Calendar',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    // The Availability section (halls x days slot grid) is hidden for now at the
    // founder's direction (2026-08-29) — "we will work on that in future".
    //
    // Commented, not deleted: CalendarV2Gate and CalendarSlotGridView are both
    // untouched on disk, and its endpoint is unchanged. Restore by uncommenting
    // the import above and the line below.
    //
    // Kept from the previous change, because it still applies when this comes
    // back: the month grid must come FIRST. The availability strip used to sit
    // above it, so opening Calendar showed a two-week slot matrix and the
    // Islamic-dates blackout panel before a single booking — on a 900px window
    // the actual calendar started below the fold. Availability is a rules
    // surface you go looking for; the calendar is what the page is called.
    return (
        <>
            <CalendarRedesignedView />
            {/* <CalendarV2Gate /> */}
        </>
    );
}

export default page

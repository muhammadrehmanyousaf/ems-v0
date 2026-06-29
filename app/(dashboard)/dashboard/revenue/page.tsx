import RevenueView from '@/components/dashboard/mainScreens/revenue/revenue-view';
import { Metadata } from 'next';
import React from 'react'
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { RevenueRedesignedView } from "@/components/dashboard/mainScreens/revenue/redesigned/revenue-redesigned-view";

export const metadata: Metadata = {
    title: 'Dashboard : Revenue',
    description: 'Platform revenue and vendor payouts'
};

function page() {
    if (isRedesignOn()) return <RevenueRedesignedView />;
    return <RevenueView />
}

export default page

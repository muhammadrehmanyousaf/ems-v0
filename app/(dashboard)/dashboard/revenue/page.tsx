import RevenueView from '@/components/dashboard/mainScreens/revenue/revenue-view';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Revenue',
    description: 'Platform revenue and vendor payouts'
};

function page() {
    return <RevenueView />
}

export default page

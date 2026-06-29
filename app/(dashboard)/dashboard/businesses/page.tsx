import BusinessListingView from '@/components/dashboard/mainScreens/businesses/businessListing/business-listing-view';
import { Metadata } from 'next';
import React from 'react'
import { isRedesignOn } from "@/lib/dashboard-redesign-flag"
import { BusinessesAdminRedesignedView } from "@/components/dashboard/mainScreens/businesses/redesigned/businesses-admin-redesigned-view"

export const metadata: Metadata = {
    title: 'Dashboard : Businesses',
    description: 'Basic dashboard with Next.js and Shadcn'
};

function page() {
    if (isRedesignOn()) return <BusinessesAdminRedesignedView />;
    return <BusinessListingView/>
}

export default page

import BusinessListingView from '@/components/dashboard/mainScreens/businesses/businessListing/business-listing-view';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Businesses',
    description: 'Basic dashboard with Next.js and Shadcn'
};

function page() {
    return <BusinessListingView/>
}

export default page
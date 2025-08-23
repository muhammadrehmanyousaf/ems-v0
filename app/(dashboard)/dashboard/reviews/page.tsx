import ReviewsListingView from '@/components/dashboard/mainScreens/reviews/reviewsListing/reviews-listing-view';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Reviews',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
  return <ReviewsListingView/>
}

export default page

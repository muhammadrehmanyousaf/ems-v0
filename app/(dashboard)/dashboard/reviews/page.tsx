import { ReviewsArtifact } from '@/components/dashboard/mainScreens/reviews/artifact/reviews-artifact';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Reviews',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
  return <ReviewsArtifact/>
}

export default page

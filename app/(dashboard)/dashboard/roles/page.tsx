import RolesListingView from '@/components/dashboard/mainScreens/roles/rolesListing/roles-listing-view';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Roles',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
  return <RolesListingView/>
}

export default page

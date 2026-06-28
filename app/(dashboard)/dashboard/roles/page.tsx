import RolesListingView from '@/components/dashboard/mainScreens/roles/rolesListing/roles-listing-view';
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { RolesAdminRedesignedView } from "@/components/dashboard/mainScreens/roles/redesigned/roles-admin-redesigned-view";
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Roles',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
  if (isRedesignOn()) return <RolesAdminRedesignedView />;
  return <RolesListingView/>
}

export default page

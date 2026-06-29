import VendorListingView from '@/components/dashboard/mainScreens/vendors/vendorsListing/vendor-listing-view';
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { VendorsAdminRedesignedView } from "@/components/dashboard/mainScreens/vendors/redesigned/vendors-admin-redesigned-view";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard : Vendors',
    description: 'Basic dashboard with Next.js and Shadcn'
};

export default function page() {
  if (isRedesignOn()) return <VendorsAdminRedesignedView />;
  return <VendorListingView/>
}

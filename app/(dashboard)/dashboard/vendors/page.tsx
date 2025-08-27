import VendorListingView from '@/components/dashboard/mainScreens/vendors/vendorsListing/vendor-listing-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard : Vendors',
    description: 'Basic dashboard with Next.js and Shadcn'
};

export default function page() {
  return <VendorListingView/>
}

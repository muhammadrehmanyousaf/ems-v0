import UserListingView from '@/components/dashboard/mainScreens/users/usersListing/user-listing-view';
import { Metadata } from 'next';
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { UsersAdminRedesignedView } from "@/components/dashboard/mainScreens/users/redesigned/users-admin-redesigned-view";

export const metadata: Metadata = {
    title: 'Dashboard : Users',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
  if (isRedesignOn()) return <UsersAdminRedesignedView />;
  return <UserListingView/>
}

export default page

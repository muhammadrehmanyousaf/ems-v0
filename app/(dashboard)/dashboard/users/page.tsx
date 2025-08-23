import UserListingView from '@/components/dashboard/mainScreens/users/usersListing/user-listing-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard : Users',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
  return <UserListingView/>
}

export default page

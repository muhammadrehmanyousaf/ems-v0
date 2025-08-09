import { Metadata } from "next";
import BookingListingView from "@/components/dashboard/mainScreens/bookings/bookingListing/booking-listing-view";

export const metadata: Metadata = {
  title: 'Dashboard : Bookings',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default function BookingsPage() {
  return (
    <div>
      <BookingListingView/>
    </div>
  )
}


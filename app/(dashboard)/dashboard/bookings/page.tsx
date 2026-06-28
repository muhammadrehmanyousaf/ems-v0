import { Metadata } from "next";
import BookingListingView from "@/components/dashboard/mainScreens/bookings/bookingListing/booking-listing-view";
import { searchParamsCache } from "@/lib/searchparams";
import { SearchParams } from "nuqs/parsers";
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { BookingsRedesignedView } from "@/components/dashboard/mainScreens/bookings/redesigned/bookings-redesigned-view";

export const metadata: Metadata = {
  title: 'Dashboard : Bookings',
  description: 'Basic dashboard with Next.js and Shadcn'
};

type pageProps = {
  searchParams: SearchParams;
};

export default function BookingsPage({ searchParams }: pageProps) {
  searchParamsCache.parse(searchParams);
  if (isRedesignOn()) return <BookingsRedesignedView />;
  return (
    <div>
      <BookingListingView/>
    </div>
  )
}


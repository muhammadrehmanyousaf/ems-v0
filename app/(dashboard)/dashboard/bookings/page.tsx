import { Metadata } from "next";
import BookingListingView from "@/components/dashboard/mainScreens/bookings/bookingListing/booking-listing-view";
import { searchParamsCache } from "@/lib/searchparams";
import { SearchParams } from "nuqs/parsers";

export const metadata: Metadata = {
  title: 'Dashboard : Bookings',
  description: 'Basic dashboard with Next.js and Shadcn'
};

type pageProps = {
  searchParams: SearchParams;
};

export default function BookingsPage({ searchParams }: pageProps) {
  searchParamsCache.parse(searchParams);
  return (
    <div>
      <BookingListingView/>
    </div>
  )
}


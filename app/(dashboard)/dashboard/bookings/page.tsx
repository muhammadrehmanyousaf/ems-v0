import { Metadata } from "next";
import { SearchParams } from "nuqs/parsers";
import { BookingsRedesignedView } from "@/components/dashboard/mainScreens/bookings/redesigned/bookings-redesigned-view";

export const metadata: Metadata = {
  title: 'Dashboard : Bookings',
  description: 'Basic dashboard with Next.js and Shadcn'
};

type pageProps = {
  searchParams: SearchParams;
};

export default function BookingsPage({ searchParams }: pageProps) {
  return <BookingsRedesignedView />
}


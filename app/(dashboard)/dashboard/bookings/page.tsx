import { Metadata } from "next";
import { SearchParams } from "nuqs/parsers";
import { BookingsArtifact } from "@/components/dashboard/mainScreens/bookings/artifact/bookings-artifact";

export const metadata: Metadata = {
  title: 'Dashboard : Bookings',
  description: 'Basic dashboard with Next.js and Shadcn'
};

type pageProps = {
  searchParams: SearchParams;
};

export default function BookingsPage({ searchParams }: pageProps) {
  void searchParams
  return <BookingsArtifact />
}


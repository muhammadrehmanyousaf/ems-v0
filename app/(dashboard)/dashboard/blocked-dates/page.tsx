import { Metadata } from "next";
import { BlockedDatesScreen } from "@/components/dashboard/mainScreens/calendar/blocked-dates-screen";

export const metadata: Metadata = {
  title: "Dashboard : Blocked dates",
  description: "Dates you are not taking bookings on.",
};

const page = () => <BlockedDatesScreen />;

export default page;

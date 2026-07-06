import { Metadata } from "next";
import { MigrationSprintView } from "@/components/dashboard/mainScreens/migrate/migration-sprint-view";

export const metadata: Metadata = {
  title: "Dashboard : Booking Shield",
  description: "Enter your confirmed future dates to switch on double-booking protection.",
};

const page = () => <MigrationSprintView />;

export default page;

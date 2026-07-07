import { Metadata } from "next";
import { AvailabilitySetup } from "@/components/settings/availability-setup";

export const metadata: Metadata = {
  title: "Dashboard : Availability",
  description: "Set up your bookable availability.",
};

const page = () => <AvailabilitySetup />;

export default page;

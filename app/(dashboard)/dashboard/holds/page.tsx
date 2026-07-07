import { Metadata } from "next";
import { HoldsView } from "@/components/dashboard/mainScreens/holds/holds-view";

export const metadata: Metadata = {
  title: "Dashboard : Date holds",
  description: "Tentatively hold a date for a lead — works offline.",
};

const page = () => <HoldsView />;

export default page;

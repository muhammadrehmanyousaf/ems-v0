import { Metadata } from "next";
import { HoldsArtifact } from "@/components/dashboard/mainScreens/holds/artifact/holds-artifact";

export const metadata: Metadata = {
  title: "Dashboard : Date holds",
  description: "Tentatively hold a date for a lead — works offline.",
};

const page = () => <HoldsArtifact />;

export default page;

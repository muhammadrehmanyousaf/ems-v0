import { Metadata } from "next";
import { BusinessNewArtifact } from "@/components/dashboard/mainScreens/business/artifact/business-new-artifact";

export const metadata: Metadata = {
  title: "Dashboard : Add a business",
  description: "Register another venue or service under your vendor account. Reviewed before it goes live.",
};

// Static segment: Next matches /dashboard/business/new here, not in [id].
const page = () => <BusinessNewArtifact />;
export default page;

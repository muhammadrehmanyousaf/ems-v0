import { CancellationPolicyArtifact } from "@/components/dashboard/mainScreens/cancellation-policy/artifact/cancellation-policy-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Cancellation policy",
  description: "How much is forfeited when a booking is cancelled — the policy customers see.",
};

const page = () => <CancellationPolicyArtifact />;
export default page;

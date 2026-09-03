import { ReliabilityArtifact } from "@/components/dashboard/mainScreens/reliability/artifact/reliability-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Reliability",
  description: "Your trust score — how customers gauge your reliability.",
};

export default function Page() {
  return <ReliabilityArtifact />;
}

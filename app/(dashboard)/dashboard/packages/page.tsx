import { PackagesArtifact } from "@/components/dashboard/mainScreens/packages/artifact/packages-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Packages",
  description: "Your pricing packages — what customers choose from.",
};

export default function Page() {
  return <PackagesArtifact />;
}

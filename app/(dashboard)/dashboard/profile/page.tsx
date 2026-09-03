import { ProfileArtifact } from "@/components/dashboard/mainScreens/settings/artifact/profile-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Account",
  description: "Your account — name, contact details, password and security.",
};

export default function ProfilePage() {
  return <ProfileArtifact />;
}

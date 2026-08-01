import { AccountSettingsRedesignedView } from "@/components/dashboard/mainScreens/settings/redesigned/account-settings-redesigned-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Account",
  description: "Your account — name, contact details, password and security.",
};

export default function ProfilePage() {
  return <AccountSettingsRedesignedView />;
}

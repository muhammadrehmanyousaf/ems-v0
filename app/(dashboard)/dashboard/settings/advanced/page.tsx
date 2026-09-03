import { BusinessSettingsHubView } from "@/components/dashboard/mainScreens/businessSettings/redesigned/business-settings-hub-view";
import { ShellChromeSetter } from "@/components/dashboard/layout/champagne-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Settings — advanced",
  description: "Images, packages, menus, bank details and the full listing managers.",
};

// Alias of /dashboard/settings — same hub, inside the persistent champagne shell.
export default function Page() {
  return (
    <>
      <ShellChromeSetter activeHref="/dashboard/settings" crumbBold="Set up" crumbSub="Business settings" />
      <BusinessSettingsHubView />
    </>
  );
}

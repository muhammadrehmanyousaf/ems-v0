import { BusinessSettingsHubView } from "@/components/dashboard/mainScreens/businessSettings/redesigned/business-settings-hub-view";
import { ShellChromeSetter } from "@/components/dashboard/layout/champagne-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Settings",
  description: "Your listing, pricing, packages, menus, images and payout details — all in one place.",
};

// Renders INSIDE the persistent champagne shell (from the dashboard layout) —
// all managers (profile/pricing/amenities/listing/type-specific/images/packages/
// menus/bank) edit inline in the premium chrome; no legacy icon-rail, no jump.
export default function page() {
  return (
    <>
      <ShellChromeSetter activeHref="/dashboard/settings" crumbBold="Set up" crumbSub="Business settings" />
      <BusinessSettingsHubView />
    </>
  );
}

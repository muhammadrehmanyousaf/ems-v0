import { BusinessSettingsHubView } from "@/components/dashboard/mainScreens/businessSettings/redesigned/business-settings-hub-view";
import { TourLauncherCard } from "@/components/dashboard/tour/tour-launcher";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Dashboard : Settings',
    description: 'Your listing, pricing, packages and payout details — plus a tour of the system.'
};

export default function page() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Above the hub, and deliberately OUTSIDE it.
          Set up is where someone lands when they are stuck, which is exactly
          when a tour is worth offering. The hub returns early while it loads
          its business — and if that request fails, or the vendor has no
          business yet, the offer of help would disappear precisely for the
          people most likely to need it. Nothing here depends on data. */}
      <TourLauncherCard />
      <BusinessSettingsHubView />
    </div>
  );
}

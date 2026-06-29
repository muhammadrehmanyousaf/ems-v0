import BusinessSettingsView from "@/components/dashboard/mainScreens/businessSettings/business-settings-view";
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { BusinessSettingsHubView } from "@/components/dashboard/mainScreens/businessSettings/redesigned/business-settings-hub-view";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Dashboard : Settings',
    description: 'Basic dashboard with Next.js and Shadcn'
};

export default function page() {

  if (isRedesignOn()) return <BusinessSettingsHubView />;

  return <BusinessSettingsView/>
}


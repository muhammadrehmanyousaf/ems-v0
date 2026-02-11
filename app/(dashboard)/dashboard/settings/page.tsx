import BusinessSettingsView from "@/components/dashboard/mainScreens/businessSettings/business-settings-view";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Dashboard : Settings',
    description: 'Basic dashboard with Next.js and Shadcn'
};

export default function page() {

  return <BusinessSettingsView/>
}


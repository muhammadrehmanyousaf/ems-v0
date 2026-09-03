import { NotificationsArtifact } from "@/components/dashboard/mainScreens/notifications/artifact/notifications-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Notifications",
  description: "Your notifications — bookings, payments, leads and reviews in one feed.",
};

export default function Page() {
  return <NotificationsArtifact />;
}

import { SlotsArtifact } from "@/components/dashboard/mainScreens/availability/artifact/slots-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Bookable Slots",
  description:
    "Define your venue's bookable time-slots — label, start/end, concurrent-booking capacity, per-booking guest cap and weekdays. Powers the booking form, capacity enforcement and calendar blocking.",
};

export default function Page() {
  return <SlotsArtifact />;
}

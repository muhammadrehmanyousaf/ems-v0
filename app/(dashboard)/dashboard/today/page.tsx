import { TodayArtifact } from "@/components/dashboard/mainScreens/today/artifact/today-artifact";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Today on the floor',
  description:
    "Day-of timeline runner for Pakistani wedding vendors — every active event today, tick tasks off as they happen.",
};

export default function Page() {
  return <TodayArtifact />
}

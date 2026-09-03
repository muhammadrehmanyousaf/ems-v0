import { AutomationArtifact } from "@/components/dashboard/mainScreens/automation/artifact/automation-artifact";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Automation',
  description:
    'Trigger-based reminders running on your behalf — T-14 / T-3 / T-1 customer reminders, T+1 review prompt, and 48h-stale lead nudge.',
};

export default function Page() {
  return <AutomationArtifact />
}

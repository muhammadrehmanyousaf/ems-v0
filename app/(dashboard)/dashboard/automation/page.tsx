import PageContainer from '@/components/dashboard/layout/page-container';
import AutomationStatusView from '@/components/dashboard/mainScreens/automation/automation-status-view';
import AutomationBuilderCard from '@/components/dashboard/mainScreens/automation/automation-builder-card';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { AutomationRedesignedView } from "@/components/dashboard/mainScreens/automation/redesigned/automation-redesigned-view";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Automation',
  description:
    'Trigger-based reminders running on your behalf — T-14 / T-3 / T-1 customer reminders, T+1 review prompt, and 48h-stale lead nudge.',
};

export default function Page() {
  if (isRedesignOn()) return <AutomationRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Automation" />
          <Separator />
          {/* §M10 builder — vendor-defined rules (flag-gated). Above the
              built-in automation status surface. */}
          {process.env.NEXT_PUBLIC_AUTOMATION_BUILDER === '1' && <AutomationBuilderCard />}
          <AutomationStatusView />
        </div>
      </PageContainer>
    </div>
  );
}

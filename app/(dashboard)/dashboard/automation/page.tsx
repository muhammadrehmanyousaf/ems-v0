import PageContainer from '@/components/dashboard/layout/page-container';
import AutomationStatusView from '@/components/dashboard/mainScreens/automation/automation-status-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Automation',
  description:
    'Trigger-based reminders running on your behalf — T-14 / T-3 / T-1 customer reminders, T+1 review prompt, and 48h-stale lead nudge.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Automation" />
          <Separator />
          <AutomationStatusView />
        </div>
      </PageContainer>
    </div>
  );
}

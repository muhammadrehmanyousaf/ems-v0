import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import LeadsView from '@/components/dashboard/mainScreens/leads/leads-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { LeadsRedesignedView } from '@/components/dashboard/mainScreens/leads/redesigned/leads-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Lead Inbox',
  description:
    'Unified inbox for WhatsApp, phone, walk-in, website form & in-app chat inquiries — never lose a Pakistani wedding lead to a forgotten follow-up.',
};

export default function Page() {
  if (isRedesignOn()) return <LeadsRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Leads" />
          <Separator />
          <LeadsView />
        </div>
      </PageContainer>
    </div>
  );
}

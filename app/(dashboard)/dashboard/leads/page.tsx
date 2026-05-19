import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import LeadsInboxView from '@/components/dashboard/mainScreens/leads/leads-inbox-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Lead Inbox',
  description:
    'Unified inbox for WhatsApp, phone, walk-in, website form & in-app chat inquiries — never lose a Pakistani wedding lead to a forgotten follow-up.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Lead Inbox" />
          <Separator />
          <LeadsInboxView />
        </div>
      </PageContainer>
    </div>
  );
}

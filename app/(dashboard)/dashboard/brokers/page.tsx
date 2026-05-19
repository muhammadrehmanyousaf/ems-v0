import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import BrokersView from '@/components/dashboard/mainScreens/brokers/brokers-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Broker Commissions',
  description:
    'Broker directory + per-event commission ledger for Pakistani wedding vendors — rishta brokers, hall middlemen, planners, influencers.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Brokers &amp; commissions" />
          <Separator />
          <BrokersView />
        </div>
      </PageContainer>
    </div>
  );
}

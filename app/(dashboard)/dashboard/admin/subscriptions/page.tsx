import PageContainer from '@/components/dashboard/layout/page-container';
import AdminSubscriptionsView from '@/components/dashboard/mainScreens/admin/subscriptions/admin-subscriptions-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Subscriptions',
  description: 'Safepay subscriptions ledger and the manual upgrade queue.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Subscriptions"
            description="Every paid vendor plan from Safepay, and the manual upgrade queue."
          />
          <Separator />
          <AdminSubscriptionsView />
        </div>
      </PageContainer>
    </div>
  );
}

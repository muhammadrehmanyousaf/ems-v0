import PageContainer from '@/components/dashboard/layout/page-container';
import AdminSubscriptionsView from '@/components/dashboard/mainScreens/admin/subscriptions/admin-subscriptions-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Plan upgrades',
  description: 'Review and activate vendor plan-upgrade requests.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Plan upgrades"
            description="Vendor upgrade requests — confirm payment offline, then activate."
          />
          <Separator />
          <AdminSubscriptionsView />
        </div>
      </PageContainer>
    </div>
  );
}

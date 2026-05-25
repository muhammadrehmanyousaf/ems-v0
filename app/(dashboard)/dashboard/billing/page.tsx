import PageContainer from '@/components/dashboard/layout/page-container';
import BillingView from '@/components/dashboard/mainScreens/billing/billing-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Plan & Billing',
  description: 'Your Wedding Wala plan — Free, Business, or Growth.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Plan & billing"
            description="Pick the plan that fits. We never charge commission on your bookings."
          />
          <Separator />
          <BillingView />
        </div>
      </PageContainer>
    </div>
  );
}

import PageContainer from '@/components/dashboard/layout/page-container';
import BillingView from '@/components/dashboard/mainScreens/billing/billing-view';
import { BillingRedesignedView } from '@/components/dashboard/mainScreens/billing/redesigned/billing-redesigned-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Plan & Billing',
  description: 'Your Wedding Wala plan — Free, Business, or Growth.',
};

export default function Page() {
  if (isRedesignOn()) return <BillingRedesignedView />;

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

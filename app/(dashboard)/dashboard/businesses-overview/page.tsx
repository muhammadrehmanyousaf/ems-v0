import PageContainer from '@/components/dashboard/layout/page-container';
import BusinessesOverviewView from '@/components/dashboard/mainScreens/businesses-overview/businesses-overview-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Businesses overview',
  description:
    'Per-business rollup for vendors who run multiple businesses — bookings, revenue, sheets, leads, and reliability score side by side.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Businesses overview" />
          <Separator />
          <BusinessesOverviewView />
        </div>
      </PageContainer>
    </div>
  );
}

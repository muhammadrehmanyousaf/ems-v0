import PageContainer from '@/components/dashboard/layout/page-container';
import CustomerDetailView from '@/components/dashboard/mainScreens/customers/customer-detail-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Customer',
  description:
    'Customer 360 — every booking, function sheet, lead, and payment for a single customer, with lifetime-value stats.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  // The customers listing uses `_id` as the route identifier — either
  // the customer's email or `offline_<id>`. We pass it as-is and let
  // the view component dispatch to the matching backend query param.
  return (
    <div>
      <PageContainer>
        <CustomerDetailView identifier={decodeURIComponent(id)} />
      </PageContainer>
    </div>
  );
}

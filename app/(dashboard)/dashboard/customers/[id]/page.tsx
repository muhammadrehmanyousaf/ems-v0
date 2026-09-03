import { CustomerDetailArtifact } from '@/components/dashboard/mainScreens/customers/artifact/customer-detail-artifact';
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
  return <CustomerDetailArtifact customerId={id} />;
}

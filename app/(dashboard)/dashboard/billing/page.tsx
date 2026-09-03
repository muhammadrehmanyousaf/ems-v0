import { BillingArtifact } from '@/components/dashboard/mainScreens/billing/artifact/billing-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Plan & billing',
  description: 'Your subscription plan, features and upgrades.',
};

const page = () => <BillingArtifact />;
export default page;

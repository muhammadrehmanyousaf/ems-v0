import { BillingRedesignedView } from '@/components/dashboard/mainScreens/billing/redesigned/billing-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Plan & Billing',
  description: 'Your Wedding Wala plan — Khata Lite, Business, or Growth.',
};

export default function Page() {
  return <BillingRedesignedView />
}

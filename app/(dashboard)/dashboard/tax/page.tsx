import { TaxRedesignedView } from '@/components/dashboard/mainScreens/tax/redesigned/tax-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Tax report',
  description:
    'Annual revenue + expense + P&L summary, FBR-fiscal-year aligned. One-click PDF export for your accountant.',
};

export default function Page() {
  return <TaxRedesignedView />
}

import { ReceiptsRedesignedView } from '@/components/dashboard/mainScreens/receipts/redesigned/receipts-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Payment Receipts',
  description:
    'Cash + digital payment receipt tracking for Pakistani wedding vendors — JazzCash, Easypaisa, Raast, IBFT.',
};

export default function Page() {
  return <ReceiptsRedesignedView />
}

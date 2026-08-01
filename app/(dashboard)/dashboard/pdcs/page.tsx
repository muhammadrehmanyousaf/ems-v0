import { PdcsRedesignedView } from '@/components/dashboard/mainScreens/pdcs/redesigned/pdcs-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : PDC Ledger',
  description:
    'Post-dated cheque tracking for Pakistani wedding vendors — held, deposited, cleared, bounced.',
};

export default function Page() {
  return <PdcsRedesignedView />
}

import { BrokersRedesignedView } from '@/components/dashboard/mainScreens/brokers/redesigned/brokers-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Broker Commissions',
  description:
    'Broker directory + per-event commission ledger for Pakistani wedding vendors — rishta brokers, hall middlemen, planners, influencers.',
};

export default function Page() {
  return <BrokersRedesignedView />
}

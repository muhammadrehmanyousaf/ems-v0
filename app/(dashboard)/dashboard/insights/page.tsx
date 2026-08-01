import { InsightsRedesignedView } from '@/components/dashboard/mainScreens/insights/redesigned/insights-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Insights',
  description:
    'Funnel by source, quote-acceptance rate, monthly ticket-size trend, LTV, and a 90-day revenue forecast.',
};

export default function Page() {
  return <InsightsRedesignedView />
}

import PageContainer from '@/components/dashboard/layout/page-container';
import InsightsView from '@/components/dashboard/mainScreens/insights/insights-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Insights',
  description:
    'Funnel by source, quote-acceptance rate, monthly ticket-size trend, LTV, and a 90-day revenue forecast.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Insights" />
          <Separator />
          <InsightsView />
        </div>
      </PageContainer>
    </div>
  );
}

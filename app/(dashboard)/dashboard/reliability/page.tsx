import PageContainer from '@/components/dashboard/layout/page-container';
import ReliabilityView from '@/components/dashboard/mainScreens/reliability/reliability-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Reliability score',
  description:
    'Your 0-100 reliability score, the breakdown of how it was computed, and the highest-leverage moves to improve it.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Reliability score" />
          <Separator />
          <ReliabilityView />
        </div>
      </PageContainer>
    </div>
  );
}

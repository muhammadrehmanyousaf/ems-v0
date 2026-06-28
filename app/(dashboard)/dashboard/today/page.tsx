import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import TodayView from '@/components/dashboard/mainScreens/today/today-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { TodayRedesignedView } from '@/components/dashboard/mainScreens/today/redesigned/today-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Today on the floor',
  description:
    "Day-of timeline runner for Pakistani wedding vendors — every active event today, tick tasks off as they happen.",
};

export default function Page() {
  if (isRedesignOn()) return <TodayRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Today" />
          <Separator />
          <TodayView />
        </div>
      </PageContainer>
    </div>
  );
}

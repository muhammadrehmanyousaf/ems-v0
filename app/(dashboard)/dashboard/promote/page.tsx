import PageContainer from '@/components/dashboard/layout/page-container';
import PromoteView from '@/components/dashboard/mainScreens/promote/promote-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { PromoteRedesignedView } from '@/components/dashboard/mainScreens/promote/redesigned/promote-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Promote',
  description: 'Request featured placement on the Wedding Wala marketplace.',
};

export default function Page() {
  if (isRedesignOn()) return <PromoteRedesignedView />;

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Promote"
            description="Get featured on the marketplace — homepage, category, city, or search boost."
          />
          <Separator />
          <PromoteView />
        </div>
      </PageContainer>
    </div>
  );
}

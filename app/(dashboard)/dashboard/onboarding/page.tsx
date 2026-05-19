import PageContainer from '@/components/dashboard/layout/page-container';
import OnboardingChecklistView from '@/components/dashboard/mainScreens/onboarding/onboarding-checklist-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Onboarding',
  description:
    'Complete your business profile to climb search ranking and unlock trust badges.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Onboarding checklist" />
          <Separator />
          <OnboardingChecklistView />
        </div>
      </PageContainer>
    </div>
  );
}

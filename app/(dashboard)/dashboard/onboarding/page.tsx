import PageContainer from '@/components/dashboard/layout/page-container';
import OnboardingChecklistView from '@/components/dashboard/mainScreens/onboarding/onboarding-checklist-view';
import GettingStartedMigration from '@/components/dashboard/mainScreens/onboarding/getting-started-migration';
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
          {/* Operational migration step (CSV imports) — flag-aware,
              dismissible. Renders nothing if both import flags are off.
              Sits above the profile-completeness checklist. */}
          <GettingStartedMigration />
          <OnboardingChecklistView />
        </div>
      </PageContainer>
    </div>
  );
}

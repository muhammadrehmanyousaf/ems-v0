import PageContainer from '@/components/dashboard/layout/page-container';
import OnboardingChecklistView from '@/components/dashboard/mainScreens/onboarding/onboarding-checklist-view';
import GettingStartedMigration from '@/components/dashboard/mainScreens/onboarding/getting-started-migration';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

/**
 * WWL-524 — this used to promise "climb search ranking and unlock trust
 * badges", and the page substantiated neither: it shows no ranking position, no
 * badge as locked or unlocked, and names no threshold for either. The only
 * badge-shaped field on the payload is `visited`, which a vendor cannot earn.
 *
 * The page is a good checklist. Describing it as what it is beats promising two
 * things it cannot show — and neither claim can be honestly made until the
 * ranking signal and the badge thresholds actually surface here.
 */
export const metadata: Metadata = {
  title: 'Dashboard : Onboarding',
  description:
    'See what your listing is missing, why each gap costs you bookings, and fix it in one click.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Setup checklist" />
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

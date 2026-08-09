import PageContainer from '@/components/dashboard/layout/page-container';
import OnboardingChecklistView from '@/components/dashboard/mainScreens/onboarding/onboarding-checklist-view';
import GettingStartedMigration from '@/components/dashboard/mainScreens/onboarding/getting-started-migration';
import { PageHeader } from '@/components/dashboard/primitives/page-header';
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
  title: 'Dashboard : Set up your listing',
  description:
    'A step-by-step setup for your listing: what is missing, why each gap costs you bookings, and one click to fix it.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        {/* PageHeader, not Heading + Separator — every other redesigned screen
            in the dashboard uses it, and this one was the odd stack of a big
            title over a rule. Consistency is the ask. */}
        <div className="space-y-4 p-4 md:p-6">
          <PageHeader
            eyebrow="Grow"
            title="Set up your listing"
            description="Six steps, in the order a listing actually gets built."
          />
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

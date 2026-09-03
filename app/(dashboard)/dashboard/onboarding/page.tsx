import { OnboardingArtifact } from '@/components/dashboard/mainScreens/onboarding/artifact/onboarding-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Set up your listing',
  description:
    'Your listing scorecard — what is complete, what is missing, and the highest-value thing to do next.',
};

export default function Page() {
  return <OnboardingArtifact />;
}

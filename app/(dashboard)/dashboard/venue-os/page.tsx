import { VenueOsArtifact } from '@/components/dashboard/mainScreens/venue-os/artifact/venue-os-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Venue OS',
  description: 'Your whole business at a glance — money in, money out, and profit.',
};

export default function Page() {
  return <VenueOsArtifact />;
}

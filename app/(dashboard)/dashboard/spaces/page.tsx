import { SpacesArtifact } from '@/components/dashboard/mainScreens/venue-os/artifact/spaces-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Halls & Spaces',
  description: 'Manage your halls, lawns and sections — capacity, rent, booking mode and wet-weather fallback.',
};

export default function Page() {
  return <SpacesArtifact />;
}

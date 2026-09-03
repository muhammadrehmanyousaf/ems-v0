import { SetupArtifact } from '@/components/dashboard/mainScreens/setup/artifact/setup-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Set up',
  description: 'Venue configuration, compliance and growth — business settings, halls, packages, stock, halal, drone NOC, promote and collaborations, all in one place.',
};

export default function Page() {
  return <SetupArtifact />;
}

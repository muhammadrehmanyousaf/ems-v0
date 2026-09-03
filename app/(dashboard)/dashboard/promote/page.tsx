import { PromoteArtifact } from '@/components/dashboard/mainScreens/promote/artifact/promote-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Promote',
  description: 'Request featured placement on the Wedding Wala marketplace.',
};

export default function Page() {
  return <PromoteArtifact />
}

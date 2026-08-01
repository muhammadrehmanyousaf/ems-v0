import type { Metadata } from 'next';
import { CollaborationsRedesignedView } from '@/components/dashboard/mainScreens/collaborations/redesigned/collaborations-redesigned-view';

export const metadata: Metadata = {
  title: 'Dashboard : Collaborations',
  description: 'Invite other Wedding Wala vendors to collaborate on your events.',
};

export default function Page() {
  return <CollaborationsRedesignedView />
}

import type { Metadata } from 'next';
import { CollaborationsArtifact } from "@/components/dashboard/mainScreens/collaborations/artifact/collaborations-artifact";

export const metadata: Metadata = {
  title: 'Dashboard : Collaborations',
  description: 'Invite other Wedding Wala vendors to collaborate on your events.',
};

export default function Page() {
  return <CollaborationsArtifact />
}

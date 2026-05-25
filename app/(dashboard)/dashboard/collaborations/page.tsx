import PageContainer from '@/components/dashboard/layout/page-container';
import CollaborationsView from '@/components/dashboard/mainScreens/collaborations/collaborations-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Collaborations',
  description: 'Invite other Wedding Wala vendors to collaborate on your events.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Collaborations"
            description="Bring other vendors onto your events — invite, accept, and track who's doing what."
          />
          <Separator />
          <CollaborationsView />
        </div>
      </PageContainer>
    </div>
  );
}

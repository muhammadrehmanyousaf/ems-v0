import PageContainer from '@/components/dashboard/layout/page-container';
import StaffDetailView from '@/components/dashboard/mainScreens/staff/staff-detail-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Staff member',
  description:
    'One crew member — what they are still owed, every shift they worked, and how they get paid.',
};

/** /dashboard/staff/[id] — answers "mera kitna baqi hai?" in one place. */
export default function Page({ params }: { params: { id: string } }) {
  const staffId = Number(params.id);
  return (
    <PageContainer>
      <StaffDetailView staffId={staffId} />
    </PageContainer>
  );
}

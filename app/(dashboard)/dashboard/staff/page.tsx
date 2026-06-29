import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import StaffView from '@/components/dashboard/mainScreens/staff/staff-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { StaffRedesignedView } from '@/components/dashboard/mainScreens/staff/redesigned/staff-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Staff & Payroll',
  description:
    'Staff roster + casual-labour dihari payroll for Pakistani wedding vendors — every shift snapshotted into an immutable payroll ledger.',
};

export default function Page() {
  if (isRedesignOn()) return <StaffRedesignedView />;

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Staff &amp; payroll" />
          <Separator />
          <StaffView />
        </div>
      </PageContainer>
    </div>
  );
}

import { StaffArtifact } from '@/components/dashboard/mainScreens/staff/artifact/staff-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Staff & Payroll',
  description:
    'Staff roster + casual-labour dihari payroll for Pakistani wedding vendors — every shift snapshotted into an immutable payroll ledger.',
};

export default function Page() {
  return <StaffArtifact />
}

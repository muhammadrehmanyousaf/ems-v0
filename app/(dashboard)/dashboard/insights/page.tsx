import { ReportsArtifact } from '@/components/dashboard/mainScreens/insights/artifact/reports-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Reports',
  description: 'Revenue trend, bookings by status, lead sources, and hall performance.',
};

export default function Page() {
  return <ReportsArtifact />
}

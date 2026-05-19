import PageContainer from '@/components/dashboard/layout/page-container';
import PlatformPulseView from '@/components/dashboard/mainScreens/admin/platform-pulse-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin : Platform pulse',
  description:
    'One-shot snapshot of platform health — vendors, bookings, money flow, compliance.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Platform pulse" />
          <Separator />
          <PlatformPulseView />
        </div>
      </PageContainer>
    </div>
  );
}

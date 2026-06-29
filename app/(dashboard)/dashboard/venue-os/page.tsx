import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { VenueOsHubView } from '@/components/dashboard/mainScreens/venue-os/venue-os-hub-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Venue-OS',
  description:
    'Multi-venue vendor-OS pilot — group roll-up, per-event P&L off the ledger, live EventNight headcount, post-dated cheque clearing and cash-float (galla) reconciliation.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Venue-OS"
            description="Group roll-up, per-event P&L, live capacity, cheque clearing and cash-float — for multi-venue operators."
          />
          <Separator />
          <VenueOsHubView />
        </div>
      </PageContainer>
    </div>
  );
}

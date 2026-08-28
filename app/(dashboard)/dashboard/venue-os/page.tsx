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

/**
 * WWL-530 (S3) — this heading said "Venue-OS" whichever tab you arrived on, so
 * a vendor who clicked "Halls & spaces" in the sidebar landed on a page headed
 * "Venue-OS". The heading now names the tab, matching the sidebar exactly.
 */
/**
 * Headings for the tabs that are still switched on.
 *
 * The five hidden ones are commented out with their tabs (see PRIMARY_TABS in
 * venue-os-hub-view.tsx). They have to go together: the heading is keyed off
 * the RAW ?tab= value while the hub validates that value against its tab list,
 * so leaving `cash` here would title the page "Cash & cheques" above whatever
 * the hub actually fell back to rendering.
 */
const TAB_HEADINGS: Record<string, { title: string; description: string }> = {
  // today: { title: 'Tonight', description: "What is happening tonight — arrivals, headcount, unpaid balances and who to chase." },
  profit: { title: 'Event profit', description: 'Did each shaadi make money — booked, received and what you spent on it, per function.' },
  // money: { title: 'Venue money', description: 'Fixed overheads, utilities, leases and the spending that is not tied to one event.' },
  spaces: { title: 'Halls & spaces', description: 'Your halls, floors and partitions — availability, per-space P&L and slot templates.' },
  // cash: { title: 'Cash & cheques', description: 'The galla and the cheque book — float reconciliation, PDC clearing and bounce risk.' },
  // kitchen: { title: 'Kitchen', description: 'Recipes, prep sheets, procurement and the supplier side of the kitchen.' },
  // advanced: { title: 'Accounting', description: 'The ledger, period close, depreciation, compliance and the deeper finance tools.' },
};

const DEFAULT_HEADING = {
  title: 'Venue-OS',
  description: 'Group roll-up, per-event P&L, live capacity, cheque clearing and cash-float — for multi-venue operators.',
};

export default function Page({ searchParams }: { searchParams?: { tab?: string } }) {
  const heading = TAB_HEADINGS[searchParams?.tab ?? ''] ?? DEFAULT_HEADING;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title={heading.title} description={heading.description} />
          <Separator />
          <VenueOsHubView />
        </div>
      </PageContainer>
    </div>
  );
}

import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import PdcLedgerView from '@/components/dashboard/mainScreens/pdcs/pdc-ledger-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { PdcsRedesignedView } from '@/components/dashboard/mainScreens/pdcs/redesigned/pdcs-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : PDC Ledger',
  description:
    'Post-dated cheque tracking for Pakistani wedding vendors — held, deposited, cleared, bounced.',
};

export default function Page() {
  if (isRedesignOn()) return <PdcsRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Cheque ledger" />
          <Separator />
          <PdcLedgerView />
        </div>
      </PageContainer>
    </div>
  );
}

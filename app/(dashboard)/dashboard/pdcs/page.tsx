import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import PdcLedgerView from '@/components/dashboard/mainScreens/pdcs/pdc-ledger-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : PDC Ledger',
  description:
    'Post-dated cheque tracking for Pakistani wedding vendors — held, deposited, cleared, bounced.',
};

export default function Page() {
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

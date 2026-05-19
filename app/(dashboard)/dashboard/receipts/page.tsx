import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import ReceiptsLedgerView from '@/components/dashboard/mainScreens/receipts/receipts-ledger-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Payment Receipts',
  description:
    'Cash + digital payment receipt tracking for Pakistani wedding vendors — JazzCash, Easypaisa, Raast, IBFT.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Payment receipts" />
          <Separator />
          <ReceiptsLedgerView />
        </div>
      </PageContainer>
    </div>
  );
}

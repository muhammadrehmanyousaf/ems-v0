import PageContainer from '@/components/dashboard/layout/page-container';
import ReceivablesView from '@/components/dashboard/mainScreens/receivables/receivables-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Receivables',
  description:
    'A/R aging board — who owes you, how much, and how overdue. Phone-list-ready with WhatsApp deep links + CSV export.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Receivables"
            description="Who owes you money. Aged 0-30, 31-60, 61-90, 90+ — chase the oldest first."
          />
          <Separator />
          <ReceivablesView />
        </div>
      </PageContainer>
    </div>
  );
}

import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import ExpensesView from '@/components/dashboard/mainScreens/expenses/expenses-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { ExpensesRedesignedView } from '@/components/dashboard/mainScreens/expenses/redesigned/expenses-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Expenses',
  description:
    'Outflow tracking for Pakistani wedding vendors — mandi cash, fuel, casual labour, broker commission, tax.',
};

export default function Page() {
  if (isRedesignOn()) return <ExpensesRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Expenses" />
          <Separator />
          <ExpensesView />
        </div>
      </PageContainer>
    </div>
  );
}

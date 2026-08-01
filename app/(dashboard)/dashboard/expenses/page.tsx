import { ExpensesRedesignedView } from '@/components/dashboard/mainScreens/expenses/redesigned/expenses-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Expenses',
  description:
    'Outflow tracking for Pakistani wedding vendors — mandi cash, fuel, casual labour, broker commission, tax.',
};

export default function Page() {
  return <ExpensesRedesignedView />
}

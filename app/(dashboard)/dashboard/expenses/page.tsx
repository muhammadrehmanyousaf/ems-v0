import { ExpensesArtifact } from '@/components/dashboard/mainScreens/expenses/artifact/expenses-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Expenses',
  description: 'Track your costs — ingredients, fuel, labour, salaries and more, by category.',
};

const page = () => <ExpensesArtifact />;
export default page;

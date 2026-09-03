import { TaxArtifact } from '@/components/dashboard/mainScreens/tax/artifact/tax-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Tax report',
  description: 'Your annual revenue, expenses and net P&L — fiscal or calendar year, with a PDF export.',
};

const page = () => <TaxArtifact />;
export default page;

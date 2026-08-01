import { FunctionSheetsRedesignedView } from '@/components/dashboard/mainScreens/function-sheets/redesigned/function-sheets-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Function Sheets',
  description:
    'Smart-File morphing documents for Pakistani wedding vendors — Quote → Contract → BEO → Invoice → Receipt in one row. Printable PDF in any variant.',
};

export default function Page() {
  return <FunctionSheetsRedesignedView />
}

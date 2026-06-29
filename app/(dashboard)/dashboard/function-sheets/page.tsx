import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import FunctionSheetsView from '@/components/dashboard/mainScreens/function-sheets/function-sheets-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { FunctionSheetsRedesignedView } from '@/components/dashboard/mainScreens/function-sheets/redesigned/function-sheets-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Function Sheets',
  description:
    'Smart-File morphing documents for Pakistani wedding vendors — Quote → Contract → BEO → Invoice → Receipt in one row. Printable PDF in any variant.',
};

export default function Page() {
  if (isRedesignOn()) return <FunctionSheetsRedesignedView />;

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Function sheets" />
          <Separator />
          <FunctionSheetsView />
        </div>
      </PageContainer>
    </div>
  );
}

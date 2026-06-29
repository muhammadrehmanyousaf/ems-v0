import PageContainer from '@/components/dashboard/layout/page-container';
import AnnualTaxReportView from '@/components/dashboard/mainScreens/tax/annual-tax-report-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { TaxRedesignedView } from '@/components/dashboard/mainScreens/tax/redesigned/tax-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Tax report',
  description:
    'Annual revenue + expense + P&L summary, FBR-fiscal-year aligned. One-click PDF export for your accountant.',
};

export default function Page() {
  if (isRedesignOn()) return <TaxRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Tax report" />
          <Separator />
          <AnnualTaxReportView />
        </div>
      </PageContainer>
    </div>
  );
}

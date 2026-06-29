import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import SuppliersView from '@/components/dashboard/mainScreens/suppliers/suppliers-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { SuppliersRedesignedView } from '@/components/dashboard/mainScreens/suppliers/redesigned/suppliers-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Supplier Ledger',
  description:
    'Supplier directory + A/P invoice ledger for Pakistani wedding vendors — embedded payment tracking, FBR NTN/STRN capture, A/P aging dashboard.',
};

export default function Page() {
  if (isRedesignOn()) return <SuppliersRedesignedView />;

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Suppliers &amp; A/P ledger" />
          <Separator />
          <SuppliersView />
        </div>
      </PageContainer>
    </div>
  );
}

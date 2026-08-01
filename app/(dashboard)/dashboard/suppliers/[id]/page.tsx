import PageContainer from '@/components/dashboard/layout/page-container';
import SupplierDetailView from '@/components/dashboard/mainScreens/suppliers/supplier-detail-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Supplier',
  description:
    'One supplier — what is outstanding, what is overdue, and every invoice they have raised.',
};

/** /dashboard/suppliers/[id] — the mirror of the staff page, money flowing out. */
export default function Page({ params }: { params: { id: string } }) {
  const supplierId = Number(params.id);
  return (
    <PageContainer>
      <SupplierDetailView supplierId={supplierId} />
    </PageContainer>
  );
}

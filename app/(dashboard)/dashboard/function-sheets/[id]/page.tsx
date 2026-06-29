import PageContainer from '@/components/dashboard/layout/page-container';
import FunctionSheetDetailView from '@/components/dashboard/mainScreens/function-sheets/function-sheet-detail-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { FunctionSheetDetailRedesignedView } from '@/components/dashboard/mainScreens/function-sheets/redesigned/function-sheet-detail-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Function Sheet',
  description:
    'Full working surface for a single Function Sheet — line items, signatures, payment schedule, audit log, and all actions in one place.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const sheetId = Number(id);
  if (isRedesignOn()) return <FunctionSheetDetailRedesignedView id={sheetId} />;
  return (
    <div>
      <PageContainer>
        <FunctionSheetDetailView sheetId={sheetId} />
      </PageContainer>
    </div>
  );
}

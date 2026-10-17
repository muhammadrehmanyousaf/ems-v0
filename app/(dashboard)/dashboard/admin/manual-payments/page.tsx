import PageContainer from '@/components/dashboard/layout/page-container';
import AdminManualPaymentsView from '@/components/dashboard/mainScreens/admin/subscriptions/admin-manual-payments-view';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Manual payments',
  description: 'Bank, JazzCash and Easypaisa payment proofs waiting for approval.',
};

export default function Page() {
  return (
    <AdminGuard requireSuperAdmin>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Manual payments"
            description="Plan payments sent by bank transfer, JazzCash or Easypaisa. Approve to unlock the vendor, or reject with a reason."
          />
          <Separator />
          <AdminManualPaymentsView />
        </div>
      </PageContainer>
    </AdminGuard>
  );
}

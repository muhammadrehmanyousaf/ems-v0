import PageContainer from '@/components/dashboard/layout/page-container';
import AdminBillingToolsView from '@/components/dashboard/mainScreens/admin/subscriptions/admin-billing-tools-view';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Billing tools',
  description: 'Vendor plan state, trial and comp tools, unlock, suspend, audit log and plan metrics.',
};

export default function Page() {
  return (
    <AdminGuard requireSuperAdmin>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Billing tools"
            description="Look up a vendor's plan, extend a trial, comp, unlock or suspend with a reason, and watch trials, conversions and the audit log."
          />
          <Separator />
          <AdminBillingToolsView />
        </div>
      </PageContainer>
    </AdminGuard>
  );
}

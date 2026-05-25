import PageContainer from '@/components/dashboard/layout/page-container';
import AdminPromotionsView from '@/components/dashboard/mainScreens/admin/promotions/admin-promotions-view';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Promotion queue',
  description: 'Review and approve vendor featured-listing requests.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading
            title="Promotions"
            description="Review vendor featured-listing requests. Approve to surface them on the marketplace."
          />
          <Separator />
          <AdminPromotionsView />
        </div>
      </PageContainer>
    </div>
  );
}

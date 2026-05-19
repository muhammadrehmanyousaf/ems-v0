import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import InventoryView from '@/components/dashboard/mainScreens/inventory/inventory-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Inventory',
  description:
    'Stock tracker for Pakistani wedding vendors — ingredients, rental fleet, equipment, consumables. Movements form an immutable audit ledger.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Inventory" />
          <Separator />
          <InventoryView />
        </div>
      </PageContainer>
    </div>
  );
}

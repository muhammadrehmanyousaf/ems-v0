import { InventoryRedesignedView } from '@/components/dashboard/mainScreens/inventory/redesigned/inventory-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Inventory',
  description:
    'Stock tracker for Pakistani wedding vendors — ingredients, rental fleet, equipment, consumables. Movements form an immutable audit ledger.',
};

export default function Page() {
  return <InventoryRedesignedView />
}

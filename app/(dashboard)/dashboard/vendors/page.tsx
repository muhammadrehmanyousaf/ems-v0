import { AdminGuard } from "@/components/admin/AdminGuard";
import { VendorsAdminRedesignedView } from "@/components/dashboard/mainScreens/vendors/redesigned/vendors-admin-redesigned-view";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard : Vendors',
    description: 'Every vendor on the platform — verification state, listings and activity.'
};

export default function page() {
  return (
    <AdminGuard>
      <VendorsAdminRedesignedView />
    </AdminGuard>
  );
}

import { Metadata } from 'next';
import { AdminGuard } from "@/components/admin/AdminGuard";
import { BusinessesAdminRedesignedView } from "@/components/dashboard/mainScreens/businesses/redesigned/businesses-admin-redesigned-view"

export const metadata: Metadata = {
    title: 'Dashboard : Businesses',
    description: 'Every business on the platform — approve, suspend and inspect listings.'
};

function page() {
  return (
    <AdminGuard>
      <BusinessesAdminRedesignedView />
    </AdminGuard>
  );
}

export default page

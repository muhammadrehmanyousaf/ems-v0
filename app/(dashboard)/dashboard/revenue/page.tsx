import { Metadata } from 'next';
import { AdminGuard } from "@/components/admin/AdminGuard";
import { RevenueRedesignedView } from "@/components/dashboard/mainScreens/revenue/redesigned/revenue-redesigned-view";

export const metadata: Metadata = {
    title: 'Dashboard : Revenue',
    description: 'Platform revenue and vendor payouts'
};

function page() {
  return (
    <AdminGuard>
      <RevenueRedesignedView />
    </AdminGuard>
  );
}

export default page

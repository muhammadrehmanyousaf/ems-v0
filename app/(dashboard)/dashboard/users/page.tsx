import { Metadata } from 'next';
import { AdminGuard } from "@/components/admin/AdminGuard";
import { UsersAdminRedesignedView } from "@/components/dashboard/mainScreens/users/redesigned/users-admin-redesigned-view";

export const metadata: Metadata = {
    title: 'Dashboard : Users',
    description: 'Every account on the platform — roles, status and access.'
};

// Super-admin only: this screen assigns roles, so it is the same trust tier as
// /dashboard/roles.
const page = () => {
  return (
    <AdminGuard requireSuperAdmin>
      <UsersAdminRedesignedView />
    </AdminGuard>
  );
}

export default page

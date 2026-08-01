import { AdminGuard } from "@/components/admin/AdminGuard";
import { RolesAdminRedesignedView } from "@/components/dashboard/mainScreens/roles/redesigned/roles-admin-redesigned-view";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard : Roles',
    description: 'Roles and permissions — who can do what on the platform.'
};

// Access control is super-admin only; an ordinary admin must not be able to
// widen their own permissions.
const page = () => {
  return (
    <AdminGuard requireSuperAdmin>
      <RolesAdminRedesignedView />
    </AdminGuard>
  );
}

export default page

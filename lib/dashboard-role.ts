// Single source of truth for which dashboard surfaces a user can see.
//
// Customer accounts never land on /dashboard — middleware sends them to
// /user/* — so we only need three flavours here: superAdmin / admin / vendor.

export type DashboardRole = "superAdmin" | "admin" | "vendor" | "none";

interface RoleLike { id?: number; name?: string }
interface UserLike {
  isSuperAdmin?: boolean;
  isVendor?: boolean;
  roles?: RoleLike[];
}

const ADMIN_ROLE_NAMES = new Set(["admin", "administrator", "platform admin"]);

// Canonical role-table ids (Roles table): 1 = super admin, 2 = Vendor,
// 3 = User. NEVER treat id 2 as admin — id 2 is a VENDOR. Doing so flagged
// every vendor as an admin and dropped them on the admin dashboard.
const SUPER_ADMIN_ROLE_ID = 1;
const VENDOR_ROLE_ID = 2;
const SUPER_ADMIN_ROLE_NAMES = new Set(["super admin", "superadmin", "super-admin"]);

export function getDashboardRole(user: UserLike | null | undefined): DashboardRole {
  if (!user) return "none";

  const roles = user.roles ?? [];
  const hasRole = (
    ids: number[],
    names: Set<string>,
  ) =>
    roles.some((r) => {
      const n = r.name?.toLowerCase().trim();
      return (typeof r.id === "number" && ids.includes(r.id)) || (!!n && names.has(n));
    });

  // Super admin — explicit flag, role id 1, or a "super admin" role name.
  if (user.isSuperAdmin || hasRole([SUPER_ADMIN_ROLE_ID], SUPER_ADMIN_ROLE_NAMES))
    return "superAdmin";

  // Admin — only a dedicated admin role by NAME. There is no separate admin
  // role id in the current 3-role system (kept for forward-compat).
  if (hasRole([], ADMIN_ROLE_NAMES)) return "admin";

  // Vendor — explicit flag, role id 2, or a "vendor" role name.
  if (user.isVendor || hasRole([VENDOR_ROLE_ID], new Set(["vendor"])))
    return "vendor";

  return "none";
}

export const isAdminLike = (role: DashboardRole) =>
  role === "superAdmin" || role === "admin";

export const isSuperOnly = (role: DashboardRole) => role === "superAdmin";

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

export function getDashboardRole(user: UserLike | null | undefined): DashboardRole {
  if (!user) return "none";
  if (user.isSuperAdmin) return "superAdmin";

  const isAdmin = user.roles?.some((r) => {
    const n = r.name?.toLowerCase().trim();
    return (n && ADMIN_ROLE_NAMES.has(n)) || r.id === 2;
  });
  if (isAdmin) return "admin";

  if (user.isVendor) return "vendor";
  return "none";
}

export const isAdminLike = (role: DashboardRole) =>
  role === "superAdmin" || role === "admin";

export const isSuperOnly = (role: DashboardRole) => role === "superAdmin";

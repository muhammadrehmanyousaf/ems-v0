import {
  Bell,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Fuel,
  Handshake,
  Plane,
  ShieldCheck,
  HandCoins,
  Truck,
  CircleDollarSign,
  ClipboardList,
  FileBadge,
  Gauge,
  Gavel,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Settings,
  Settings2,
  ShieldAlert,
  Smile,
  Sparkles,
  SquareUser,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"

/**
 * Sidebar nav data, split by role.
 *
 * Each super/admin section maps 1:1 to a real backend endpoint — modules
 * with no backend support (and modules that don't make sense for a platform
 * admin like Calendar / Conversations / sidebar Notifications / standalone
 * Reviews) have been removed.
 */
export const data = {
  // ── Vendor ──────────────────────────────────────────────────────
  // Vendors run their own business — full operational nav.
  vendorMainNav: [
    { name: "Dashboard",     url: "/dashboard",                icon: LayoutDashboard, i18nKey: "nav.dashboard" },
    { name: "Today",         url: "/dashboard/today",          icon: Sparkles,        i18nKey: "nav.today" },
    { name: "Lead inbox",    url: "/dashboard/leads",          icon: Inbox,           i18nKey: "nav.leads" },
    { name: "Bookings",      url: "/dashboard/bookings",       icon: ClipboardList,   i18nKey: "nav.bookings" },
    { name: "Function sheets", url: "/dashboard/function-sheets", icon: FileText,     i18nKey: "nav.function_sheets" },
    { name: "Customers",     url: "/dashboard/customers",      icon: SquareUser,      i18nKey: "nav.customers" },
    { name: "Calendar",      url: "/dashboard/calendar",       icon: CalendarDays,    i18nKey: "nav.calendar" },
    { name: "Conversations", url: "/dashboard/chat",           icon: MessageSquareText, i18nKey: "nav.conversations" },
    { name: "Payments",      url: "/dashboard/payments",       icon: CircleDollarSign, i18nKey: "nav.payments" },
    { name: "Receipts",      url: "/dashboard/receipts",       icon: CircleDollarSign, i18nKey: "nav.receipts" },
    { name: "Cheque ledger", url: "/dashboard/pdcs",           icon: Wallet,          i18nKey: "nav.cheque_ledger" },
    { name: "Expenses",      url: "/dashboard/expenses",       icon: Wallet,          i18nKey: "nav.expenses" },
    { name: "Inventory",     url: "/dashboard/inventory",      icon: Boxes,           i18nKey: "nav.inventory" },
    { name: "Staff & payroll", url: "/dashboard/staff",        icon: HandCoins,       i18nKey: "nav.staff" },
    { name: "Suppliers",     url: "/dashboard/suppliers",      icon: Truck,           i18nKey: "nav.suppliers" },
    { name: "Brokers",       url: "/dashboard/brokers",        icon: Handshake,       i18nKey: "nav.brokers" },
    { name: "Generator fuel",url: "/dashboard/generator-fuel", icon: Fuel,            i18nKey: "nav.generator_fuel" },
    { name: "Halal certs",   url: "/dashboard/halal-certs",    icon: ShieldCheck,     i18nKey: "nav.halal_certs" },
    { name: "Drone NOC",     url: "/dashboard/drone-noc",      icon: Plane,           i18nKey: "nav.drone_noc" },
    { name: "Reviews",       url: "/dashboard/reviews",        icon: Smile,           i18nKey: "nav.reviews" },
    { name: "Notifications", url: "/dashboard/notifications",  icon: Bell,            i18nKey: "nav.notifications" },
  ],

  vendorMyBusiness: [
    { name: "Business Settings", url: "/dashboard/settings", icon: Settings, i18nKey: "nav.business_settings" },
  ],

  // ── Admin / Super-admin ────────────────────────────────────────
  // Cleaned, platform-relevant set.

  adminOverview: [
    { name: "Dashboard", url: "/dashboard", icon: Gauge },
  ],

  // Day-to-day platform operations — review queues + monitoring.
  adminOperations: [
    { name: "Vendor queue",   url: "/dashboard/admin/vendor-queue", icon: UserCheck },
    { name: "KYC documents",  url: "/dashboard/admin/documents",    icon: FileBadge },
    { name: "Disputes",       url: "/dashboard/admin/disputes",     icon: Gavel },
    { name: "Bookings",       url: "/dashboard/bookings",           icon: ClipboardList },
    { name: "Payments",       url: "/dashboard/payments",           icon: Wallet },
  ],

  // Read-mostly directories of every entity on the platform.
  adminDirectory: [
    { name: "Vendors",    url: "/dashboard/vendors",    icon: UserCheck },
    { name: "Businesses", url: "/dashboard/businesses", icon: BriefcaseBusiness },
    { name: "Customers",  url: "/dashboard/customers",  icon: SquareUser },
  ],

  // Platform-level concerns — money + access control + forensics.
  // Audit logs + Roles + Users are super-admin only.
  adminPlatform: [
    { name: "Revenue",    url: "/dashboard/revenue",            icon: CircleDollarSign },
    { name: "Audit logs", url: "/dashboard/admin/audit-logs",   icon: ScrollText },   // super-only
    { name: "Roles",      url: "/dashboard/roles",              icon: Settings2 },    // super-only
    { name: "Users",      url: "/dashboard/users",              icon: Users },        // super-only
  ],

  // Highest-trust emergency tools — super-admin only.
  adminEmergency: [
    { name: "Force majeure", url: "/dashboard/admin/force-majeure", icon: ShieldAlert },
  ],
}

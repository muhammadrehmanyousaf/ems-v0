import {
  Bell,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  HandCoins,
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
    { name: "Dashboard",     url: "/dashboard",                icon: LayoutDashboard },
    // Vendor Portal Phase 1 #7.6 — Day-of timeline runner.
    // Positioned right under Dashboard because it's the page floor
    // managers open first on a wedding day.
    { name: "Today",         url: "/dashboard/today",          icon: Sparkles },
    // Vendor Portal Phase 1 #7.3 — Lead Inbox. Sits above Bookings
    // because every booking starts as a lead.
    { name: "Lead inbox",    url: "/dashboard/leads",          icon: Inbox },
    { name: "Bookings",      url: "/dashboard/bookings",       icon: ClipboardList },
    { name: "Customers",     url: "/dashboard/customers",      icon: SquareUser },
    { name: "Calendar",      url: "/dashboard/calendar",       icon: CalendarDays },
    { name: "Conversations", url: "/dashboard/chat",           icon: MessageSquareText },
    { name: "Payments",      url: "/dashboard/payments",       icon: CircleDollarSign },
    // Vendor Portal Phase 1 #7.5 — Cash + digital payment receipts.
    { name: "Receipts",      url: "/dashboard/receipts",       icon: CircleDollarSign },
    // Vendor Portal Phase 1 #7.4 — Post-dated cheque ledger.
    { name: "Cheque ledger", url: "/dashboard/pdcs",           icon: Wallet },
    // Vendor Portal Phase 2 #8.3 — Expense tracking + per-event P&L.
    { name: "Expenses",      url: "/dashboard/expenses",       icon: Wallet },
    // Vendor Portal Phase 2 #8.1 — Inventory tracker.
    { name: "Inventory",     url: "/dashboard/inventory",      icon: Boxes },
    // Vendor Portal Phase 2 #8.2 — Staff rota + casual-labour payroll.
    { name: "Staff & payroll", url: "/dashboard/staff",        icon: HandCoins },
    { name: "Reviews",       url: "/dashboard/reviews",        icon: Smile },
    { name: "Notifications", url: "/dashboard/notifications",  icon: Bell },
  ],

  vendorMyBusiness: [
    { name: "Business Settings", url: "/dashboard/settings", icon: Settings },
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

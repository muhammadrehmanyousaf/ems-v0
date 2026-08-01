import {
  Bell,
  Boxes,
  BriefcaseBusiness,
  Building2,
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
  CreditCard,
  FileBadge,
  Gauge,
  Gavel,
  MessageSquareWarning,
  Inbox,
  LayoutDashboard,
  Megaphone,
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
  AlertCircle,
  Zap,
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
    { name: "Receivables",   url: "/dashboard/receivables",    icon: AlertCircle,     i18nKey: "nav.receivables" },
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
    // Growth — gated by feature flags in buildVendorSections.
    { name: "Promote",       url: "/dashboard/promote",        icon: Megaphone,       i18nKey: "nav.promote" },
    { name: "Plan & billing", url: "/dashboard/billing",       icon: CreditCard,      i18nKey: "nav.billing" },
    { name: "Collaborations", url: "/dashboard/collaborations", icon: Handshake,      i18nKey: "nav.collaborations" },
  ],

  vendorMyBusiness: [
    { name: "Business Settings", url: "/dashboard/settings", icon: Settings, i18nKey: "nav.business_settings" },
  ],

  // Venue-OS (multi-venue vendor-OS spine) — pilot surface, gated in
  // buildVendorSections by NEXT_PUBLIC_ORG_MEMBERSHIP_ON (default OFF). No
  // i18nKey: falls back to `name` so there's no missing-translation key.
  // WW-VENUEOS — seven doors, not one.
  //
  // This was a single "Venue-OS" entry leading to a tabbed hub holding 46 views
  // over 179 endpoints. Everything a venue owner actually runs their business
  // with — tonight's event, whether each shaadi made money, cheques, halls,
  // kitchen — sat behind one word that told them none of it was there.
  //
  // Each tab is now its own rail entry pointing at its own URL. Same hub
  // renders; the difference is that a vendor can SEE what exists, bookmark the
  // one they use daily, and send a hall manager a link to Spaces.
  vendorVenueOs: [
    { name: "Tonight", url: "/dashboard/venue-os?tab=today", icon: CalendarDays },
    { name: "Event profit", url: "/dashboard/venue-os?tab=profit", icon: CircleDollarSign },
    { name: "Venue money", url: "/dashboard/venue-os?tab=money", icon: Wallet },
    { name: "Halls & spaces", url: "/dashboard/venue-os?tab=spaces", icon: Building2 },
    { name: "Cash & cheques", url: "/dashboard/venue-os?tab=cash", icon: CreditCard },
    { name: "Kitchen", url: "/dashboard/venue-os?tab=kitchen", icon: Boxes },
    { name: "Accounting", url: "/dashboard/venue-os?tab=advanced", icon: Settings2 },
  ],

  // PWA-02 — Field Capture hub (offline-first lead/payment/expense/hold capture).
  // Injected flag-gated (NEXT_PUBLIC_FEAT_OFFLINE_OUTBOX) in app-sidebar so it
  // stays hidden until the pilot enables offline mode.
  vendorFieldCapture: [
    { name: "Field capture", url: "/dashboard/field", icon: Zap, i18nKey: "nav.field_capture" },
  ],

  // FEAT_QUOTE_NEGOTIATION — customer quote/haggle requests. Injected flag-gated
  // (NEXT_PUBLIC_FEAT_QUOTE_NEGOTIATION) in app-sidebar; dark until pilot-enabled.
  vendorQuotes: [
    { name: "Quote requests", url: "/dashboard/quotes", icon: Handshake, i18nKey: "nav.quotes" },
  ],

  // ── Admin / Super-admin ────────────────────────────────────────
  // Cleaned, platform-relevant set.

  adminOverview: [
    { name: "Dashboard", url: "/dashboard", icon: Gauge },
  ],

  // Day-to-day platform operations — review queues + monitoring.
  adminOperations: [
    { name: "Vendor queue",   url: "/dashboard/admin/vendor-queue", icon: UserCheck },
    { name: "Claim requests", url: "/dashboard/claims",             icon: ShieldCheck },
    { name: "KYC documents",  url: "/dashboard/admin/documents",    icon: FileBadge },
    { name: "Disputes",       url: "/dashboard/admin/disputes",     icon: Gavel },
    // Disputes are customer↔vendor about one booking. Complaints are about
    // US — often with no booking at all. Different queue, different remedy.
    { name: "Complaints",     url: "/dashboard/admin/complaints",   icon: MessageSquareWarning },
    { name: "Promotions",     url: "/dashboard/admin/promotions",   icon: Megaphone },
    { name: "Plan upgrades",  url: "/dashboard/admin/subscriptions", icon: CreditCard },
    // NO Bookings / Payments here. Both routes render VENDOR-scoped screens
    // (/dashboard/payments calls PaymentsAPI.getVendorRevenue()), so an admin
    // — who owns no business — got empty tables and Rs 0 tiles. The
    // platform-level equivalents are already in the nav: Revenue for money,
    // Disputes for booking problems. Vendors keep their own entries in
    // `vendorMainNav` above; this array is admin-only.
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

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
  CalendarClock,
  Receipt,
  BarChart3,
  Workflow,
  ChefHat,
  ListChecks,
  Activity,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
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
    { name: "Date holds",    url: "/dashboard/holds",          icon: CalendarClock,   i18nKey: "nav.holds" },
    { name: "Function sheets", url: "/dashboard/function-sheets", icon: FileText,     i18nKey: "nav.function_sheets" },
    { name: "Customers",     url: "/dashboard/customers",      icon: SquareUser,      i18nKey: "nav.customers" },
    { name: "Calendar",      url: "/dashboard/calendar",       icon: CalendarDays,    i18nKey: "nav.calendar" },
    { name: "Conversations", url: "/dashboard/chat",           icon: MessageSquareText, i18nKey: "nav.conversations" },
    { name: "Payments",      url: "/dashboard/payments",       icon: CircleDollarSign, i18nKey: "nav.payments" },
    { name: "Receivables",   url: "/dashboard/receivables",    icon: AlertCircle,     i18nKey: "nav.receivables" },
    { name: "Receipts",      url: "/dashboard/receipts",       icon: CircleDollarSign, i18nKey: "nav.receipts" },
    { name: "Cheque ledger", url: "/dashboard/pdcs",           icon: Wallet,          i18nKey: "nav.cheque_ledger" },
    { name: "Expenses",      url: "/dashboard/expenses",       icon: Wallet,          i18nKey: "nav.expenses" },
    { name: "Tax report",    url: "/dashboard/tax",            icon: Receipt,         i18nKey: "nav.tax" },
    // Points at /insights (the champagne-shell ReportsArtifact), NOT the legacy
    // /dashboard/reports route which still renders the old off-shell ReportCardsView.
    { name: "Reports",       url: "/dashboard/insights",       icon: BarChart3,       i18nKey: "nav.reports" },
    { name: "Trade operations", url: "/dashboard/trade-ops",   icon: Workflow,        i18nKey: "nav.trade_ops" },
    { name: "Automation",    url: "/dashboard/automation",     icon: Zap,             i18nKey: "nav.automation" },
    { name: "Kitchen prep",  url: "/dashboard/kitchen-prep",   icon: ChefHat,         i18nKey: "nav.kitchen_prep" },
    { name: "Inventory",     url: "/dashboard/inventory",      icon: Boxes,           i18nKey: "nav.inventory" },
    { name: "Staff & payroll", url: "/dashboard/staff",        icon: HandCoins,       i18nKey: "nav.staff" },
    { name: "Suppliers",     url: "/dashboard/suppliers",      icon: Truck,           i18nKey: "nav.suppliers" },
    { name: "Brokers",       url: "/dashboard/brokers",        icon: Handshake,       i18nKey: "nav.brokers" },
    { name: "Generator fuel",url: "/dashboard/generator-fuel", icon: Fuel,            i18nKey: "nav.generator_fuel" },
    { name: "Halal certs",   url: "/dashboard/halal-certs",    icon: ShieldCheck,     i18nKey: "nav.halal_certs" },
    { name: "Drone NOC",     url: "/dashboard/drone-noc",      icon: Plane,           i18nKey: "nav.drone_noc" },
    { name: "Reviews",       url: "/dashboard/reviews",        icon: Smile,           i18nKey: "nav.reviews" },
    { name: "Notifications", url: "/dashboard/notifications",  icon: Bell,            i18nKey: "nav.notifications" },
    // Growth — rendered as the "Grow" section in buildVendorSections.
    { name: "Promote",       url: "/dashboard/promote",        icon: Megaphone,       i18nKey: "nav.promote" },
    { name: "Plan & billing", url: "/dashboard/billing",       icon: CreditCard,      i18nKey: "nav.billing" },
    { name: "Collaborations", url: "/dashboard/collaborations", icon: Handshake,      i18nKey: "nav.collaborations" },
  ],

  vendorMyBusiness: [
    { name: "Business Settings", url: "/dashboard/settings", icon: Settings, i18nKey: "nav.business_settings" },
    // Both screens were built and unreachable. A vendor could not say when they
    // are bookable, or what happens when a customer cancels — the two questions
    // every enquiry starts with.
    // Points at /slots (the champagne-shell SlotsArtifact, which lives in the
    // availability module folder), NOT the legacy /dashboard/availability route
    // which still renders the old off-shell AvailabilitySetup.
    { name: "Availability", url: "/dashboard/slots", icon: CalendarClock, i18nKey: "nav.availability" },
    { name: "Cancellation policy", url: "/dashboard/cancellation-policy", icon: FileText, i18nKey: "nav.cancellation_policy" },
    { name: "Setup checklist", url: "/dashboard/onboarding", icon: ListChecks, i18nKey: "nav.onboarding" },
  ],

  // Venue-OS. No i18nKey: falls back to `name` so there is no missing-key.
  //
  // HISTORY: this was once seven rail entries (Tonight / Event profit / Venue
  // money / Halls & spaces / Cash & cheques / Kitchen / Accounting), each a
  // distinct `/dashboard/venue-os?tab=…` URL. But the founder found that tabbed
  // multi-view hub confusing, so `venue-os-artifact.tsx` was deliberately
  // rebuilt as ONE simple business-health view (money in − out = profit) that
  // ignores `?tab=`. The seven doors therefore all opened the same room — a QA
  // finding (2026-09). Collapsed back to the single entry that matches the
  // screen that actually renders. The per-purpose destinations already live in
  // the main rail (Today, Cheque ledger, Kitchen prep, Tax report) or on the
  // Setup landing (Halls & spaces → /dashboard/spaces). Restore individual
  // doors only if/when the artifact grows real per-tab views.
  vendorVenueOs: [
    { name: "Venue-OS", url: "/dashboard/venue-os", icon: Building2 },
    // Halls & spaces (SpacesArtifact) — a real, distinct screen that otherwise
    // only lived on the Setup landing card once the stale ?tab= doors were
    // collapsed. Given its own rail entry so it stays one tap away.
    { name: "Halls & spaces", url: "/dashboard/spaces", icon: LayoutGrid },
  ],

  // PWA-02 — Field Capture hub (offline-first lead/payment/expense/hold capture).
  vendorFieldCapture: [
    { name: "Field capture", url: "/dashboard/field", icon: Zap, i18nKey: "nav.field_capture" },
  ],

  // Customer quote/haggle requests.
  vendorQuotes: [
    { name: "Quote requests", url: "/dashboard/quotes", icon: Handshake, i18nKey: "nav.quotes" },
  ],

  // ── Admin / Super-admin ────────────────────────────────────────
  // Cleaned, platform-relevant set.

  adminOverview: [
    { name: "Dashboard", url: "/dashboard", icon: Gauge },
    { name: "Platform pulse", url: "/dashboard/admin/platform-pulse", icon: Activity },
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
    { name: "Activity & audit", url: "/dashboard/admin/activity",   icon: Activity },
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
    { name: "Businesses overview", url: "/dashboard/businesses-overview", icon: BarChart3 },
    { name: "Customers",  url: "/dashboard/customers",  icon: SquareUser },
  ],

  // Platform-level concerns — money + access control + forensics.
  // Audit logs + Roles + Users are super-admin only.
  adminPlatform: [
    { name: "Revenue",    url: "/dashboard/revenue",            icon: CircleDollarSign },
    { name: "Audit logs", url: "/dashboard/admin/audit-logs",   icon: ScrollText },   // super-only
    { name: "Roles",      url: "/dashboard/roles",              icon: Settings2 },    // super-only
    { name: "Users",      url: "/dashboard/users",              icon: Users },        // super-only
    // 7.13 — the indicative-currency rates. Super-only: a converted figure is a
    // platform-wide number, and a vendor setting their own would let two venues
    // quote the same rupee price at different pounds. Without this entry the
    // routes exist and nothing can reach them, which is how the rule they feed
    // came to be dead in the first place.
    { name: "Currency rates", url: "/dashboard/admin/fx-rates", icon: CircleDollarSign }, // super-only
  ],

  // Highest-trust emergency tools — super-admin only.
  adminEmergency: [
    { name: "Force majeure", url: "/dashboard/admin/force-majeure", icon: ShieldAlert },
  ],
}

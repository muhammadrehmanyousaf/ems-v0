/**
 * Icon rail + contextual panel — the navigation model.
 *
 * Reverse-engineered from app.schedura.ai at the founder's direction. Full
 * measured spec: system-docs/04-navigation-ux/10-RAIL-AND-PANEL-SPEC.md
 *
 * The shape:
 *   RAIL (~64px, never changes)  |  PANEL (~250px, swaps per module)  |  CONTENT
 *
 * The rail carries one entry per MODULE. The panel carries that module's own
 * inside — which is what a flat rail can never express, and what the founder
 * was describing when he said a vendor "has to go back to other modules to
 * perform a job for the same user".
 *
 * ── One rule, and it is the important one ──────────────────────────────────
 *
 * Every `href` below points at a destination that ACTUALLY EXISTS and actually
 * renders that view. Schedura's panels use `?section=` params its screens read;
 * ours would be a lie if the screen ignored them. Our bookings list does not
 * read `?status=`, so there is no "Upcoming / Completed" filter row here yet —
 * adding one would produce links that look like they work and do nothing, which
 * is the single most common defect in this codebase.
 *
 * When a screen learns to read a param, add the row. Not before.
 */

import {
  LayoutDashboard,
  Sparkles,
  Inbox,
  ClipboardList,
  CalendarCheck,
  Utensils,
  TrendingUp,
  Settings2,
  CalendarDays,
  MessageSquareText,
  Wallet,
  SquareUser,
  Settings,
  FileText,
  CalendarClock,
  Handshake,
  Receipt,
  BarChart3,
  Workflow,
  ChefHat,
  ListChecks,
  Bell,
  Smile,
  Boxes,
  HandCoins,
  Truck,
  Fuel,
  ShieldCheck,
  Plane,
  Megaphone,
  CreditCard,
  Building2,
  CircleDollarSign,
  AlertCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type PanelItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Which live counter badges this row, if any.
   *
   * The reference shows counts on the right of a row and renders them ONLY
   * when non-zero — a rail full of grey zeros teaches people to stop reading it.
   * Only counters that genuinely exist are listed here; inventing a badge that
   * always reads 0 would be the same defect as a link that goes nowhere.
   */
  badge?: "chatUnread" | "notifications";
  /**
   * This row is what the screen shows when its param is ABSENT.
   *
   * /dashboard/money with no ?tab= renders Receivables (the hub defaults to it),
   * so without this the vendor sits on Receivables while the panel highlights
   * nothing at all — the rail says Khata, the page says Receivables, and the
   * panel says nowhere.
   */
  isDefaultView?: boolean;
  /** Roman-Urdu / Professional label override resolved by the persona layer. */
  i18nKey?: string;
};

export type PanelGroup = {
  /** Uppercase, muted, no icon. Omit for the leading ungrouped block. */
  label?: string;
  items: PanelItem[];
};

export type NavModule = {
  /** Stable id, and the first path segment after /dashboard that selects it. */
  id: string;
  /** Rail label — one word wherever possible. */
  label: string;
  icon: LucideIcon;
  /** Where the rail item navigates. */
  href: string;
  /** Extra path segments that should light this module up in the rail. */
  owns?: string[];
  /** Panel title. Defaults to `label`. */
  panelTitle?: string;
  /**
   * Render the rail ALONE for this module — no panel.
   *
   * The dashboard is the first thing a vendor sees, and it is a place to read,
   * not a place to navigate from. A second column of links beside it competes
   * with the numbers it exists to show, and every one of those links is already
   * a rail icon away. Home gets the full width.
   */
  railOnly?: boolean;
  groups: PanelGroup[];
};

/**
 * The eight modules.
 *
 * Sized against the market: Tripleseat runs ~8 top-level items across 20,000
 * venues, and Shopify's own guidance puts the scannable limit at 10-12.
 */
export const NAV_MODULES: NavModule[] = [
  {
    id: "home",
    label: "Home",
    icon: LayoutDashboard,
    href: "/dashboard",
    panelTitle: "Home",
    railOnly: true,
    groups: [
      {
        label: "Quick actions",
        items: [
          { label: "New booking", href: "/dashboard/bookings", icon: ClipboardList },
          { label: "New enquiry", href: "/dashboard/leads", icon: Inbox },
          { label: "Add expense", href: "/dashboard/expenses", icon: Wallet },
        ],
      },
      {
        label: "Jump to",
        items: [
          { label: "Today", href: "/dashboard/today", icon: Sparkles, i18nKey: "nav.today" },
          { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, i18nKey: "nav.calendar" },
          { label: "Notifications", href: "/dashboard/notifications", icon: Bell, i18nKey: "nav.notifications", badge: "notifications" },
          { label: "Reports", href: "/dashboard/reports", icon: BarChart3, i18nKey: "nav.reports" },
        ],
      },
    ],
  },

  {
    id: "leads",
    label: "Enquiries",
    icon: Inbox,
    href: "/dashboard/leads",
    owns: ["quotes", "holds"],
    panelTitle: "Enquiries",
    groups: [
      {
        items: [
          { label: "Lead inbox", href: "/dashboard/leads", icon: Inbox, i18nKey: "nav.leads" },
        ],
      },
      {
        label: "Before the booking",
        items: [
          { label: "Quote requests", href: "/dashboard/quotes", icon: Handshake, i18nKey: "nav.quotes" },
          { label: "Date holds", href: "/dashboard/holds", icon: CalendarClock, i18nKey: "nav.holds" },
        ],
      },
    ],
  },

  {
    id: "bookings",
    label: "Bookings",
    icon: ClipboardList,
    href: "/dashboard/bookings",
    owns: ["function-sheets", "trade-ops", "function-sheet-operations", "function-sheet-sign", "kitchen-prep"],
    panelTitle: "Bookings",
    groups: [
      {
        // These two are real: the list already sends `bucket` to the API, and
        // now seeds it from the URL, so each row lands on a genuinely
        // different set of bookings and survives a refresh. Compare with the
        // "Upcoming / Awaiting payment" rows I did NOT add — the API has no
        // such filter, so those links would look like they work and do nothing.
        items: [
          { label: "Active bookings", href: "/dashboard/bookings", icon: ClipboardList, i18nKey: "nav.bookings" },
          { label: "Completed", href: "/dashboard/bookings?bucket=completed", icon: ListChecks },
        ],
      },
      {
        label: "Paperwork",
        items: [
          { label: "Quotes & Invoices", href: "/dashboard/function-sheets", icon: FileText, i18nKey: "nav.function_sheets" },
          { label: "Sign contract", href: "/dashboard/function-sheet-sign", icon: FileText },
        ],
      },
      {
        label: "On the day",
        items: [
          { label: "Trade operations", href: "/dashboard/trade-ops", icon: Workflow, i18nKey: "nav.trade_ops" },
          { label: "Night-of operations", href: "/dashboard/function-sheet-operations", icon: ListChecks },
          { label: "Kitchen prep", href: "/dashboard/kitchen-prep", icon: ChefHat, i18nKey: "nav.kitchen_prep" },
        ],
      },
    ],
  },

  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    href: "/dashboard/calendar",
    owns: ["availability", "cancellation-policy"],
    panelTitle: "Calendar",
    groups: [
      {
        items: [
          { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, i18nKey: "nav.calendar" },
          { label: "Date holds", href: "/dashboard/holds", icon: CalendarClock, i18nKey: "nav.holds" },
        ],
      },
      {
        label: "Rules",
        items: [
          { label: "Availability", href: "/dashboard/availability", icon: CalendarClock, i18nKey: "nav.availability" },
          { label: "Cancellation policy", href: "/dashboard/cancellation-policy", icon: FileText, i18nKey: "nav.cancellation_policy" },
        ],
      },
    ],
  },

  {
    id: "chat",
    label: "Messages",
    icon: MessageSquareText,
    href: "/dashboard/chat",
    owns: ["notifications", "reviews"],
    panelTitle: "Messages",
    groups: [
      {
        items: [
          { label: "Conversations", href: "/dashboard/chat", icon: MessageSquareText, i18nKey: "nav.conversations", badge: "chatUnread" },
          { label: "Notifications", href: "/dashboard/notifications", icon: Bell, i18nKey: "nav.notifications", badge: "notifications" },
          { label: "Reviews", href: "/dashboard/reviews", icon: Smile, i18nKey: "nav.reviews" },
        ],
      },
    ],
  },

  {
    id: "money",
    label: "Khata",
    icon: Wallet,
    href: "/dashboard/money",
    owns: ["payments", "receipts", "receivables", "expenses", "pdcs", "tax", "reports"],
    panelTitle: "Khata",
    groups: [
      {
        // These four are real tabs the money hub reads. Verified against
        // money-hub-view.tsx rather than assumed.
        label: "Money in",
        items: [
          { label: "Payments", href: "/dashboard/money?tab=payments", icon: CircleDollarSign, i18nKey: "nav.payments" },
          { label: "Receipts", href: "/dashboard/money?tab=receipts", icon: Receipt, i18nKey: "nav.receipts" },
          { label: "Receivables", href: "/dashboard/money?tab=receivables", icon: AlertCircle, i18nKey: "nav.receivables", isDefaultView: true },
        ],
      },
      {
        label: "Money out",
        items: [
          { label: "Expenses", href: "/dashboard/money?tab=expenses", icon: Wallet, i18nKey: "nav.expenses" },
          { label: "Staff & payroll", href: "/dashboard/staff", icon: HandCoins, i18nKey: "nav.staff" },
          { label: "Suppliers", href: "/dashboard/suppliers", icon: Truck, i18nKey: "nav.suppliers" },
        ],
      },
      {
        label: "Records",
        items: [
          { label: "Cheque ledger", href: "/dashboard/pdcs", icon: Wallet, i18nKey: "nav.cheque_ledger" },
          { label: "Tax report", href: "/dashboard/tax", icon: Receipt, i18nKey: "nav.tax" },
          { label: "Reports", href: "/dashboard/reports", icon: BarChart3, i18nKey: "nav.reports" },
        ],
      },
    ],
  },

  {
    id: "customers",
    label: "Customers",
    icon: SquareUser,
    href: "/dashboard/customers",
    owns: ["brokers"],
    panelTitle: "Customers",
    groups: [
      {
        items: [
          { label: "All customers", href: "/dashboard/customers", icon: SquareUser, i18nKey: "nav.customers" },
          { label: "Brokers", href: "/dashboard/brokers", icon: Handshake, i18nKey: "nav.brokers" },
        ],
      },
    ],
  },

  {
    id: "setup",
    label: "Set up",
    icon: Settings,
    href: "/dashboard/settings",
    owns: [
      "settings", "onboarding", "promote", "billing", "collaborations",
      "inventory", "generator-fuel", "halal-certs", "drone-noc",
      "automation", "venue-os", "field",
    ],
    panelTitle: "Set up",
    groups: [
      {
        label: "My business",
        items: [
          // WWL-526 — one address for one destination. The hub writes no
          // `tab` param for Profile, so neither does this. `?tab=overview`
          // still resolves for anything already linking that way.
          { label: "Business Settings", href: "/dashboard/settings", icon: Settings, i18nKey: "nav.business_settings" },
          { label: "Setup checklist", href: "/dashboard/onboarding", icon: ListChecks, i18nKey: "nav.onboarding" },
          { label: "Automation", href: "/dashboard/automation", icon: Zap, i18nKey: "nav.automation" },
          { label: "Field capture", href: "/dashboard/field", icon: Zap, i18nKey: "nav.field_capture" },
        ],
      },
      {
        label: "Grow",
        items: [
          { label: "Promote", href: "/dashboard/promote", icon: Megaphone, i18nKey: "nav.promote" },
          { label: "Plan & billing", href: "/dashboard/billing", icon: CreditCard, i18nKey: "nav.billing" },
          { label: "Collaborations", href: "/dashboard/collaborations", icon: Handshake, i18nKey: "nav.collaborations" },
        ],
      },
      {
        // Venue-OS lives here rather than as its own rail section. It used to
        // name jobs the main rail already names — Tonight vs Today, Venue money
        // vs Money — and two names for one job is its own way of getting
        // someone lost. As a Set-up group it reads as venue configuration,
        // which is what most of it is.
        label: "Venue",
        items: [
          // Tonight and Kitchen had NO nav entry at all — two of the hub's
          // seven tabs were reachable only by landing on the hub and noticing
          // the tab strip. Tonight is the live event console: headcount against
          // safe capacity, valet, incidents. For a hall owner that is the most
          // used screen in the product, and nothing in the sidebar named it.
          // The hub renders Tonight when no ?tab is present, so Tonight is what
          // should be lit on a bare /dashboard/venue-os — otherwise the panel
          // highlights nothing while the page clearly shows a section.
          { label: "Tonight", href: "/dashboard/venue-os?tab=today", icon: CalendarCheck, isDefaultView: true },
          { label: "Halls & spaces", href: "/dashboard/venue-os?tab=spaces", icon: Building2 },
          { label: "Venue money", href: "/dashboard/venue-os?tab=money", icon: Wallet },
          { label: "Event profit", href: "/dashboard/venue-os?tab=profit", icon: CircleDollarSign },
          { label: "Cash & cheques", href: "/dashboard/venue-os?tab=cash", icon: CreditCard },
          { label: "Kitchen & suppliers", href: "/dashboard/venue-os?tab=kitchen", icon: Utensils },
        ],
      },
      {
        // The Advanced tab held 28 views behind a single "Accounting" link and
        // seven un-addressable accordions. Each group now has its own address
        // (`?tab=advanced&group=`), so the accountant tools are navigable
        // instead of discoverable-by-accident. Kept as a separate group so a
        // plain hall owner reads it as "not for me" and skips the whole block.
        label: "Venue accounting",
        items: [
          { label: "Costing & margins", href: "/dashboard/venue-os?tab=advanced&group=costing", icon: TrendingUp },
          { label: "Accounting & tax", href: "/dashboard/venue-os?tab=advanced&group=accounting", icon: Receipt },
          { label: "Group & partners", href: "/dashboard/venue-os?tab=advanced&group=group", icon: Building2 },
          { label: "Working capital", href: "/dashboard/venue-os?tab=advanced&group=working-capital", icon: CircleDollarSign },
          { label: "AML & KYC", href: "/dashboard/venue-os?tab=advanced&group=compliance", icon: ShieldCheck },
          { label: "Legal & insurance", href: "/dashboard/venue-os?tab=advanced&group=legal", icon: ClipboardList },
          { label: "Venue setup & tools", href: "/dashboard/venue-os?tab=advanced&group=setup", icon: Settings2 },
        ],
      },
      {
        label: "Stock & compliance",
        items: [
          { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, i18nKey: "nav.inventory" },
          { label: "Generator fuel", href: "/dashboard/generator-fuel", icon: Fuel, i18nKey: "nav.generator_fuel" },
          { label: "Halal certs", href: "/dashboard/halal-certs", icon: ShieldCheck, i18nKey: "nav.halal_certs" },
          { label: "Drone NOC", href: "/dashboard/drone-noc", icon: Plane, i18nKey: "nav.drone_noc" },
        ],
      },
    ],
  },
];

/** Which module owns this path? Falls back to Home. */
export function moduleForPath(pathname: string | null | undefined): NavModule {
  const path = (pathname || "/dashboard").split(/[?#]/)[0]!.replace(/\/+$/, "");
  const seg = path.split("/").filter(Boolean)[1] ?? "";
  if (!seg) return NAV_MODULES[0]!;
  return (
    NAV_MODULES.find((m) => m.id === seg) ??
    NAV_MODULES.find((m) => m.owns?.includes(seg)) ??
    NAV_MODULES[0]!
  );
}

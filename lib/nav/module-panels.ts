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
  CalendarClock,
  Handshake,
  Receipt,
  BarChart3,
  // Referenced only from commented-out panel rows below (Bookings' Paperwork
  // and On-the-day groups, Calendar's Rules group). Kept so restoring a row is
  // a one-line change rather than an import hunt.
  Workflow,
  ChefHat,
  FileText,
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
    // `holds` deliberately NOT here — it belongs to Calendar. See the note on
    // that module. A path can only be owned once, and whichever module is
    // declared first in this array wins, so listing it in both silently made
    // Enquiries the owner.
    owns: ["quotes"],
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
          // "Date holds" lived here too. Removed at the founder's direction
          // (2026-08-28): "hold date should be in the calender module only and
          // should open there not travel to the inquiry module". A date hold IS
          // a calendar act, and offering the same destination from two modules
          // is what made it look like it teleported.
        ],
      },
    ],
  },

  {
    id: "bookings",
    label: "Bookings",
    icon: ClipboardList,
    href: "/dashboard/bookings",
    // Kept, even though the panel is off: these paths still RESOLVE to this
    // module, so a vendor who reaches /dashboard/function-sheets from a booking
    // row still sees Bookings lit in the rail rather than falling back to Home.
    owns: ["function-sheets", "trade-ops", "function-sheet-operations", "function-sheet-sign", "kitchen-prep"],
    panelTitle: "Bookings",
    /**
     * Bookings is rail-only — no second column. (Founder, 2026-08-28: "i dont
     * need the secondry sidebar in the bookings module".)
     *
     * The bookings list is the widest screen in the product: eight columns plus
     * a four-card KPI strip. A 250px panel of links beside it was taking width
     * from the table it sat next to, to offer six destinations the vendor had
     * not asked for. Same reasoning as Home above.
     *
     * The routes below still exist and still render; they are simply not
     * advertised here. Deleting the pages was NOT asked for and would break the
     * links that booking rows and function-sheet emails already carry.
     */
    railOnly: true,
    groups: [
      {
        // `groups` is required by the type and read by nothing while
        // `railOnly` is set. Active bookings stays as the module's own
        // destination so restoring the panel is a one-line change.
        items: [
          { label: "Active bookings", href: "/dashboard/bookings", icon: ClipboardList, i18nKey: "nav.bookings" },
          // Commented out at the founder's direction (2026-08-28) — not needed
          // for now. Restore by deleting these comment markers.
          // { label: "Completed", href: "/dashboard/bookings?bucket=completed", icon: ListChecks },
        ],
      },
      // {
      //   label: "Paperwork",
      //   items: [
      //     { label: "Quotes & Invoices", href: "/dashboard/function-sheets", icon: FileText, i18nKey: "nav.function_sheets" },
      //     { label: "Sign contract", href: "/dashboard/function-sheet-sign", icon: FileText },
      //   ],
      // },
      // {
      //   label: "On the day",
      //   items: [
      //     { label: "Trade operations", href: "/dashboard/trade-ops", icon: Workflow, i18nKey: "nav.trade_ops" },
      //     { label: "Night-of operations", href: "/dashboard/function-sheet-operations", icon: ListChecks },
      //     { label: "Kitchen prep", href: "/dashboard/kitchen-prep", icon: ChefHat, i18nKey: "nav.kitchen_prep" },
      //   ],
      // },
    ],
  },

  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    href: "/dashboard/calendar",
    /**
     * `holds` is owned HERE, and only here.
     *
     * Date holds was reachable from both the Enquiries panel and this one, but
     * `moduleForPath` matches `owns` in array order and Enquiries is declared
     * first — so clicking "Date holds" in the CALENDAR panel navigated to
     * /dashboard/holds and the whole left column swapped to Enquiries. The
     * vendor clicked a row in one module and was dropped into another, with the
     * rail lit on a module they had not chosen. Measured on production:
     * /dashboard/holds, rail lit "Enquiries", panel titled "Enquiries".
     */
    owns: ["availability", "cancellation-policy", "holds"],
    panelTitle: "Calendar",
    groups: [
      {
        items: [
          { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, i18nKey: "nav.calendar" },
          { label: "Date holds", href: "/dashboard/holds", icon: CalendarClock, i18nKey: "nav.holds" },
        ],
      },
      // The "Rules" group — Availability and Cancellation policy — commented
      // out at the founder's direction (2026-08-28). Restore by deleting these
      // markers.
      //
      // Availability was the weakest row in the panel regardless: the page it
      // opened is a signpost, not a screen. Its entire body reads "Venue
      // availability is managed from the Calendar — block or free dates there"
      // with a button back to the Calendar the vendor had just left.
      //
      // {
      //   label: "Rules",
      //   items: [
      //     { label: "Availability", href: "/dashboard/availability", icon: CalendarClock, i18nKey: "nav.availability" },
      //     { label: "Cancellation policy", href: "/dashboard/cancellation-policy", icon: FileText, i18nKey: "nav.cancellation_policy" },
      //   ],
      // },
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
          /**
           * Through the hub, like the other four money views.
           *
           * This pointed at `/dashboard/pdcs` while Payments, Receipts,
           * Receivables and Expenses all went to `/dashboard/money?tab=…`. It
           * did not matter while the money screen carried its own tab row —
           * `?tab=cheques` was reachable from there. With that duplicate tab
           * row removed, Cheques would have been the one money view the panel
           * could not reach OR highlight: a vendor on `?tab=cheques` would see
           * nothing lit in the panel, and clicking Cheque ledger would jump
           * them out of the hub to a different URL rendering the same screen.
           *
           * `/dashboard/pdcs` still exists and still works — both routes mount
           * the identical `PdcsRedesignedView`, verified — so every existing
           * bookmark and deep link is unaffected. This only makes the panel
           * consistent with itself.
           */
          { label: "Cheque ledger", href: "/dashboard/money?tab=cheques", icon: Wallet, i18nKey: "nav.cheque_ledger" },
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

  /**
   * Plan & billing — promoted out of Set up to a rail module of its own
   * (founder, 2026-08-29).
   *
   * `railOnly` because it is a single page: a 250px column holding one link
   * next to the page that link opens is worse than no column at all. Same
   * treatment as Home and Bookings.
   *
   * `id` MUST stay "billing" — `moduleForPath` matches the first path segment
   * against `id` before it consults any `owns` list, and that is what makes
   * /dashboard/billing light this icon instead of Set up.
   */
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    href: "/dashboard/billing",
    panelTitle: "Billing",
    railOnly: true,
    groups: [
      {
        items: [
          { label: "Plan & billing", href: "/dashboard/billing", icon: CreditCard, i18nKey: "nav.billing" },
        ],
      },
    ],
  },

  {
    id: "setup",
    label: "Set up",
    icon: Settings,
    href: "/dashboard/settings",
    // `billing` deliberately NOT here any more — it is its own rail module now
    // (see below). Leaving it would make Set up win the `owns` match and light
    // the wrong rail icon on /dashboard/billing.
    //
    // The rest are kept even where the panel row is commented out, so a vendor
    // arriving on one of those pages from an old link still sees Set up lit
    // rather than falling back to Home.
    owns: [
      "settings", "onboarding", "promote", "collaborations",
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
          // MOVED to the Home dashboard, not hidden (founder, 2026-08-29).
          // It is not a setting — it is what a vendor does standing at a bridal
          // expo with dead signal, so it now renders as a section of the screen
          // they open. /dashboard/field still exists and Set up still `owns`
          // "field", so the old link keeps working with the right rail lit.
          // { label: "Field capture", href: "/dashboard/field", icon: Zap, i18nKey: "nav.field_capture" },
        ],
      },
      {
        label: "Grow",
        items: [
          { label: "Promote", href: "/dashboard/promote", icon: Megaphone, i18nKey: "nav.promote" },
          // MOVED, not hidden — "Plan & billing" is now a rail module of its
          // own (2026-08-29). It is the one row in this panel that is about the
          // vendor's account with Wedding Wala rather than about their venue,
          // so it never belonged under a venue setup heading.
          // { label: "Plan & billing", href: "/dashboard/billing", icon: CreditCard, i18nKey: "nav.billing" },
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
          // Tonight, Venue money, Cash & cheques and Kitchen & suppliers hidden
          // at the founder's direction (2026-08-29). These are SWITCHED OFF,
          // not merely unlisted: the matching tabs are commented out of
          // PRIMARY_TABS in venue-os-hub-view.tsx, so the hub no longer renders
          // them either. Restoring a row here without restoring its tab there
          // produces a link to a tab that does not exist.
          //
          // { label: "Tonight", href: "/dashboard/venue-os?tab=today", icon: CalendarCheck, isDefaultView: true },
          //
          // `isDefaultView` moved to Event profit with Tonight: the hub falls
          // back to the FIRST surviving tab when no ?tab is present, and that
          // is now profit. Leaving the marker on a hidden row would light
          // nothing on a bare /dashboard/venue-os.
          { label: "Halls & spaces", href: "/dashboard/venue-os?tab=spaces", icon: Building2 },
          // { label: "Venue money", href: "/dashboard/venue-os?tab=money", icon: Wallet },
          { label: "Event profit", href: "/dashboard/venue-os?tab=profit", icon: CircleDollarSign, isDefaultView: true },
          // { label: "Cash & cheques", href: "/dashboard/venue-os?tab=cash", icon: CreditCard },
          // { label: "Kitchen & suppliers", href: "/dashboard/venue-os?tab=kitchen", icon: Utensils },
        ],
      },
      // ── "Venue accounting" — hidden in full (founder, 2026-08-29) ──────────
      //
      // Switched off at the source too: the `advanced` tab these all point into
      // is commented out of PRIMARY_TABS, so every ?tab=advanced&group=... link
      // below is inert until both come back together.
      //
      // Why it existed: the Advanced tab held 28 views behind a single
      // "Accounting" link and seven un-addressable accordions. Each group was
      // given its own address (`?tab=advanced&group=`) so the accountant tools
      // were navigable instead of discoverable-by-accident, and kept as a
      // separate group so a plain hall owner read it as "not for me".
      //
      // {
      //   label: "Venue accounting",
      //   items: [
      //     { label: "Costing & margins", href: "/dashboard/venue-os?tab=advanced&group=costing", icon: TrendingUp },
      //     { label: "Accounting & tax", href: "/dashboard/venue-os?tab=advanced&group=accounting", icon: Receipt },
      //     { label: "Group & partners", href: "/dashboard/venue-os?tab=advanced&group=group", icon: Building2 },
      //     { label: "Working capital", href: "/dashboard/venue-os?tab=advanced&group=working-capital", icon: CircleDollarSign },
      //     { label: "AML & KYC", href: "/dashboard/venue-os?tab=advanced&group=compliance", icon: ShieldCheck },
      //     { label: "Legal & insurance", href: "/dashboard/venue-os?tab=advanced&group=legal", icon: ClipboardList },
      //     { label: "Venue setup & tools", href: "/dashboard/venue-os?tab=advanced&group=setup", icon: Settings2 },
      //   ],
      // },
      //
      // ── "Stock & compliance" — hidden in full (founder, 2026-08-29) ───────
      //
      // These four ARE standalone pages, unlike the venue-os rows above, so
      // hiding the group is all it takes — /dashboard/inventory and friends
      // still exist and still render if reached directly, and Set up still
      // `owns` them so the rail stays lit.
      //
      // {
      //   label: "Stock & compliance",
      //   items: [
      //     { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, i18nKey: "nav.inventory" },
      //     { label: "Generator fuel", href: "/dashboard/generator-fuel", icon: Fuel, i18nKey: "nav.generator_fuel" },
      //     { label: "Halal certs", href: "/dashboard/halal-certs", icon: ShieldCheck, i18nKey: "nav.halal_certs" },
      //     { label: "Drone NOC", href: "/dashboard/drone-noc", icon: Plane, i18nKey: "nav.drone_noc" },
      //   ],
      // },
    ],
  },
];

/**
 * Does this route render a contextual panel at all?
 *
 * The single source of truth for that question, because TWO components need
 * the answer and they must not drift: AppSidebar decides whether to render the
 * panel, and PanelToggle decides whether to render the button that collapses
 * it. When only the first knew, the header kept a toggle on rail-only screens
 * that opened nothing — a control that does nothing when clicked, which reads
 * as a broken build rather than a design.
 *
 * Admins are always true: they get the flat section list rather than the
 * module panel, and `railOnly` is a vendor-shell concept that does not apply.
 */
export function hasPanel(
  pathname: string | null | undefined,
  adminLike: boolean,
): boolean {
  if (adminLike) return true;
  return moduleForPath(pathname).railOnly !== true;
}

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

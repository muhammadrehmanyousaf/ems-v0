/**
 * Vendor Portal Phase 3 #9.4 — Urdu i18n dictionary.
 *
 * Scaffolding only — covers the high-frequency vendor-facing
 * strings (page titles, button verbs, KPI labels). Full translation
 * pass is a follow-up workstream; this commit ships:
 *
 *   - Two-language dictionary (en / ur)
 *   - useT() hook that reads from localStorage so the choice
 *     persists across reloads
 *   - <LanguageToggle /> component for the dashboard header
 *   - Noto Nastaliq Urdu font loaded via globals.css when ur is
 *     active so Urdu renders in proper Nastaliq script (not the
 *     ugly default browser fallback)
 *
 * For now the dictionary is hand-curated. As more strings are
 * translated, drop them into either map — keys must match across
 * languages, values are free-text. Untranslated keys fall back
 * to English.
 */

export type Locale = "en" | "ur";

type Dictionary = Record<string, string>;

const EN: Dictionary = {
  // Navigation
  "nav.dashboard": "Dashboard",
  "nav.bookings": "Bookings",
  "nav.calendar": "Calendar",
  "nav.customers": "Customers",
  "nav.leads": "Leads",
  "nav.function_sheets": "Function Sheets",
  "nav.expenses": "Expenses",
  "nav.receipts": "Receipts",
  "nav.staff": "Staff",
  "nav.suppliers": "Suppliers",
  "nav.brokers": "Brokers",
  "nav.inventory": "Inventory",
  "nav.reviews": "Reviews",
  "nav.tax": "Tax report",
  "nav.reliability": "Reliability",
  "nav.automation": "Automation",
  "nav.insights": "Insights",
  "nav.today": "Today",
  "nav.settings": "Settings",
  "nav.businesses_overview": "Businesses overview",
  "nav.conversations": "Conversations",
  "nav.payments": "Payments",
  "nav.receivables": "Receivables",
  "nav.cheque_ledger": "Cheque ledger",
  "nav.generator_fuel": "Generator fuel",
  "nav.halal_certs": "Halal certs",
  "nav.drone_noc": "Drone NOC",
  "nav.notifications": "Notifications",
  "nav.business_settings": "Business Settings",
  "nav.onboarding": "Onboarding",

  // Common verbs
  "verb.save": "Save",
  "verb.cancel": "Cancel",
  "verb.delete": "Delete",
  "verb.edit": "Edit",
  "verb.create": "Create",
  "verb.close": "Close",
  "verb.continue": "Continue",
  "verb.back": "Back",
  "verb.confirm": "Confirm",
  "verb.send": "Send",
  "verb.export": "Export",
  "verb.download": "Download",
  "verb.refresh": "Refresh",
  "verb.block": "Block",
  "verb.unblock": "Unblock",
  "verb.view": "View",
  "verb.add": "Add",
  "verb.remove": "Remove",
  "verb.search": "Search",
  "verb.filter": "Filter",

  // KPI labels
  "kpi.revenue": "Revenue",
  "kpi.bookings": "Bookings",
  "kpi.customers": "Customers",
  "kpi.average_ticket": "Average ticket",
  "kpi.outstanding": "Outstanding",
  "kpi.upcoming": "Upcoming",
  "kpi.completed": "Completed",
  "kpi.confirmed": "Confirmed",
  "kpi.cancelled": "Cancelled",

  // Status labels
  "status.pending": "Pending",
  "status.confirmed": "Confirmed",
  "status.completed": "Completed",
  "status.cancelled": "Cancelled",
  "status.awaiting_payment": "Awaiting Payment",

  // Booking events
  "event.mehndi": "Mehndi",
  "event.nikah": "Nikah",
  "event.baraat": "Baraat",
  "event.walima": "Walima",
  "event.engagement": "Engagement",
  "event.dholki": "Dholki",

  // Lead sources
  "source.in_app_chat": "In-app chat",
  "source.whatsapp": "WhatsApp",
  "source.form_inquiry": "Website form",
  "source.manual_phone": "Phone call",
  "source.manual_walkin": "Walk-in",
  "source.other": "Other",

  // Misc
  "common.yes": "Yes",
  "common.no": "No",
  "common.loading": "Loading…",
  "common.error": "Something went wrong",
  "common.success": "Done",
};

const UR: Dictionary = {
  // Navigation
  "nav.dashboard": "ڈیش بورڈ",
  "nav.bookings": "بکنگز",
  "nav.calendar": "کیلنڈر",
  "nav.customers": "گاہک",
  "nav.leads": "نئے رابطے",
  "nav.function_sheets": "فنکشن شیٹس",
  "nav.expenses": "اخراجات",
  "nav.receipts": "رسیدیں",
  "nav.staff": "عملہ",
  "nav.suppliers": "سپلائرز",
  "nav.brokers": "ایجنٹس",
  "nav.inventory": "انوینٹری",
  "nav.reviews": "تبصرے",
  "nav.tax": "ٹیکس رپورٹ",
  "nav.reliability": "اعتماد سکور",
  "nav.automation": "آٹومیشن",
  "nav.insights": "بصیرت",
  "nav.today": "آج",
  "nav.settings": "ترتیبات",
  "nav.businesses_overview": "کاروبار کا جائزہ",
  "nav.conversations": "گفتگو",
  "nav.payments": "ادائیگیاں",
  "nav.receivables": "وصولیاں",
  "nav.cheque_ledger": "چیک لیجر",
  "nav.generator_fuel": "جنریٹر فیول",
  "nav.halal_certs": "حلال سرٹیفکیٹ",
  "nav.drone_noc": "ڈرون این او سی",
  "nav.notifications": "اطلاعات",
  "nav.business_settings": "کاروبار کی ترتیبات",
  "nav.onboarding": "آن بورڈنگ",

  // Common verbs
  "verb.save": "محفوظ کریں",
  "verb.cancel": "منسوخ کریں",
  "verb.delete": "حذف کریں",
  "verb.edit": "ترمیم",
  "verb.create": "بنائیں",
  "verb.close": "بند کریں",
  "verb.continue": "جاری رکھیں",
  "verb.back": "واپس",
  "verb.confirm": "تصدیق کریں",
  "verb.send": "بھیجیں",
  "verb.export": "برآمد کریں",
  "verb.download": "ڈاؤن لوڈ",
  "verb.refresh": "تازہ کریں",
  "verb.block": "بلاک",
  "verb.unblock": "بلاک ختم کریں",
  "verb.view": "دیکھیں",
  "verb.add": "شامل کریں",
  "verb.remove": "ہٹائیں",
  "verb.search": "تلاش",
  "verb.filter": "فلٹر",

  // KPI labels
  "kpi.revenue": "آمدنی",
  "kpi.bookings": "بکنگز",
  "kpi.customers": "گاہک",
  "kpi.average_ticket": "اوسط ٹکٹ",
  "kpi.outstanding": "بقایا",
  "kpi.upcoming": "آنے والی",
  "kpi.completed": "مکمل",
  "kpi.confirmed": "تصدیق شدہ",
  "kpi.cancelled": "منسوخ",

  // Status labels
  "status.pending": "زیرِ التواء",
  "status.confirmed": "تصدیق شدہ",
  "status.completed": "مکمل",
  "status.cancelled": "منسوخ",
  "status.awaiting_payment": "ادائیگی کا منتظر",

  // Booking events
  "event.mehndi": "مہندی",
  "event.nikah": "نکاح",
  "event.baraat": "بارات",
  "event.walima": "ولیمہ",
  "event.engagement": "منگنی",
  "event.dholki": "ڈھولکی",

  // Lead sources
  "source.in_app_chat": "ایپ میں چیٹ",
  "source.whatsapp": "واٹس ایپ",
  "source.form_inquiry": "ویب سائٹ فارم",
  "source.manual_phone": "فون کال",
  "source.manual_walkin": "آمد بسیط",
  "source.other": "دیگر",

  // Misc
  "common.yes": "ہاں",
  "common.no": "نہیں",
  "common.loading": "لوڈ ہو رہا ہے…",
  "common.error": "کچھ غلط ہو گیا",
  "common.success": "ہو گیا",
};

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: EN,
  ur: UR,
};

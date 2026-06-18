import { VENDOR_TYPES } from "./vendor-types";
import {
  Building2,
  Camera,
  Palette,
  Brush,
  UtensilsCrossed,
  Car,
  Shirt,
  Mail,
  Sparkles,
  // BK-100.55 — 14 new Pakistani-specific categories
  ScrollText,
  PersonStanding,
  Drum,
  Mic,
  Video,
  Zap,
  Tent,
  Sofa,
  Flower2,
  Cake,
  Candy,
  ChefHat,
  Speaker,
  Music2,
  type LucideIcon,
} from "lucide-react";

// ─── Nav item keys (must match `name` in nav-data.ts) ──────
export type NavItemKey =
  | "Dashboard"
  | "Today"
  | "Lead inbox"
  | "Bookings"
  | "Function sheets"
  | "Customers"
  | "Calendar"
  | "Conversations"
  | "Reviews"
  | "Notifications"
  // Khata (money) group
  | "Payments"
  | "Receivables"
  | "Receipts"
  | "Cheque ledger"
  | "Expenses"
  // Operations group — type-conditional (only shown to vendor types
  // that actually need them, per §19.4).
  | "Inventory"
  | "Staff & payroll"
  | "Suppliers"
  | "Brokers"
  | "Generator fuel"
  | "Halal certs"
  | "Drone NOC"
  // Growth
  | "Promote"
  | "Plan & billing"
  | "Collaborations"
  // Admin / shared
  | "Users"
  | "Vendors"
  | "Businesses"
  | "Roles"
  | "Business Settings";

// ─── Settings tab keys ──────────────────────────────────────
export type SettingsTabKey =
  | "overview"
  | "basic"
  | "images"
  | "fleet"
  | "packages"
  | "menus"
  | "type-specific";

// ─── Type-specific field definition ─────────────────────────
export interface OptionGroup {
  group: string;
  emoji: string;
  description: string;
  items: string[];
}

export interface TypeSpecificFieldDef {
  key: string;
  label: string;
  type: "number" | "boolean" | "text" | "select" | "multi-select";
  placeholder?: string;
  options?: string[];
  description?: string;
  groups?: OptionGroup[]; // grouped options for large multi-selects
}

// ─── Vendor type config ─────────────────────────────────────
export interface VendorTypeConfig {
  key: string;
  icon: LucideIcon;
  displayName: string;
  mainNavItems: NavItemKey[];
  controlNavItems: NavItemKey[];
  settingsTabs: SettingsTabKey[];
  typeSpecificFields: TypeSpecificFieldDef[];
  pricingLabel: string;
  hasPackages: boolean;
  hasMenus: boolean;
  // §19.3 craft-localized sidebar labels — a vendor reads the modules
  // in the language of their own work ("Shoots" not "Bookings",
  // "Brides" not "Customers"). LABEL ONLY — the route + nav key are
  // unchanged, so filtering + active-state still work. The craft name
  // wins over the EN/اردو i18n label (craft-naming is separate from
  // language toggle, per §19.1). Only keys present here are overridden;
  // everything else falls back to the default label.
  navLabels?: Partial<Record<NavItemKey, string>>;
  // §19.4 type-conditional "Operations" tools — shown to THIS vendor
  // type only (e.g. Drone NOC for photographers, Halal certs for
  // caterers). Rendered as a separate "Operations" sidebar group.
  // Routes all exist; gating just keeps a solo vendor's sidebar clean.
  extraNavItems?: NavItemKey[];
}

// All vendors share these nav items. Operational core + Khata (money).
// The sidebar partitions these into a "Main" group and a "Khata" group
// via MONEY_NAV_KEYS (see app-sidebar.tsx); order here is preserved
// within each rendered group.
//
// Previously only 8 items showed and ~13 built pages were orphaned
// (reachable by URL only). This surfaces the universally-useful ones —
// the daily view, lead inbox, function sheets, and the full khata
// (receivables / receipts / cheque ledger / expenses). Niche +
// type-specific tools (inventory, staff, suppliers, brokers, generator
// fuel, halal certs, drone NOC) remain a type-conditional follow-up so
// a solo vendor's sidebar isn't cluttered.
const COMMON_MAIN_NAV: NavItemKey[] = [
  // Main
  "Dashboard",
  "Today",
  "Lead inbox",
  "Bookings",
  "Function sheets",
  "Customers",
  "Calendar",
  "Conversations",
  "Reviews",
  "Notifications",
  // Khata (money) — rendered as its own group
  "Payments",
  "Receivables",
  "Receipts",
  "Cheque ledger",
  "Expenses",
];

// Keys that render under the "Khata" (money) section rather than "Main".
export const MONEY_NAV_KEYS: ReadonlySet<NavItemKey> = new Set<NavItemKey>([
  "Payments",
  "Receivables",
  "Receipts",
  "Cheque ledger",
  "Expenses",
]);

// Regular vendors only see Business Settings in controls
const VENDOR_CONTROLS: NavItemKey[] = ["Business Settings"];

// ─── Per-type configs ───────────────────────────────────────
export const VENDOR_TYPE_CONFIGS: Record<string, VendorTypeConfig> = {
  [VENDOR_TYPES.WEDDING_VENUE]: {
    key: VENDOR_TYPES.WEDDING_VENUE,
    icon: Building2,
    displayName: "Wedding Venue",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: {
      Bookings: "Events / Functions", Customers: "Clients", Calendar: "Event Calendar",
      "Staff & payroll": "Staff & Crew",
    },
    extraNavItems: ["Staff & payroll", "Suppliers", "Brokers", "Generator fuel"],
    typeSpecificFields: [
      { key: "subBusinessType", label: "Venue Type", type: "select", options: ["Marquee", "Hall", "Outdoor", "Others"] },
      { key: "expertise", label: "Expertise", type: "multi-select", options: ["Engagement", "Wedding", "Parties", "Fashion Show", "Dinner"] },
      { key: "maxCapacity", label: "Maximum Capacity", type: "number", placeholder: "500" },
      { key: "minCapacity", label: "Minimum Capacity", type: "number", placeholder: "50" },
      { key: "catering", label: "In-house Catering", type: "boolean", description: "Does the venue provide catering?" },
      { key: "parking", label: "Parking Available", type: "boolean" },
      { key: "carParkingCapacity", label: "Car Parking Capacity", type: "number", placeholder: "100" },
      { key: "amenities", label: "Amenities", type: "multi-select", options: ["AC", "Stage", "Sound System", "LED Wall", "Bridal Room", "Generator", "Valet Parking", "Wheelchair", "Wifi"] },
      { key: "staff", label: "Staff", type: "multi-select", options: ["Male", "Female", "Transgender"] },
      { key: "covidComplaint", label: "Covid Compliant", type: "boolean", description: "Is the venue Covid compliant?" },
    ],
  },

  [VENDOR_TYPES.CATERING]: {
    key: VENDOR_TYPES.CATERING,
    icon: UtensilsCrossed,
    displayName: "Catering",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "menus", "type-specific"],
    hasPackages: true,
    hasMenus: true,
    pricingLabel: "per head",
    navLabels: {
      Bookings: "Orders", Customers: "Clients", Calendar: "Event Calendar",
      Inventory: "Kitchen & Stock", "Staff & payroll": "Kitchen & Waiters",
    },
    extraNavItems: ["Inventory", "Staff & payroll", "Suppliers", "Generator fuel", "Halal certs"],
    typeSpecificFields: [
      { key: "maxCapacity", label: "Maximum Guests", type: "number", placeholder: "2000" },
      { key: "minCapacity", label: "Minimum Guests", type: "number", placeholder: "50" },
      { key: "provideFoodTesting", label: "Food Tasting", type: "boolean", description: "Do you offer food testing before booking?" },
      { key: "provideWaiter", label: "Waiter Service", type: "boolean" },
      { key: "providePlate", label: "Crockery / Plates", type: "boolean" },
      { key: "provideSeatingArrangement", label: "Seating Arrangement", type: "boolean" },
      { key: "provideSoundSystem", label: "Sound System", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.PHOTOGRAPHER]: {
    key: VENDOR_TYPES.PHOTOGRAPHER,
    icon: Camera,
    displayName: "Photographer",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: {
      Bookings: "Shoots", Customers: "Clients", Calendar: "Shoot Calendar",
      Inventory: "Gear / Equipment", "Staff & payroll": "Team & Shooters",
    },
    extraNavItems: ["Staff & payroll", "Inventory", "Drone NOC"],
    typeSpecificFields: [
      { key: "subBusinessType", label: "Photography Type", type: "multi-select", options: ["Portrait", "Event", "Wedding", "Commercial", "Fashion"] },
      { key: "expertise", label: "Expertise", type: "multi-select", options: ["Engagement", "Wedding", "Parties", "Fashion Show", "Corporate Events", "Birthday", "Anniversary"] },
      { key: "amenities", label: "Services", type: "multi-select", options: ["Drone Photography", "Video Recording", "Photo Editing", "Album Design", "Online Gallery", "Print Services"] },
      { key: "staff", label: "Staff", type: "multi-select", options: ["Male", "Female", "Transgender"] },
      { key: "travelToClientHome", label: "Travel to Client", type: "boolean", description: "Willing to travel to client location?" },
      { key: "cityCovered", label: "Cities Covered", type: "multi-select", options: ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"] },
    ],
  },

  [VENDOR_TYPES.DECORATOR]: {
    key: VENDOR_TYPES.DECORATOR,
    icon: Palette,
    displayName: "Decorator",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: {
      Bookings: "Setups", Customers: "Clients", Calendar: "Setup Calendar",
      Inventory: "Decor Inventory", "Staff & payroll": "Setup Crew",
    },
    extraNavItems: ["Inventory", "Staff & payroll", "Suppliers"],
    typeSpecificFields: [
      { key: "subBusinessType", label: "Decoration Type", type: "multi-select", options: ["Wedding", "Event", "Theme", "Outdoor", "Indoor"] },
      { key: "expertise", label: "Expertise", type: "multi-select", options: ["Wedding Decoration", "Engagement Decoration", "Birthday Decoration", "Corporate Events", "Outdoor Events", "Indoor Events", "Theme Decoration"] },
      { key: "amenities", label: "Services", type: "multi-select", options: ["Flower Decoration", "Lighting Setup", "Backdrop Design", "Table Decoration", "Stage Decoration", "Balloon Decoration", "Fabric Decoration", "Props & Accessories"] },
      { key: "staff", label: "Staff", type: "multi-select", options: ["Male", "Female", "Transgender"] },
      { key: "provideDecorationItem", label: "Provide Decoration Items", type: "boolean", description: "Do you provide all decoration items?" },
      { key: "travelToClientHome", label: "Travel to Venue", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.HENNA_ARTIST]: {
    key: VENDOR_TYPES.HENNA_ARTIST,
    icon: Brush,
    displayName: "Henna Artist",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per session",
    navLabels: {
      Bookings: "Appointments", Customers: "Brides", Calendar: "Appointment Calendar",
      Inventory: "Henna Stock", "Staff & payroll": "Artists",
    },
    extraNavItems: ["Inventory", "Staff & payroll"],
    typeSpecificFields: [
      { key: "subBusinessType", label: "Henna Style", type: "multi-select", options: ["Traditional", "Modern", "Arabic", "Indo-Arabic", "Fusion"] },
      { key: "expertise", label: "Expertise", type: "multi-select", options: ["Bridal Henna", "Party Henna", "Engagement Henna", "Traditional Designs", "Modern Designs", "Arabic Designs", "Indo-Arabic Designs"] },
      { key: "amenities", label: "Services & Amenities", type: "multi-select", options: ["Natural Henna", "Design Consultation", "Travel Service", "Henna Cones", "Aftercare Kit", "Touch-ups", "Custom Designs"] },
      { key: "staff", label: "Staff", type: "multi-select", options: ["Male", "Female", "Transgender"] },
      { key: "travelToClientHome", label: "Travel to Client", type: "boolean" },
      { key: "sellMehndi", label: "Sell Mehndi Products", type: "boolean", description: "Do you sell mehndi/henna cones?" },
      { key: "hasTeam", label: "Has a Team", type: "boolean", description: "Do you have a team of artists?" },
    ],
  },

  [VENDOR_TYPES.MAKEUP_ARTIST]: {
    key: VENDOR_TYPES.MAKEUP_ARTIST,
    icon: Sparkles,
    displayName: "Makeup Artist",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per session",
    navLabels: {
      Bookings: "Appointments", Customers: "Brides", Calendar: "Appointment Calendar",
      Inventory: "Kit & Products", "Staff & payroll": "Team",
    },
    extraNavItems: ["Inventory", "Staff & payroll"],
    typeSpecificFields: [
      { key: "subBusinessType", label: "Makeup Type", type: "multi-select", options: ["Bridal", "Party", "Fashion", "Commercial", "Hair"] },
      { key: "expertise", label: "Expertise", type: "multi-select", options: ["Bridal Makeup", "Groom Makeup", "Party Makeup", "Engagement Makeup", "Fashion Show", "Photoshoot", "Hair Styling"] },
      { key: "amenities", label: "Services", type: "multi-select", options: ["Hair Styling", "Nail Art", "Hair Extensions", "Makeup Trial", "Touch-ups", "Travel Service", "Premium Products"] },
      { key: "staff", label: "Staff", type: "multi-select", options: ["Male", "Female", "Transgender"] },
      { key: "travelToClientHome", label: "Travel to Client", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.CAR_RENTAL]: {
    key: VENDOR_TYPES.CAR_RENTAL,
    icon: Car,
    displayName: "Car Rental",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "fleet", "packages"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: {
      Bookings: "Trips", Customers: "Clients", Calendar: "Fleet Calendar",
      "Staff & payroll": "Drivers",
    },
    extraNavItems: ["Staff & payroll"],
    typeSpecificFields: [],
  },

  [VENDOR_TYPES.BRIDAL_WEAR]: {
    key: VENDOR_TYPES.BRIDAL_WEAR,
    icon: Shirt,
    displayName: "Bridal Wear",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per outfit",
    navLabels: {
      Bookings: "Orders", Customers: "Buyers", Calendar: "Fitting Calendar",
      Inventory: "Stock",
    },
    extraNavItems: ["Inventory", "Staff & payroll", "Suppliers"],
    typeSpecificFields: [
      { key: "subBusinessType", label: "Store Type", type: "select", options: ["Boutique", "Designer Studio", "Rental Store", "Multi-brand Outlet", "Online Boutique"] },
      { key: "expertise", label: "Occasions Catered", type: "multi-select", options: ["Bridal (Barat)", "Walima", "Engagement", "Mehndi / Mayun", "Nikah", "Post-wedding", "Bridesmaid"] },
      { key: "amenities", label: "Outfit Categories", type: "multi-select", options: ["Bridal Lehenga", "Sharara", "Gharara", "Farshi Gharara", "Maxi", "Anarkali", "Saree", "Western Bridal", "Groom Sherwani", "Nikah Dress"] },
      { key: "serviceProvided", label: "Fabrics Available", type: "multi-select", options: ["Silk", "Organza", "Net", "Velvet", "Chiffon", "Cotton", "Khaddar", "Banarsi", "Jamawar", "Tissue", "Karandi"] },
      { key: "minimumPrice", label: "Starting Price (PKR)", type: "number", placeholder: "25000" },
      { key: "instruction", label: "Order Lead Time", type: "select", options: ["1 Week", "2 Weeks", "1 Month", "2 Months", "3 Months", "4+ Months"] },
      { key: "travelToClientHome", label: "Home Delivery", type: "boolean", description: "Deliver outfits to client's home?" },
      { key: "sellMehndi", label: "Rental Available", type: "boolean", description: "Can customers rent outfits?" },
      { key: "hasTeam", label: "Bridesmaid Outfits", type: "boolean", description: "Also cater bridesmaid / family dressing?" },
      { key: "provideDecorationItem", label: "Design Consultation", type: "boolean", description: "Offer personalized design consultation?" },
      { key: "provideFoodTesting", label: "Trial / Fitting Session", type: "boolean", description: "Allow trial before final order?" },
      { key: "provideWaiter", label: "Alteration Service", type: "boolean", description: "Provide in-house alterations?" },
      { key: "provideSoundSystem", label: "Accessory Matching", type: "boolean", description: "Help match jewellery and accessories?" },
      { key: "provideSeatingArrangement", label: "Dupatta Styling", type: "boolean", description: "Offer dupatta draping service?" },
      { key: "providePlate", label: "Groom Wear Available", type: "boolean", description: "Also carry groom outfits?" },
      { key: "parking", label: "Rush Orders Accepted", type: "boolean", description: "Accept urgent last-minute orders?" },
    ],
  },

  [VENDOR_TYPES.WEDDING_STATIONERY]: {
    key: VENDOR_TYPES.WEDDING_STATIONERY,
    icon: Mail,
    displayName: "Wedding Stationery",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per set",
    navLabels: {
      Bookings: "Orders", Customers: "Clients", Calendar: "Delivery Calendar",
      Inventory: "Stock",
    },
    extraNavItems: ["Inventory", "Staff & payroll", "Suppliers"],
    typeSpecificFields: [
      { key: "subBusinessType", label: "Shop Type", type: "select", options: ["Print Studio", "Digital Design Studio", "Boutique Stationery", "Full-Service Wedding Stationery", "Online Store", "Home-Based Business"] },
      { key: "expertise", label: "Products Offered", type: "multi-select", options: [], groups: [
        { group: "Invitation Cards — by Event", emoji: "✉️", description: "Event-specific invitation cards for each Pakistani wedding ceremony", items: [
          "Nikkah Cards (نکاح کارڈ)", "Barat Invitation Cards (برات کارڈ)", "Walima Cards (ولیمہ کارڈ)",
          "Mehndi Cards (مہندی کارڈ)", "Mayun / Ubtan Cards (مایوں کارڈ)", "Engagement / Baat Pakki Cards (منگنی کارڈ)",
          "Dholki Invitation Cards (ڈھولکی کارڈ)", "Multi-Event Combined Card", "Save the Date Cards",
        ]},
        { group: "Card Formats & Styles", emoji: "🎨", description: "Different physical formats and premium finishes for invitation cards", items: [
          "Scroll / Box Invitations", "Laser-Cut Cards", "Acrylic Cards",
          "Velvet Pocket Cards", "Foil / Metallic Cards", "Digital / WhatsApp Invitations",
        ]},
        { group: "Bid Boxes & Favour Boxes", emoji: "🎁", description: "Bid boxes (بِد کی ڈبی) and favour boxes distributed at Nikkah and other events", items: [
          "Bid Boxes / Nikkah Favour Boxes (بِد کی ڈبی)", "Mehndi Favour Bags / Boxes",
          "Sweet Boxes (مٹھائی ڈبی)", "Chocolate Boxes", "Dry Fruit Boxes",
          "Tin / Velvet Boxes", "Pyramid / Pillow Boxes", "Jute / Jammawar Pouches",
        ]},
        { group: "Nikkah Ceremony Stationery", emoji: "📜", description: "Specialised stationery items specifically for the Nikkah ceremony", items: [
          "Nikkah Nama Booklet / Folder", "Nikkah Pen (نکاح قلم)",
          "Nikkah Certificate Frame", "Thumb Board (acrylic)", "Haq Mehar Envelope / Box (حق مہر)",
        ]},
        { group: "Pakistani Ceremony Items", emoji: "🕌", description: "Culture-specific items for Barat, Doodh Pilai, Salami, and other traditions", items: [
          "Doodh Pilai Glass & Tray Set (دودھ پلائی)", "Salami Envelope / Box (سلامی)", "Zamzam Bottle Stickers / Labels",
        ]},
        { group: "Venue / On-the-Day Stationery", emoji: "🏛️", description: "Stationery displayed at the wedding venue on the event day", items: [
          "Welcome Signs / Boards", "Seating Charts", "Place Cards & Table Numbers",
          "Table Menu Cards", "Nikkah Ceremony Programmes",
        ]},
        { group: "Gift Packaging & Wrapping", emoji: "🎀", description: "Decorative boxes, baskets, and tags for presenting gifts and favours", items: [
          "Gift Boxes (Jahez / Trousseau)", "Shagun Baskets / Trays (شگن)",
          "Gift Tags & Favour Tags", "Chocolate / Sweet Wrappers", "Wax Seals & Stamps",
        ]},
        { group: "Post-Wedding Stationery", emoji: "💌", description: "Cards and stationery sent to guests after the wedding", items: [
          "Thank You Cards (شکریہ کارڈ)", "Wedding Announcement Cards",
        ]},
      ]},
      { key: "amenities", label: "Printing Techniques", type: "multi-select", options: ["Digital Printing", "Offset Printing", "Laser Cutting", "Letterpress", "Foil Stamping", "Embossing / Debossing", "Screen Printing", "Hand-Block Printing", "UV Printing", "Calligraphy (Hand-written)"] },
      { key: "serviceProvided", label: "Languages for Printing", type: "multi-select", options: ["Urdu (اردو)", "English", "Bilingual (Urdu + English)", "Arabic", "Punjabi"] },
      { key: "minimumPrice", label: "Starting Price (PKR)", type: "number", placeholder: "3000" },
      { key: "minCapacity", label: "Minimum Order Quantity", type: "number", placeholder: "50", description: "Minimum number of cards or pieces per order" },
      { key: "instruction", label: "Production Turnaround", type: "select", options: ["3-5 Days", "1 Week", "2 Weeks", "3 Weeks", "1 Month", "2 Months", "3+ Months"] },
      { key: "travelToClientHome", label: "Home / Courier Delivery", type: "boolean", description: "Deliver orders to client's home or via courier?" },
      { key: "sellMehndi", label: "Customisation Available", type: "boolean", description: "Custom names, wording, and personalised designs?" },
      { key: "hasTeam", label: "Digital Invitation Files", type: "boolean", description: "Provide WhatsApp-ready / social media digital invites?" },
      { key: "provideDecorationItem", label: "Wax Seal / Stamp Available", type: "boolean", description: "Offer custom wax seals or pre-made wax coins?" },
      { key: "provideFoodTesting", label: "Calligraphy Available", type: "boolean", description: "Hand-written or printed calligraphy text?" },
      { key: "provideWaiter", label: "Envelope Included", type: "boolean", description: "Matching envelopes provided with every card?" },
      { key: "provideSoundSystem", label: "Rush Orders Accepted", type: "boolean", description: "Can fulfil urgent orders on short notice?" },
      { key: "provideSeatingArrangement", label: "Bilingual Printing", type: "boolean", description: "Urdu + English text on the same card?" },
      { key: "providePlate", label: "Acrylic Cards Available", type: "boolean", description: "Offer premium clear or frosted acrylic invitations?" },
      { key: "parking", label: "Nationwide Delivery", type: "boolean", description: "Deliver orders across all cities in Pakistan?" },
    ],
  },

  // ─── BK-100.55 — 14 new Pakistani-specific categories ───────
  // typeSpecificFields mirror the backend TYPE_SPECIFIC_WHITELIST in
  // event-planner-api/src/utils/vendorRegistrationValidators.js, so the
  // dashboard captures exactly what the API accepts for each category.
  [VENDOR_TYPES.NIKAHKHWAN]: {
    key: VENDOR_TYPES.NIKAHKHWAN,
    icon: ScrollText,
    displayName: "Nikahkhwan",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per ceremony",
    navLabels: { Bookings: "Ceremonies", Customers: "Families", Calendar: "Ceremony Calendar" },
    extraNavItems: [],
    typeSpecificFields: [
      { key: "mosqueAffiliation", label: "Mosque / Masjid Affiliation", type: "text", placeholder: "Jamia Masjid …" },
      { key: "languagesOfNikah", label: "Languages of Nikah", type: "multi-select", options: ["Arabic", "Urdu", "English", "Punjabi"] },
      { key: "sectsServed", label: "Sects Served", type: "multi-select", options: ["Sunni", "Shia", "Ahle Hadith", "Deobandi", "Barelvi"] },
      { key: "sermonStyle", label: "Sermon Style", type: "select", options: ["Brief", "Extended", "Customizable"] },
      { key: "nikahnamaDraftingProvided", label: "Nikahnama Drafting Provided", type: "boolean" },
      { key: "witnessesProvided", label: "Witnesses Provided", type: "boolean" },
      { key: "mehrAdvisoryOffered", label: "Mehr Advisory Offered", type: "boolean" },
      { key: "travelToVenue", label: "Travels to Venue", type: "boolean", description: "Willing to perform at a non-masjid venue?" },
      { key: "femaleAttendeesPermitted", label: "Female Attendees Permitted", type: "boolean" },
      { key: "stageDecorIncluded", label: "Stage Decor Included", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.CHOREOGRAPHER]: {
    key: VENDOR_TYPES.CHOREOGRAPHER,
    icon: PersonStanding,
    displayName: "Choreographer",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per package",
    navLabels: { Bookings: "Sessions", Customers: "Clients", Calendar: "Rehearsal Calendar", "Staff & payroll": "Troupe" },
    extraNavItems: ["Staff & payroll"],
    typeSpecificFields: [
      { key: "stylesOffered", label: "Dance Styles", type: "multi-select", options: ["Bollywood", "Folk (Bhangra / Luddi)", "Sufi", "Contemporary", "Family / Mahram-safe"] },
      { key: "sessionsIncluded", label: "Sessions Included", type: "number", placeholder: "8" },
      { key: "sessionLengthMin", label: "Session Length (minutes)", type: "select", options: ["60", "90", "120"] },
      { key: "troupePerformanceOffered", label: "Troupe Performance Offered", type: "boolean", description: "Brings dancers vs. trains the family only?" },
      { key: "familyFriendlyChoreo", label: "Family-Friendly (Mahram-safe) Choreography", type: "boolean" },
      { key: "venueProvidedForRehearsal", label: "Rehearsal Venue Provided", type: "boolean" },
      { key: "musicEditingIncluded", label: "Music Editing Included", type: "boolean" },
      { key: "kidsGroupHandled", label: "Handles Kids' Groups", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.DHOL_PLAYER]: {
    key: VENDOR_TYPES.DHOL_PLAYER,
    icon: Drum,
    displayName: "Dhol Player",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Performances", Customers: "Clients", Calendar: "Performance Calendar", "Staff & payroll": "Dholis" },
    extraNavItems: ["Staff & payroll"],
    typeSpecificFields: [
      { key: "numberOfDholis", label: "Number of Dholis", type: "number", placeholder: "2" },
      { key: "instrumentVariety", label: "Instruments", type: "multi-select", options: ["Dhol", "Naal", "Dholki"] },
      { key: "hoursIncluded", label: "Hours Included", type: "number", placeholder: "2" },
      { key: "traditionalAttire", label: "Traditional Attire", type: "boolean" },
      { key: "mehndiCoverage", label: "Covers Mehndi", type: "boolean" },
      { key: "mehfilCoverage", label: "Covers Mehfil", type: "boolean" },
      { key: "baraatCoverage", label: "Covers Baraat", type: "boolean" },
      { key: "doliCoverage", label: "Covers Doli", type: "boolean" },
      { key: "femaleEventsAccepted", label: "Accepts Female-only Events", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.EVENT_HOST]: {
    key: VENDOR_TYPES.EVENT_HOST,
    icon: Mic,
    displayName: "Event Host / MC",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Engagements", Customers: "Clients", Calendar: "Event Calendar" },
    extraNavItems: [],
    typeSpecificFields: [
      { key: "formalOrCasual", label: "Hosting Style", type: "select", options: ["Formal", "Casual", "Both"] },
      { key: "languagesHosted", label: "Languages Hosted", type: "multi-select", options: ["Urdu", "English", "Punjabi", "Pashto", "Sindhi"] },
      { key: "stagePresenceStyle", label: "Stage Presence", type: "multi-select", options: ["Poetry / Shayari", "Light Stand-up", "Classic Anchor"] },
      { key: "scriptCustomization", label: "Script Customization", type: "boolean" },
      { key: "microphoneIncluded", label: "Microphone Included", type: "boolean" },
      { key: "religiousEtiquetteTrained", label: "Religious Etiquette Trained", type: "boolean" },
      { key: "anchorsBothEventsPerDay", label: "Anchors Both Events in a Day", type: "boolean" },
      { key: "salamiCoordination", label: "Salami Coordination", type: "boolean", description: "Helps coordinate the cash-gifting moment?" },
    ],
  },

  [VENDOR_TYPES.LIVE_STREAMING]: {
    key: VENDOR_TYPES.LIVE_STREAMING,
    icon: Video,
    displayName: "Live Streaming",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Streams", Customers: "Clients", Calendar: "Stream Calendar", Inventory: "Gear", "Staff & payroll": "Crew" },
    extraNavItems: ["Inventory", "Staff & payroll"],
    typeSpecificFields: [
      { key: "platformsSupported", label: "Platforms", type: "multi-select", options: ["Zoom", "YouTube", "Facebook", "WhatsApp", "Instagram"] },
      { key: "multiCameraCount", label: "Number of Cameras", type: "number", placeholder: "3" },
      { key: "hdQuality", label: "Video Quality", type: "select", options: ["720p", "1080p", "4K"] },
      { key: "durationHoursIncluded", label: "Hours Included", type: "number", placeholder: "4" },
      { key: "recordingProvided", label: "Recording Provided", type: "boolean" },
      { key: "overseasFamilyTzCoordination", label: "Overseas Time-zone Coordination", type: "boolean" },
      { key: "redundantInternetCarried", label: "Backup Internet (Mobile Data)", type: "boolean" },
      { key: "switchingDesk", label: "Pro Switching Desk", type: "boolean", description: "Multi-feed switching vs. single feed?" },
    ],
  },

  [VENDOR_TYPES.GENERATOR_RENTAL]: {
    key: VENDOR_TYPES.GENERATOR_RENTAL,
    icon: Zap,
    displayName: "Generator Rental",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per day",
    navLabels: { Bookings: "Rentals", Customers: "Clients", Calendar: "Booking Calendar", Inventory: "Generators", "Generator fuel": "Fuel Log" },
    extraNavItems: ["Inventory", "Generator fuel"],
    typeSpecificFields: [
      { key: "kvaCapacity", label: "Capacity (KVA)", type: "number", placeholder: "30" },
      { key: "fuelType", label: "Fuel Type", type: "select", options: ["Diesel", "Petrol"] },
      { key: "fuelIncluded", label: "Fuel Included", type: "boolean" },
      { key: "operatorOnSite", label: "Operator On-site", type: "boolean" },
      { key: "deliveryAndPickup", label: "Delivery & Pickup", type: "boolean" },
      { key: "soundProofed", label: "Sound-proofed", type: "boolean" },
      { key: "redundantBackup", label: "Backup Unit for Failover", type: "boolean" },
      { key: "outdoorRated", label: "Outdoor Rated", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.MARQUEE_RENTAL]: {
    key: VENDOR_TYPES.MARQUEE_RENTAL,
    icon: Tent,
    displayName: "Marquee & Tent Rental",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Setups", Customers: "Clients", Calendar: "Setup Calendar", Inventory: "Tents & Stock", "Staff & payroll": "Setup Crew" },
    extraNavItems: ["Inventory", "Staff & payroll", "Suppliers"],
    typeSpecificFields: [
      { key: "maxGuestCapacity", label: "Max Guest Capacity", type: "number", placeholder: "500" },
      { key: "fabricColors", label: "Fabric Colors", type: "multi-select", options: ["White", "Ivory", "Gold", "Maroon", "Red", "Pastels"] },
      { key: "setupHours", label: "Setup Hours", type: "number", placeholder: "6" },
      { key: "teardownHours", label: "Teardown Hours", type: "number", placeholder: "3" },
      { key: "includesChairs", label: "Includes Chairs", type: "boolean" },
      { key: "includesTables", label: "Includes Tables", type: "boolean" },
      { key: "includesCarpet", label: "Includes Carpet", type: "boolean" },
      { key: "lightingIncluded", label: "Lighting Included", type: "boolean" },
      { key: "wallSidedTent", label: "Wall-sided Tent", type: "boolean" },
      { key: "acCoolingIncluded", label: "AC / Cooling Included", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.FURNITURE_RENTAL]: {
    key: VENDOR_TYPES.FURNITURE_RENTAL,
    icon: Sofa,
    displayName: "Furniture Rental",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Orders", Customers: "Clients", Calendar: "Delivery Calendar", Inventory: "Furniture Stock" },
    extraNavItems: ["Inventory", "Suppliers"],
    typeSpecificFields: [
      { key: "deliveryRadiusKm", label: "Delivery Radius (km)", type: "number", placeholder: "25" },
      { key: "minOrderValue", label: "Minimum Order (PKR)", type: "number", placeholder: "20000" },
      { key: "chairsAvailable", label: "Chairs Available", type: "boolean" },
      { key: "tablesAvailable", label: "Tables Available", type: "boolean" },
      { key: "sofasAvailable", label: "Sofas Available", type: "boolean" },
      { key: "mandapAvailable", label: "Mandap / Stage Available", type: "boolean" },
      { key: "swingsAvailable", label: "Swings (Jhoola) Available", type: "boolean" },
      { key: "linenIncluded", label: "Linen Included", type: "boolean" },
      { key: "centerpiecesAvailable", label: "Centerpieces Available", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.FLORIST]: {
    key: VENDOR_TYPES.FLORIST,
    icon: Flower2,
    displayName: "Florist",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Orders", Customers: "Clients", Calendar: "Delivery Calendar", Inventory: "Flower Stock" },
    extraNavItems: ["Inventory", "Suppliers"],
    typeSpecificFields: [
      { key: "freshOrArtificial", label: "Flowers", type: "select", options: ["Fresh", "Artificial", "Both"] },
      { key: "importedAvailable", label: "Imported Flowers Available", type: "boolean" },
      { key: "sehraSpecialty", label: "Sehra Specialty", type: "boolean" },
      { key: "bridalBouquetOffered", label: "Bridal Bouquet", type: "boolean" },
      { key: "carDecorOffered", label: "Car Decor", type: "boolean" },
      { key: "stageFloralOffered", label: "Stage Florals", type: "boolean" },
      { key: "centerpieceOffered", label: "Table Centerpieces", type: "boolean" },
      { key: "garlandOffered", label: "Garlands (Haar)", type: "boolean", description: "For stage, nikah or doli?" },
      { key: "weekRoundFreshSupply", label: "Year-round Fresh Supply", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.WEDDING_CAKES]: {
    key: VENDOR_TYPES.WEDDING_CAKES,
    icon: Cake,
    displayName: "Wedding Cakes",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per cake",
    navLabels: { Bookings: "Orders", Customers: "Clients", Calendar: "Delivery Calendar", Inventory: "Stock", "Staff & payroll": "Bakers" },
    extraNavItems: ["Inventory", "Staff & payroll"],
    typeSpecificFields: [
      { key: "tiersOfferedMax", label: "Max Tiers", type: "number", placeholder: "5" },
      { key: "fondantOrCream", label: "Finish", type: "select", options: ["Fondant", "Fresh Cream", "Both"] },
      { key: "minOrderKg", label: "Minimum Order (Kg)", type: "number", placeholder: "2" },
      { key: "tastingPolicy", label: "Tasting Policy", type: "select", options: ["Free", "Paid", "On Booking", "None"] },
      { key: "eggless", label: "Eggless Available", type: "boolean" },
      { key: "customDesigns", label: "Custom Designs", type: "boolean" },
      { key: "mehndiCakeOffered", label: "Mehndi Cake", type: "boolean" },
      { key: "miniCakesOffered", label: "Mini Cakes / Cupcakes", type: "boolean" },
      { key: "deliverySetup", label: "Delivery & Setup", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.MITHAI_SWEETS]: {
    key: VENDOR_TYPES.MITHAI_SWEETS,
    icon: Candy,
    displayName: "Mithai & Sweets",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per kg",
    navLabels: { Bookings: "Orders", Customers: "Clients", Calendar: "Delivery Calendar", Inventory: "Stock" },
    extraNavItems: ["Inventory", "Suppliers"],
    typeSpecificFields: [
      { key: "traditionalRange", label: "Sweets Range", type: "multi-select", options: ["Laddoo", "Gulab Jaman", "Barfi", "Jalebi", "Gajar Halwa", "Rasgulla", "Patisa", "Kalakand"] },
      { key: "customPackaging", label: "Custom Packaging", type: "boolean" },
      { key: "includesDistribution", label: "Includes Distribution", type: "boolean" },
      { key: "boxingForGuests", label: "Guest Take-home Boxes", type: "boolean" },
      { key: "sugarFreeOffered", label: "Sugar-free Options", type: "boolean" },
      { key: "perKgPricing", label: "Per-Kg Pricing", type: "boolean" },
      { key: "sectSpecific", label: "Sect-specific Preparation", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.LIVE_COOKING_STALL]: {
    key: VENDOR_TYPES.LIVE_COOKING_STALL,
    icon: ChefHat,
    displayName: "Live Cooking Stall",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Events", Customers: "Clients", Calendar: "Event Calendar", Inventory: "Stock", "Staff & payroll": "Chefs & Crew" },
    extraNavItems: ["Inventory", "Staff & payroll", "Suppliers", "Halal certs"],
    typeSpecificFields: [
      { key: "stationsOffered", label: "Stations", type: "multi-select", options: ["Chaat", "Paan", "Tandoor", "Juice", "Ice Cream", "BBQ", "Fries"] },
      { key: "kgPerHour", label: "Output (kg / hour)", type: "number", placeholder: "20" },
      { key: "chefIncluded", label: "Chef Included", type: "boolean" },
      { key: "equipmentBrought", label: "Brings Own Equipment", type: "boolean" },
      { key: "halalSourcedIngredients", label: "Halal-sourced Ingredients", type: "boolean" },
      { key: "uniformedStaff", label: "Uniformed Staff", type: "boolean" },
      { key: "tableLinenStyling", label: "Table Linen & Styling", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.SOUND_SYSTEM_RENTAL]: {
    key: VENDOR_TYPES.SOUND_SYSTEM_RENTAL,
    icon: Speaker,
    displayName: "Sound System Rental",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Rentals", Customers: "Clients", Calendar: "Booking Calendar", Inventory: "Equipment", "Staff & payroll": "Operators" },
    extraNavItems: ["Inventory", "Staff & payroll"],
    typeSpecificFields: [
      { key: "speakersCount", label: "Number of Speakers", type: "number", placeholder: "4" },
      { key: "wirelessMicsCount", label: "Wireless Mics", type: "number", placeholder: "2" },
      { key: "wattagePower", label: "Power (Watts)", type: "number", placeholder: "5000" },
      { key: "operatorIncluded", label: "Operator Included", type: "boolean" },
      { key: "mixerIncluded", label: "Mixer Included", type: "boolean" },
      { key: "djBoothIncluded", label: "DJ Booth Included", type: "boolean" },
      { key: "stageLightingIncluded", label: "Stage Lighting Included", type: "boolean" },
      { key: "outdoorRated", label: "Outdoor Rated", type: "boolean" },
    ],
  },

  [VENDOR_TYPES.QAWWALI_NAAT]: {
    key: VENDOR_TYPES.QAWWALI_NAAT,
    icon: Music2,
    displayName: "Qawwali & Naat",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "packages", "type-specific"],
    hasPackages: true,
    hasMenus: false,
    pricingLabel: "per event",
    navLabels: { Bookings: "Performances", Customers: "Clients", Calendar: "Performance Calendar", "Staff & payroll": "Troupe" },
    extraNavItems: ["Staff & payroll"],
    typeSpecificFields: [
      { key: "troupeSize", label: "Troupe Size", type: "number", placeholder: "6" },
      { key: "traditionalInstruments", label: "Instruments", type: "multi-select", options: ["Harmonium", "Tabla", "Dholak"] },
      { key: "languagesSung", label: "Languages", type: "multi-select", options: ["Urdu", "Punjabi", "Persian", "Arabic"] },
      { key: "sessionLengthHours", label: "Session Length (hours)", type: "number", placeholder: "2" },
      { key: "renownedClassics", label: "Signature Pieces", type: "text", placeholder: "Bhar do Jholi, Ya Habib …" },
      { key: "recordingAllowed", label: "Recording Allowed", type: "boolean" },
      { key: "femaleSittingArrangementCompatible", label: "Female Seating Compatible", type: "boolean" },
    ],
  },
};

// ─── Helpers ────────────────────────────────────────────────
export function getVendorTypeConfig(
  vendorType: string | undefined | null
): VendorTypeConfig | null {
  if (!vendorType) return null;
  return VENDOR_TYPE_CONFIGS[vendorType] ?? null;
}

// Issue #33 — the 14 BK-100.55 vendor categories (Marquee rental,
// Mithai and sweets, Wedding cakes, Florist, Generator rental,
// Furniture rental, Sound system rental, Choreographer, Dhol player,
// Event host, Live streaming, Live cooking stall, Nikahkhwan, Qawwali
// and Naat) don't have explicit entries in VENDOR_TYPE_CONFIGS, so
// they all read this default. Before this change the default had no
// extraNavItems, so the Operations group — and crucially the
// "Staff & payroll" surface vendors use to manage their team users —
// never rendered in their sidebar. Result: old vendors could create
// staff/users; new vendors couldn't reach the screen at all.
//
// Add the universally-useful Operations entries here:
//   Staff & payroll  — team / users management (the bug report)
//   Inventory        — most BK-100.55 categories are rental-heavy
// Per-type overrides in VENDOR_TYPE_CONFIGS continue to win for the
// original 9 categories (where these are already declared with
// craft-localised labels like "Drivers" / "Gear / Equipment").
export const DEFAULT_VENDOR_CONFIG = {
  mainNavItems: COMMON_MAIN_NAV,
  controlNavItems: VENDOR_CONTROLS,
  settingsTabs: ["overview", "basic", "images", "packages"] as SettingsTabKey[],
  hasPackages: true,
  hasMenus: false,
  pricingLabel: "per event",
  typeSpecificFields: [] as TypeSpecificFieldDef[],
  extraNavItems: ["Staff & payroll", "Inventory"] as NavItemKey[],
};

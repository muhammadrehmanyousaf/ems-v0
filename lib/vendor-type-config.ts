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
  type LucideIcon,
} from "lucide-react";

// ─── Nav item keys (must match `name` in nav-data.ts) ──────
export type NavItemKey =
  | "Dashboard"
  | "Bookings"
  | "Customers"
  | "Calendar"
  | "Conversations"
  | "Payments"
  | "Reviews"
  | "Notifications"
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
export interface TypeSpecificFieldDef {
  key: string;
  label: string;
  type: "number" | "boolean" | "text" | "select" | "multi-select";
  placeholder?: string;
  options?: string[];
  description?: string;
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
}

// All vendors share these main nav items
const COMMON_MAIN_NAV: NavItemKey[] = [
  "Dashboard",
  "Bookings",
  "Customers",
  "Calendar",
  "Conversations",
  "Payments",
  "Reviews",
  "Notifications",
];

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
    typeSpecificFields: [
      { key: "subBusinessType", label: "Stationery Type", type: "select", options: ["Digital", "Printed", "Calligraphy", "Custom Design"] },
      { key: "expertise", label: "Product Types", type: "multi-select", options: ["Invitations", "Save the Date", "Thank You Cards", "Programs", "Menus", "Escort Cards", "Signage"] },
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

export const DEFAULT_VENDOR_CONFIG = {
  mainNavItems: COMMON_MAIN_NAV,
  controlNavItems: VENDOR_CONTROLS,
  settingsTabs: ["overview", "basic", "images", "packages"] as SettingsTabKey[],
  hasPackages: true,
  hasMenus: false,
  pricingLabel: "per event",
  typeSpecificFields: [] as TypeSpecificFieldDef[],
};

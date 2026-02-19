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
    settingsTabs: ["overview", "basic", "images", "packages", "menus", "type-specific"],
    hasPackages: true,
    hasMenus: true,
    pricingLabel: "per event",
    typeSpecificFields: [
      { key: "maxCapacity", label: "Maximum Capacity", type: "number", placeholder: "500" },
      { key: "minCapacity", label: "Minimum Capacity", type: "number", placeholder: "50" },
      { key: "catering", label: "In-house Catering", type: "boolean", description: "Does the venue provide catering?" },
      { key: "parking", label: "Parking Available", type: "boolean" },
      { key: "carParkingCapacity", label: "Car Parking Capacity", type: "number", placeholder: "100" },
      { key: "amenities", label: "Amenities", type: "multi-select", options: ["AC", "Stage", "Sound System", "LED Wall", "Bridal Room", "Generator", "Valet Parking", "Wheelchair", "Wifi"] },
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
      { key: "expertise", label: "Expertise", type: "multi-select", options: ["Wedding", "Pre-wedding", "Engagement", "Nikah", "Mehndi", "Walima", "Drone", "Cinematic Video"] },
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
      { key: "provideDecorationItem", label: "Provide Decoration Items", type: "boolean", description: "Do you provide all decoration items?" },
      { key: "expertise", label: "Decoration Styles", type: "multi-select", options: ["Traditional", "Modern", "Floral", "Themed", "Outdoor", "Indoor", "Minimal"] },
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
      { key: "sellMehndi", label: "Sell Mehndi Products", type: "boolean", description: "Do you sell mehndi/henna cones?" },
      { key: "hasTeam", label: "Has a Team", type: "boolean", description: "Do you have a team of artists?" },
      { key: "travelToClientHome", label: "Travel to Client", type: "boolean" },
      { key: "expertise", label: "Design Styles", type: "multi-select", options: ["Arabic", "Indian", "Pakistani", "Moroccan", "Indo-Arabic", "Bridal", "Party"] },
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
      { key: "subBusinessType", label: "Salon Type", type: "select", options: ["Home-based", "Salon", "Freelance"] },
      { key: "travelToClientHome", label: "Travel to Client", type: "boolean" },
      { key: "expertise", label: "Specializations", type: "multi-select", options: ["Bridal", "Party", "Engagement", "Mehndi", "Walima", "Nikkah", "Editorial"] },
    ],
  },

  [VENDOR_TYPES.CAR_RENTAL]: {
    key: VENDOR_TYPES.CAR_RENTAL,
    icon: Car,
    displayName: "Car Rental",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "type-specific"],
    hasPackages: false,
    hasMenus: false,
    pricingLabel: "per day",
    typeSpecificFields: [
      { key: "subBusinessType", label: "Vehicle Type", type: "select", options: ["Sedan", "SUV", "Luxury", "Classic", "Limousine", "Bus", "Van"] },
      { key: "cityCovered", label: "Cities Covered", type: "multi-select", options: ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"] },
    ],
  },

  [VENDOR_TYPES.BRIDAL_WEAR]: {
    key: VENDOR_TYPES.BRIDAL_WEAR,
    icon: Shirt,
    displayName: "Bridal Wear",
    mainNavItems: COMMON_MAIN_NAV,
    controlNavItems: VENDOR_CONTROLS,
    settingsTabs: ["overview", "basic", "images", "type-specific"],
    hasPackages: false,
    hasMenus: false,
    pricingLabel: "per item",
    typeSpecificFields: [
      { key: "subBusinessType", label: "Store Type", type: "select", options: ["Boutique", "Designer", "Rental", "Multi-brand"] },
      { key: "expertise", label: "Specializations", type: "multi-select", options: ["Bridal Lehenga", "Sharara", "Gharara", "Maxi", "Anarkali", "Western"] },
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

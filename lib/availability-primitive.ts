// Phase-3 EPIC 1 · AE-01 — FE mirror of the backend primitiveResolver.
//
// One source of truth on the client for "what availability shape does this vendor
// type use?" — so nav/labels/booking UI can branch on primitive. Keyed on the same
// canonical `User.vendorType` display strings as the backend. Keep in sync with
// event-planner-api/src/services/availability/primitiveResolver.js.

export type AvailabilityPrimitive =
  | "P1_VENUE_LOCK" | "P2_PERSON_SLOT" | "P3_UNIT_POOL" | "P4_CAPACITY" | "P5_PIPELINE";

export const PRIMITIVE_LABEL: Record<AvailabilityPrimitive, string> = {
  P1_VENUE_LOCK: "Date-lock (venue)",
  P2_PERSON_SLOT: "Time-slots (crew)",
  P3_UNIT_POOL: "Unit pool (rental)",
  P4_CAPACITY: "Order & deliver",
  P5_PIPELINE: "Made-to-order",
};

const TYPE_PRIMITIVE: Record<string, AvailabilityPrimitive> = {
  "Wedding venue": "P1_VENUE_LOCK",
  "Photographer": "P2_PERSON_SLOT",
  "Henna artist": "P2_PERSON_SLOT",
  "Makeup artist": "P2_PERSON_SLOT",
  "Nikahkhwan": "P2_PERSON_SLOT",
  "Choreographer": "P2_PERSON_SLOT",
  "Dhol player": "P2_PERSON_SLOT",
  "Event host": "P2_PERSON_SLOT",
  "Live streaming": "P2_PERSON_SLOT",
  "Qawwali and Naat": "P2_PERSON_SLOT",
  "Decorator": "P3_UNIT_POOL",
  "Car rental": "P3_UNIT_POOL",
  "Generator rental": "P3_UNIT_POOL",
  "Marquee rental": "P3_UNIT_POOL",
  "Furniture rental": "P3_UNIT_POOL",
  "Florist": "P3_UNIT_POOL",
  "Sound system rental": "P3_UNIT_POOL",
  "Catering": "P4_CAPACITY",
  "Wedding cakes": "P4_CAPACITY",
  "Mithai and sweets": "P4_CAPACITY",
  "Live cooking stall": "P4_CAPACITY",
  "Bridal wearing": "P5_PIPELINE",
  "Wedding Invitations and Stationery": "P5_PIPELINE",
};

export const CANONICAL_VENDOR_TYPES = Object.keys(TYPE_PRIMITIVE);

export interface BusinessAvailabilityConfig {
  availabilityPrimitive?: AvailabilityPrimitive | null;
  availabilityConfigJson?: { mode?: "fixed" | "portable" } | null;
}

/** Resolve a vendor type to its availability primitive (mirrors the backend). */
export function resolvePrimitive(
  vendorType: string | null | undefined,
  config: BusinessAvailabilityConfig = {},
): AvailabilityPrimitive | null {
  const override = config.availabilityPrimitive;
  if (override && override in PRIMITIVE_LABEL) return override;

  const key = normalizeType(vendorType);
  if (!key) return null;
  if (key === "Marquee rental") {
    return config.availabilityConfigJson?.mode === "fixed" ? "P1_VENUE_LOCK" : "P3_UNIT_POOL";
  }
  return TYPE_PRIMITIVE[key] ?? null;
}

function normalizeType(vendorType: string | null | undefined): string | null {
  if (!vendorType) return null;
  const raw = String(vendorType).trim();
  if (TYPE_PRIMITIVE[raw]) return raw;
  const lc = raw.toLowerCase();
  return CANONICAL_VENDOR_TYPES.find((t) => t.toLowerCase() === lc) ?? null;
}

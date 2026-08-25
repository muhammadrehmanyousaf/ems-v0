// Legacy camelCase keys used by the mock filter data in lib/data.ts and
// components/FilterContent.tsx. (Live vendor types are the 23 enum values in
// lib/vendor-types.ts — this union is only for the legacy filter mock.)
export type VendorType =
  | "venues"
  | "photographers"
  | "makeupArtists"
  | "decor"
  | "catering"
  | "hennaArtists"
  | "weddingStationery"
  | "bridalWear"
  | "carRental";

export interface Vendor {
  id: string | number;
  userId?: number;
  name: string;
  images: string[];
  location: string;
  city: string;
  rating: number;
  reviews: Review[];
  price: number;
  minimumPrice: number;
  type: string;
  subBusinessType?: string | string[];
  capacity?: number;
  amenities: string[];
  cancellationPolicy: string;
  cancelationPolicy?: string;
  sponsored: boolean;
  staff: string[];
  description: string;
  packages: Package[];
  menus?: VendorMenu[];
  video?: string;
  availability?: Availability;
  isFavorite?: boolean;
  // Type-specific fields from backend
  maxCapacity?: number;
  minCapacity?: number;
  catering?: boolean;
  parking?: boolean;
  carParkingCapacity?: number;
  expertise?: string[];
  travelToClientHome?: boolean;
  cityCovered?: string[];
  provideDecorationItem?: boolean;
  provideFoodTesting?: boolean;
  provideWaiter?: boolean;
  providePlate?: boolean;
  provideSeatingArrangement?: boolean;
  provideSoundSystem?: boolean;
  sellMehndi?: boolean;
  hasTeam?: boolean;
  downPayment?: number;
  downPaymentType?: string;
  additionalInfo?: string;
  instruction?: string;
  subArea?: string;
  serviceProvided?: string[];
  // BK-048 vacation mode (surfaced by GET /api/v1/businesses)
  vacationMode?: boolean | null;
  vacationStartsAt?: string | null;
  vacationEndsAt?: string | null;
  vacationMessage?: string | null;
  // BK-074 outdoor / municipal permit
  requiresPermit?: boolean | null;
  permitChecklistUrl?: string | null;
  // BK-053 last-spot urgency — backend gap today (only on availability bulk
  // endpoint). Surfaced as optional so the card auto-activates the pill
  // once `getBusinesses` is enriched. May arrive at the top level or under
  // an `availabilitySummary` block.
  lastSpot?: boolean | null;
  availabilitySummary?: {
    lastSpot?: boolean | null;
    remaining?: number | null;
    [key: string]: unknown;
  } | null;
  // BK-100.54 — Pakistani-specific search-filter inputs.
  // VR-050.9 captures these into the backend `typeSpecificDetails` JSONB
  // blob (per-vendor-type whitelist) and `languagesSpoken` TEXT[] column.
  // Surfaced here as optional so legacy vendor rows (where these are NULL)
  // simply fail the filter predicate — never crash.
  typeSpecificDetails?: Record<string, unknown> | null;
  languagesSpoken?: string[] | null;
  // BK-100.6 — computed reliability score + earned trust badges.
  // Attached by getBusinesses / getBusinessesByVendorType on the
  // backend. Optional so legacy callers / cached responses parse cleanly.
  reliability?: {
    score: number; // 0..100
    tier: 'newcomer' | 'rising' | 'trusted' | 'premium' | 'elite';
    badges: string[]; // e.g. ['top_vendor','verified','dispute_free']
    breakdown?: Record<string, number>;
  } | null;
}

export interface Availability {
  businessId: string;
  availabilityPeriod: {
    startDate: string;
    endDate: string;
    daysAhead: number;
  };
  timeSlots: string[];
  availability: AvailabilityDay[];
}

export interface AvailabilityDay {
  date: string;
  isAvailable: boolean;
  availableSlots: string[];
  bookedSlots: string[];
  totalSlots: number;
  availableCount: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  features: string[] | Record<string, string[]>;
  businessId: number;
  images?: string[] | null;
  // WW-PKG-UNIT — how this package's price is CHARGED. Menus have carried
  // `pricingUnit` since WW-PRICING-OVERHAUL; packages did not, so every package
  // was read as a flat per-event amount and "Rs 2,500 per head" could not be
  // expressed at all. NULL / "per_event" is the legacy flat price and is
  // unchanged. Rule: lib/pricing/package.ts (mirrors the server's
  // src/utils/packagePricing.js).
  pricingUnit?: "per_head" | "per_event" | string | null;
  /** Minimum billable heads — the Pakistani min-pax guarantee. Per-head only. */
  minGuaranteeCount?: number | null;
  /**
   * TRUE = this price already covers catering, so a selected menu contributes
   * ZERO. The customer still picks their dishes; they are not charged twice.
   * FALSE (default, every legacy row) keeps the additive package + menu total.
   */
  includesFood?: boolean | null;
  /** Advisory band shown on the card ("200–800 guests"). NULL = unbounded. */
  guestRangeMin?: number | null;
  guestRangeMax?: number | null;
  /** buffet | sit_down | family | hi_tea | stations. NULL = unspecified. */
  serviceStyle?: string | null;
  /** The menu this package bundles, when the vendor declared one. */
  menuId?: number | null;
}

export interface VendorMenu {
  id: string | number;
  title: string;
  price: number;
  data?: { items?: string[] } | null;
  // WW-PRICING-OVERHAUL — per-head billing. "per_head" bills price × guests
  // (floored at minGuaranteeCount); NULL / "per_event" is a flat price.
  pricingUnit?: "per_head" | "per_event" | string | null;
  minGuaranteeCount?: number | null;
}

export interface Venue {
  id: number;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  type: string;
  capacity: number;
  amenities: string[];
  cancellationPolicy: string;
  sponsored: boolean;
}

export interface Filters {
  city: string;
  subArea: string;
  minPrice: string;
  maxPrice: string;
  type: string;
  capacity: string;
  amenities: string[];
  cancellationPolicy: string;
  staff: string[];
}

export type SortOption =
  | "default"
  | "price-low"
  | "price-high"
  | "rating"
  | "alphabetical";
export type StaffOption = "Male" | "Female" | "Transgender";

export interface VendorCardProps {
  id: string | number;
  name: string;
  image: string;
  location: string;
  rating?: number;
  reviews?: number;
  price: number | string;
  type: string;
  vendorType?: string;
  capacity?: number;
  amenities?: string[];
  sponsored?: boolean;
  showBookButton?: boolean;
  showDetails?: boolean;
  className?: string;
}

/////////////////////////////////////////

export interface BookingFormData {
  // User Info
  username: string;
  phoneNumber: string;
  email: string;
  password: string;

  // Date & Time
  bookingDate: Date | string | undefined;
  timeSlot: string;
  // Optional: when the vendor uses configured slot templates (capacity-aware
  // availability engine), the chosen template's id is carried so the backend
  // runs the capacity-aware booking path. Null/undefined = legacy fixed
  // Morning/Afternoon/Evening period booking (unchanged).
  slotTemplateId?: number | null;
  /**
   * SLOTS step 10 — the chosen slot's own name and hours, carried forward.
   *
   * The picker used to store `timeSlot` (the start time) and the id, and drop
   * the rest. Every screen after it — review, preview, payment, both success
   * screens — therefore had nothing to show but "19:00", and each invented its
   * own map from that back to a name. They disagreed with each other and none
   * of them could say "Dinner event", which is what the customer had actually
   * clicked.
   *
   * Optional and additive: absent on the legacy period path, where
   * `describeSlot` falls back to the canonical Morning/Afternoon/Evening names.
   */
  slotLabel?: string | null;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
  guestCount: number;
  /**
   * 10.13 (UC-15) — how the function is arranged: MIXED, MARDANA, ZENANA or
   * SEGREGABLE, mirroring `SubVenue.genderMode` and the CHECK constraint on
   * `Bookings.requestedGenderMode`.
   *
   * Optional and three-state: `null`/absent means the family stated no
   * preference, which is NOT the same as choosing MIXED. The check reports
   * `unknown` rather than inventing a requirement on their behalf, and the
   * payload omits the field entirely.
   */
  requestedGenderMode?: "MIXED" | "MARDANA" | "ZENANA" | "SEGREGABLE" | null;

  // Package
  selectedPackage: string;
  vehicleQuantity?: number; // how many units of the selected car to book
  eventType: string;
  // Menu
  selectedMenu: string;
  menuAddons: string[];

  // Vendors
  selectedVendors: string[];
  selectedVendorPackages: string[]; // New field for vendor packages

  // Pricing
  totalPrice: number;

  // BK-100.53 — Service-location mode. Where will the service actually
  // happen? All optional; backend defaults to at_vendor when absent.
  //   at_vendor          → bride/groom comes to the vendor's premises
  //   at_customer_home   → vendor travels to the customer's home
  //   at_customer_plot   → vendor delivers physical setup to a plot
  //                        (marquee companies, home-wedding decorators)
  //   at_third_party     → masjid for Nikah, family member's farmhouse,
  //                        public lawn, etc.
  serviceLocationMode?: 'at_vendor' | 'at_customer_home' | 'at_customer_plot' | 'at_third_party';
  serviceLocationAddress?: string;
  serviceLocationNotes?: string;

  // BK-100.2 Layer 2d — optional umbrella attachment. When set, the
  // booking is auto-linked to this WeddingUmbrella row on create AND
  // any qualifying multi-event bundle discount (2 events → 3%, 3 → 5%,
  // 4 → 7%, 5+ → 10%) is applied to totalAmount + downPayment by the
  // backend at create-time. Customer picks this on the review step.
  umbrellaId?: number;

  // BK-100.52 Layer 2c — optional add-on selections from each vendor's
  // BusinessBundledService catalogue. Keyed by businessId so multi-
  // vendor carts stay cleanly separated. Backend validates each
  // selection (must exist, must not be mandatory/included, must belong
  // to a vendor in the cart) and applies the priceModel math
  // (flat / per_plate × guestCount / percentage_of_total / free)
  // before snapshotting to Booking.selectedBundledServicesJson.
  selectedBundledServices?: Record<number, Array<{ serviceId: number }>>;

  // Issue #5 — car-rental pickup / dropoff addresses. Only populated by
  // the car-rental booking flow; non-car-rental bookings leave these
  // undefined. Dynamic rent surcharge by distance is tracked separately
  // (issue #35).
  pickupAddress?: string;
  dropoffAddress?: string;
}

export interface EventBooking {
  eventType: string;
  formData: BookingFormData;
  currentStep: number;
  isSubmitted: boolean;
  bookingResponse?: any; // Add booking response to store API response
}

export interface MultiEventBookingState {
  events: EventBooking[];
  activeEventIndex: number;
}

export interface BookingPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  facilities: string[];
}

export interface BookingVendorPackage {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface BookingMenu {
  id: string;
  name: string;
  price: number;
  description: string;
  items: string[];
}

export interface BookingMenuAddon {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface BookingVendor {
  id: string;
  type: string;
  name: string;
  price: number;
  description: string;
  packages?: BookingVendorPackage[];
}

export interface BookingEventType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface EventVenue {
  id: number;
  userId: number;

  name: string;
  description: string;
  additionalInfo: string;
  instruction: string;

  city: string;
  subArea: string;
  cityCovered: string[];

  subBusinessType: string;
  /**
   * WW-BOOKING-MODE — how a booking with this venue reaches Confirmed.
   *
   *   instant       confirmed once the advance is recorded (legacy behaviour)
   *   request       the vendor accepts FIRST; payment is asked for after
   *   inquiry_only  no online booking; the venue calls back
   *
   * NULL / absent reads as `instant`, so no existing venue changes behaviour.
   * Read it through `effectiveBookingMode` rather than comparing directly.
   */
  bookingMode?: "instant" | "request" | "inquiry_only" | string | null;
  menus: any[];
  services: string;
  serviceProvided: string[];
  expertise: string[];

  amenities: string[];
  staff: string[];

  minCapacity: number;
  maxCapacity: number;
  minimumPrice: number;
  downPayment: number;
  downPaymentType: "Percentage" | "Fixed" | string;
  cancelationPolicy: string;
  // WW-PRICING-OVERHAUL — vendor-declared pricing mode. NULL = legacy inferred
  // behaviour. One of flat | per_head | package | package_plus_menu | per_unit | quote.
  pricingMode?: string | null;
  pricingConfigJson?: Record<string, any> | null;
  vendor?: any;
  parking: boolean;
  carParkingCapacity: number;
  catering: boolean;
  provideDecorationItem: boolean;
  provideFoodTesting: boolean;
  providePlate: boolean;
  provideSeatingArrangement: boolean;
  provideSoundSystem: boolean;
  provideWaiter: boolean;
  sellMehndi: boolean;
  travelToClientHome: boolean;
  covidComplaint: boolean;

  images: string[];
  packages?: any[];
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  bookingDetails: {
    id: number;
    customerName: string;
    bookingDate: string;
    bookingTime: string;
    status: string;
    paymentStatus: string;
    businesses: Array<{
      id: number;
      name: string;
    }>;
  };
  paymentDetails: {
    type: "down_payment" | "remaining_payment" | "full_payment";
    amount: number;
    currency: string;
    expectedAmount: number;
  };
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: PaymentIntent;
}

export interface PaymentProcessingResponse {
  status: boolean;
  message: string;
  data: {
    bookingId: number;
    totalPayouts: number;
    payouts: Array<{
      payoutId: number;
      vendorId: number;
      vendorName: string;
      businessId: number;
      businessName: string;
      originalAmount: number;
      platformFee: number;
      payoutAmount: number;
      status: string;
      bankDetails: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
      } | null;
    }>;
  };
}

export interface PaymentHistory {
  id: number;
  bookingId: number;
  amount: number;
  currency: string;
  paymentType: "down_payment" | "remaining_payment" | "full_payment";
  status: "pending" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  totalAmount?: number;
  bookingDetails?: {
    customerName: string;
    bookingDate: string;
    businesses: Array<{
      id: number;
      name: string;
    }>;
  };
}

export interface PendingPayment {
  id: number;
  bookingId: number;
  customerName: string;
  bookingDate: string;
  bookingTime?: string;
  businesses: Array<{
    id: number;
    name: string;
  }>;
  paymentType: "down_payment" | "remaining_payment" | "full_payment";
  amount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  totalAmount?: number;
  downPayment?: number;
}

export interface PlatformStats {
  vendors: number;
  couplesServed: number;
  cities: number;
}

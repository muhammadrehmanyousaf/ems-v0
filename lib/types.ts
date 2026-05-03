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
}

export interface VendorMenu {
  id: string | number;
  title: string;
  price: number;
  data?: { items?: string[] } | null;
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
  guestCount: number;

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

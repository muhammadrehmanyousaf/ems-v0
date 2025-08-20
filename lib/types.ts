export interface Vendor {
  id: string | number
  name: string
  images: string[]
  location: string
  city: string
  rating: number
  reviews: Review[]
  price: number
  minimumPrice: number
  type: string
  subBusinessType: string
  capacity?: number
  amenities: string[]
  cancellationPolicy: string
  sponsored: boolean
  staff: string[]
  description: string
  packages: Package[]
  video?: string
  availability?: Availability
  isFavorite?: boolean
}

export interface Availability {
  businessId: string
  availabilityPeriod: {
    startDate: string
    endDate: string
    daysAhead: number
  }
  timeSlots: string[]
  availability: AvailabilityDay[]
}

export interface AvailabilityDay {
  date: string
  isAvailable: boolean
  availableSlots: string[]
  bookedSlots: string[]
  totalSlots: number
  availableCount: number
}

export interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  date: string
  images?: string[]
}

export interface Package {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  duration?: string
}

export interface Venue {
  id: number
  name: string
  image: string
  location: string
  rating: number
  reviews: number
  price: number
  type: string
  capacity: number
  amenities: string[]
  cancellationPolicy: string
  sponsored: boolean
}

export interface Filters {
  city: string
  subArea: string
  minPrice: string
  maxPrice: string
  type: string
  capacity: string
  amenities: string[]
  cancellationPolicy: string
  staff: string[]
}

export type SortOption = "default" | "price-low" | "price-high" | "rating" | "alphabetical"
export type StaffOption = "Male" | "Female" | "Transgender"

export interface VendorCardProps {
  id: string | number
  name: string
  image: string
  location: string
  rating?: number
  reviews?: number
  price: number | string
  type: string
  vendorType?: string
  capacity?: number
  amenities?: string[]
  sponsored?: boolean
  showBookButton?: boolean
  showDetails?: boolean
  className?: string
}

/////////////////////////////////////////

export interface BookingFormData {
  // User Info
  username: string
  phoneNumber: string
  email: string
  password: string

  // Date & Time
  bookingDate: Date | string | undefined
  timeSlot: string
  guestCount: number

  // Package
  selectedPackage: string
  eventType: string
  // Menu
  selectedMenu: string
  menuAddons: string[]

  // Vendors
  selectedVendors: string[]
  selectedVendorPackages: string[] // New field for vendor packages

  // Pricing
  totalPrice: number
}

export interface EventBooking {
  eventType: string
  formData: BookingFormData
  currentStep: number
  isSubmitted: boolean
  bookingResponse?: any // Add booking response to store API response
}

export interface MultiEventBookingState {
  events: EventBooking[]
  activeEventIndex: number
}

export interface BookingPackage {
  id: string
  name: string
  price: number
  description: string
  facilities: string[]
}

export interface BookingVendorPackage {
  id: string
  vendorId: string
  name: string
  price: number
  description: string
  features: string[]
}

export interface BookingMenu {
  id: string
  name: string
  price: number
  description: string
  items: string[]
}

export interface BookingMenuAddon {
  id: string
  name: string
  price: number
  description: string
}

export interface BookingVendor {
  id: string
  type: string
  name: string
  price: number
  description: string
  packages?: BookingVendorPackage[]
}

export interface BookingEventType {
  id: string
  name: string
  icon: string
  description: string
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
  menus: any[]
  services: string;
  serviceProvided: string[];
  expertise: string[];

  amenities: string[];
  staff: string[];

  minCapacity: number;
  maxCapacity: number;
  minimumPrice: number;
  starterPrice: number;
  downPayment: number;
  downPaymentType: 'Percentage' | 'Fixed' | string;
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
  packages?: any[]
  createdAt: string;
  updatedAt: string;
}
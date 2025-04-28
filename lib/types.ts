export interface Vendor {
  id: number
  name: string
  images: string[]
  video?: string
  location?: string
  rating?: number
  reviews?: Review[]
  minimumPrice: number
  type: string
  capacity?: number
  amenities: string[]
  cancellationPolicy?: string
  sponsored: boolean;
  city: string;
  subBusinessType: string;
  packages: Package[]
  description: string
  staff: string[]
}

export interface Package {
  id: number
  name: string
  price: number
  description: string
  items: string[]
}

export interface Review {
  id: number
  vendorId: number
  userName: string
  rating: number
  comment: string
  date: string
}

export interface Filters {
  city: string
  subArea: string
  minPrice: string
  maxPrice: string
  type: string
  capacity?: string
  amenities: string[]
  cancellationPolicy?: string
  staff: StaffOption[]
}

export type SortOption = "default" | "price-low" | "price-high" | "rating" | "alphabetical"

export type VendorType =
  | "venues"
  | "photographers"
  | "makeupArtists"
  | "decor"
  | "catering"
  | "hennaArtists"
  | "weddingStationery"
  | "bridalWear"
  | "carRental"

export type StaffOption = "male" | "female" | "transgender" | "all"

/////////////////////////////////////////

export interface BookingFormData {
  // User Info
  username: string
  phoneNumber: string
  email: string
  password: string

  // Date & Time
  bookingDate: Date | undefined
  timeSlot: string
  guestCount: number

  // Package
  selectedPackage: string

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



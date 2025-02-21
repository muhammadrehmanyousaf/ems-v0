export interface Vendor {
  id: number
  name: string
  images: string[]
  video?: string
  location: string
  rating: number
  reviews: Review[]
  price: number
  type: string
  capacity?: number
  amenities: string[]
  cancellationPolicy?: string
  sponsored: boolean
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


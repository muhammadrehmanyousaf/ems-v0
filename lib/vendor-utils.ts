import type { Vendor, VendorCardProps } from './types'
import { getVendorTypeDisplayName, getVendorTypeFromPath } from './vendor-types'

// Format price consistently across the app
export const formatPrice = (price: number | string): string => {
  if (typeof price === 'number') {
    return `PKR ${price.toLocaleString()}`
  }
  return `PKR ${price}`
}

// Format rating with proper decimal places
export const formatRating = (rating: number): string => {
  return rating.toFixed(1)
}

// Get vendor type display name (re-export from vendor-types)
export const getVendorTypeDisplay = getVendorTypeDisplayName

// Convert vendor data to card props
export const vendorToCardProps = (vendor: Vendor): VendorCardProps => {
  return {
    id: vendor.id,
    name: vendor.name,
    image: vendor.images[0] || '/placeholder.svg',
    location: vendor.location || vendor.city,
    rating: vendor.rating,
    reviews: vendor.reviews.length,
    price: vendor.minimumPrice || vendor.price,
    type: vendor.subBusinessType || vendor.type,
    capacity: vendor.capacity,
    amenities: vendor.amenities,
    sponsored: vendor.sponsored,
  }
}

// Filter vendors by type
export const filterVendorsByType = (vendors: Vendor[], type: string): Vendor[] => {
  if (!type || type === 'all') return vendors
  return vendors.filter(vendor => 
    vendor.type.toLowerCase().includes(type.toLowerCase()) ||
    vendor.subBusinessType.toLowerCase().includes(type.toLowerCase())
  )
}

// Sort vendors by different criteria
export const sortVendors = (vendors: Vendor[], sortBy: string): Vendor[] => {
  const sorted = [...vendors]
  
  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => (a.minimumPrice || a.price) - (b.minimumPrice || b.price))
    case 'price-high':
      return sorted.sort((a, b) => (b.minimumPrice || b.price) - (a.minimumPrice || a.price))
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'alphabetical':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted
  }
}

// Get vendor type from URL path (re-export from vendor-types)
export { getVendorTypeFromPath }

// Validate vendor data
export const validateVendor = (vendor: any): vendor is Vendor => {
  return (
    vendor &&
    typeof vendor.id !== 'undefined' &&
    typeof vendor.name === 'string' &&
    Array.isArray(vendor.images) &&
    typeof vendor.location === 'string' &&
    typeof vendor.rating === 'number' &&
    Array.isArray(vendor.reviews)
  )
}

// Get vendor statistics
export const getVendorStats = (vendors: Vendor[]) => {
  return {
    total: vendors.length,
    averageRating: vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length || 0,
    priceRange: {
      min: Math.min(...vendors.map(v => v.minimumPrice || v.price)),
      max: Math.max(...vendors.map(v => v.minimumPrice || v.price)),
    },
    types: [...new Set(vendors.map(v => v.type))],
  }
} 
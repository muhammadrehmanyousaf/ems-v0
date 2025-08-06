# Featured Components with API Integration

## Overview

This document describes all the featured components in the homepage that use API integration to display vendor data dynamically.

## Featured Components

### 1. FeaturedVendors (`featured-vendors.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses()` - Gets all featured vendors
- **Purpose**: Shows a mix of all vendor types
- **Link**: `/vendors`

### 2. FeaturedPhotographers (`FeaturedPhotographers.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.PHOTOGRAPHER)`
- **Purpose**: Shows featured photographers
- **Link**: `/photographers`

### 3. FeaturedVenues (`FeaturedVenues.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.WEDDING_VENUE)`
- **Purpose**: Shows featured wedding venues
- **Link**: `/venues`

### 4. FeaturedMakeupArtists (`FeaturedMakeupArtists.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.MAKEUP_ARTIST)`
- **Purpose**: Shows featured makeup artists
- **Link**: `/makeup-artists`

### 5. FeaturedDecorators (`FeaturedDecorators.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.DECORATOR)`
- **Purpose**: Shows featured decorators
- **Link**: `/decor`

### 6. FeaturedHennaArtists (`FeaturedHennaArtists.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.HENNA_ARTIST)`
- **Purpose**: Shows featured henna artists
- **Link**: `/henna-artists`

### 7. FeaturedCatering (`FeaturedCatering.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.CATERING)`
- **Purpose**: Shows featured catering services
- **Link**: `/catering`

### 8. FeaturedCarRental (`FeaturedCarRental.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.CAR_RENTAL)`
- **Purpose**: Shows featured car rental services
- **Link**: `/car-rental`

### 9. FeaturedBridalWear (`FeaturedBridalWear.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.BRIDAL_WEAR)`
- **Purpose**: Shows featured bridal wear
- **Link**: `/bridal-wear`

### 10. FeaturedWeddingStationery (`FeaturedWeddingStationery.tsx`)
- **API Call**: `VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.WEDDING_STATIONERY)`
- **Purpose**: Shows featured wedding stationery
- **Link**: `/wedding-stationery`

## Features

### ✅ API Integration
All components use the `VendorAPI.getFeaturedBusinesses()` method with specific vendor types.

### ✅ Loading States
Beautiful skeleton loading while data is being fetched.

### ✅ Error Handling
Comprehensive error handling with console logging.

### ✅ Responsive Design
All components work perfectly on mobile, tablet, and desktop.

### ✅ Carousel Navigation
Smooth carousel navigation with proper controls.

### ✅ VendorCard Integration
All components use the unified `VendorCard` component for consistency.

## Component Structure

Each featured component follows this structure:

```tsx
export function Featured[VendorType]() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured[VendorType] = async () => {
      try {
        const featured[VendorType] = await VendorAPI.getFeaturedBusinesses(VENDOR_TYPES.[VENDOR_TYPE])
        setVendors(featured[VendorType])
      } catch (error) {
        console.error('Error fetching featured [vendor type]:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeatured[VendorType]()
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      {/* Header with title and link */}
      {/* Carousel with loading states */}
      {/* Mobile link */}
    </section>
  )
}
```

## Featured Categories

The `featured-categories.tsx` component includes all 9 vendor types:

1. **Venues** - `/venues`
2. **Photographers** - `/photographers`
3. **Makeup Artists** - `/makeup-artists`
4. **Decorators** - `/decor`
5. **Henna Artists** - `/henna-artists`
6. **Catering** - `/catering`
7. **Car Rental** - `/car-rental`
8. **Bridal Wear** - `/bridal-wear`
9. **Wedding Stationery** - `/wedding-stationery`

## Usage in Homepage

To use these components in your homepage, import and add them:

```tsx
import { FeaturedVendors } from "@/components/homepage/featured-vendors"
import { FeaturedPhotographers } from "@/components/homepage/FeaturedPhotographers"
import { FeaturedVenues } from "@/components/homepage/FeaturedVenues"
import { FeaturedMakeupArtists } from "@/components/homepage/FeaturedMakeupArtists"
import { FeaturedDecorators } from "@/components/homepage/FeaturedDecorators"
import { FeaturedHennaArtists } from "@/components/homepage/FeaturedHennaArtists"
import { FeaturedCatering } from "@/components/homepage/FeaturedCatering"
import { FeaturedCarRental } from "@/components/homepage/FeaturedCarRental"
import { FeaturedBridalWear } from "@/components/homepage/FeaturedBridalWear"
import { FeaturedWeddingStationery } from "@/components/homepage/FeaturedWeddingStationery"
import { FeaturedCategories } from "@/components/homepage/featured-categories"

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturedCategories />
      <FeaturedVendors />
      <FeaturedPhotographers />
      <FeaturedVenues />
      <FeaturedMakeupArtists />
      <FeaturedDecorators />
      <FeaturedHennaArtists />
      <FeaturedCatering />
      <FeaturedCarRental />
      <FeaturedBridalWear />
      <FeaturedWeddingStationery />
      {/* Other sections */}
    </div>
  )
}
```

## API Response Handling

All components expect the API to return vendor data in this format:

```typescript
interface Vendor {
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
  sponsored: boolean
}
```

## Benefits

1. **Dynamic Content**: All featured sections show real data from your APIs
2. **Consistent Design**: All components use the same design system
3. **Performance**: Loading states provide smooth user experience
4. **Scalability**: Easy to add new vendor types
5. **Maintainability**: Centralized API calls and error handling
6. **User Experience**: Beautiful carousels with proper navigation

## Future Enhancements

- [ ] Add caching for API responses
- [ ] Implement lazy loading for images
- [ ] Add more animation options
- [ ] Support for video thumbnails
- [ ] Advanced filtering options
- [ ] Comparison mode
- [ ] Wishlist functionality 
# Vendor System with API Integration

## Overview

This document describes the complete vendor system with API integration that provides consistent vendor management across the entire application.

## Vendor Types

### Supported Vendor Types
- **Photographer** - Wedding photographers
- **Decorator** - Wedding decorators
- **Henna artist** - Henna artists
- **Makeup artist** - Makeup artists
- **Wedding venue** - Wedding venues and halls
- **Car rental** - Car rental services
- **Catering** - Catering services
- **Bridal wearing** - Bridal wear
- **Wedding Invitations and Stationery** - Wedding stationery

### URL Paths
- `/photographers` → Photographer
- `/decor` → Decorator
- `/henna-artists` → Henna artist
- `/makeup-artists` → Makeup artist
- `/venues` → Wedding venue
- `/car-rental` → Car rental
- `/catering` → Catering
- `/bridal-wear` → Bridal wearing
- `/wedding-stationery` → Wedding Invitations and Stationery

## API Integration

### API Endpoints
```typescript
// Get all businesses
GET {{baseurl}}api/v1/businesses

// Get businesses by vendor type
GET {{baseurl}}api/v1/businesses/businesses-by-vendor?vendorType=Photographer
```

### API Service (`lib/api/vendors.ts`)
```typescript
import { VendorAPI } from '@/lib/api/vendors'

// Get all businesses
const allBusinesses = await VendorAPI.getAllBusinesses()

// Get businesses by vendor type
const photographers = await VendorAPI.getBusinessesByVendorType('Photographer')

// Get featured businesses
const featuredVenues = await VendorAPI.getFeaturedBusinesses('Wedding venue')

// Search businesses
const searchResults = await VendorAPI.searchBusinesses('wedding', 'Photographer')

// Get business by ID
const business = await VendorAPI.getBusinessById('123')
```

## Components

### 1. VendorSearch Component
**Location**: `components/VendorSearch.tsx`

**Features**:
- ✅ Dynamic vendor type detection
- ✅ API integration
- ✅ Filtering and sorting
- ✅ Pagination
- ✅ Loading states
- ✅ Responsive design

**Usage**:
```tsx
<VendorSearch vendorType="photographers" />
```

### 2. VendorCard Component
**Location**: `components/VendorCard.tsx`

**Features**:
- ✅ Unified design across all vendor types
- ✅ API data compatibility
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

## File Structure

```
lib/
├── api/
│   └── vendors.ts          # API service for vendors
├── vendor-types.ts         # Centralized vendor type definitions
├── vendor-utils.ts         # Utility functions
├── types.ts               # TypeScript interfaces
└── global-styles.ts       # Design system

components/
├── VendorSearch.tsx        # Main search component
├── VendorCard.tsx          # Unified vendor card
└── homepage/
    ├── featured-vendors.tsx
    ├── FeaturedVenues.tsx
    └── FeaturedMakeupArtists.tsx

app/(main)/(vendorListings)/
├── photographers/
├── venues/
├── makeup-artists/
├── decor/
├── catering/
├── henna-artists/
├── car-rental/
├── bridal-wear/
└── wedding-stationery/
```

## Implementation Examples

### Homepage Components
```tsx
// Featured vendors with API integration
export function FeaturedVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedVendors = async () => {
      const featuredVendors = await VendorAPI.getFeaturedBusinesses()
      setVendors(featuredVendors)
      setIsLoading(false)
    }
    fetchFeaturedVendors()
  }, [])

  return (
    <Carousel>
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        vendors.map(vendor => (
          <VendorCard
            key={vendor.id}
            id={vendor.id}
            name={vendor.name}
            type={vendor.subBusinessType}
            rating={vendor.rating}
            reviews={vendor.reviews?.length || 0}
            image={vendor.images?.[0]}
            price={vendor.minimumPrice}
            location={vendor.location}
            capacity={vendor.capacity}
            amenities={vendor.amenities}
            sponsored={vendor.sponsored}
          />
        ))
      )}
    </Carousel>
  )
}
```

### Vendor Type Pages
```tsx
// photographers/page.tsx
import VendorSearch from "@/components/VendorSearch"

export default function PhotographersPage() {
  return <VendorSearch vendorType="photographers" />
}
```

## Data Flow

1. **User visits vendor page** (e.g., `/photographers`)
2. **VendorSearch component** detects vendor type from URL
3. **API call** to fetch businesses by vendor type
4. **Data processing** with filtering and sorting
5. **Rendering** with VendorCard components
6. **User interaction** (filtering, sorting, pagination)

## Benefits

1. **Consistency**: All vendor types use the same components
2. **Maintainability**: Centralized vendor type definitions
3. **Scalability**: Easy to add new vendor types
4. **Performance**: Optimized API calls with caching
5. **User Experience**: Consistent UI across all vendor types
6. **Developer Experience**: Clear API structure and type safety

## API Response Format

Expected API response format:
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
  cancellationPolicy: string
  sponsored: boolean
  staff: string[]
  description: string
  packages: Package[]
  video?: string
}
```

## Error Handling

The system includes comprehensive error handling:
- API call failures
- Network timeouts
- Invalid data formats
- Loading states
- Fallback UI components

## Future Enhancements

- [ ] Add caching for API responses
- [ ] Implement real-time search
- [ ] Add advanced filtering options
- [ ] Support for vendor comparisons
- [ ] Add vendor analytics
- [ ] Implement booking system integration
- [ ] Add vendor reviews and ratings
- [ ] Support for vendor portfolios 
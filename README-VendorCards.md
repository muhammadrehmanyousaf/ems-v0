# Unified Vendor Card System

## Overview

This document describes the unified vendor card system that provides consistent, responsive, and modern vendor cards across the entire application.

## Components

### Main Component: `VendorCard`

**Location**: `components/VendorCard.tsx`

**Features**:
- ✅ 100% responsive design
- ✅ Modern UI with hover effects
- ✅ Consistent styling across all pages
- ✅ Support for all vendor types
- ✅ Login state handling
- ✅ Favorite functionality
- ✅ Sponsored badge support
- ✅ Amenities display
- ✅ Capacity information
- ✅ Rating and reviews
- ✅ Price formatting

## Props Interface

```typescript
interface VendorCardProps {
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
```

## Usage Examples

### Basic Usage
```tsx
import VendorCard from "@/components/VendorCard"

<VendorCard
  id="1"
  name="Royal Wedding Photography"
  image="/path/to/image.jpg"
  location="Mumbai"
  rating={4.8}
  reviews={156}
  price={25000}
  type="Photographer"
/>
```

### With All Features
```tsx
<VendorCard
  id="1"
  name="Royal Wedding Photography"
  image="/path/to/image.jpg"
  location="Mumbai"
  rating={4.8}
  reviews={156}
  price={25000}
  type="Photographer"
  capacity={200}
  amenities={["Parking", "Air Conditioning", "Catering"]}
  sponsored={true}
  showBookButton={true}
  showDetails={true}
/>
```

## Design System

### Colors
- Primary: Pink gradient (`from-pink-500 to-purple-600`)
- Secondary: Gray scale for text and backgrounds
- Accent: Yellow for sponsored badges

### Typography
- Title: `font-semibold text-lg`
- Location: `text-gray-600 text-sm`
- Price: `text-lg font-bold text-primary`

### Spacing
- Card padding: `p-4`
- Content spacing: `space-y-3`
- Button padding: `py-2.5`

### Animations
- Hover lift: `y: -4`
- Image scale: `scale-105`
- Button hover: `scale: 1.02`

## Responsive Breakpoints

- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns
- **Large Desktop**: 4 columns

## Deleted Components

The following redundant components have been removed:
- ❌ `components/venue-card.tsx`
- ❌ `components/VenueList.tsx`
- ❌ `components/vendor-card.tsx`

## Updated Components

All components now use the unified `VendorCard`:

### Homepage Components
- ✅ `components/homepage/featured-vendors.tsx`
- ✅ `components/homepage/FeaturedVenues.tsx`
- ✅ `components/homepage/FeaturedMakeupArtists.tsx`

### Search Components
- ✅ `components/VendorSearch.tsx`
- ✅ `components/vendors-component.tsx`
- ✅ `components/VenueSearch/VenueCard.tsx`

### Other Components
- ✅ `components/VenueCard.tsx`

## Global Utilities

### Types (`lib/types.ts`)
- `Vendor` interface
- `VendorCardProps` interface
- `Review`, `Package`, `Venue` interfaces

### Utilities (`lib/vendor-utils.ts`)
- `formatPrice()` - Consistent price formatting
- `formatRating()` - Rating formatting
- `vendorToCardProps()` - Convert vendor data to card props
- `sortVendors()` - Sort vendors by different criteria
- `filterVendorsByType()` - Filter vendors by type

### Styles (`lib/global-styles.ts`)
- Design tokens
- Color palettes
- Spacing scales
- Animation durations

## API Integration

The vendor card system is designed to work with your existing APIs. Simply pass the vendor data to the `VendorCard` component:

```tsx
// Example with API data
const vendors = await fetchVendors()

vendors.map(vendor => (
  <VendorCard
    key={vendor.id}
    id={vendor.id}
    name={vendor.name}
    image={vendor.images[0]}
    location={vendor.city}
    rating={vendor.rating}
    reviews={vendor.reviews.length}
    price={vendor.minimumPrice}
    type={vendor.subBusinessType}
    capacity={vendor.capacity}
    amenities={vendor.amenities}
    sponsored={vendor.sponsored}
  />
))
```

## Benefits

1. **Consistency**: All vendor cards look and behave the same
2. **Maintainability**: Single source of truth for vendor card design
3. **Responsiveness**: Works perfectly on all screen sizes
4. **Performance**: Optimized with proper image loading
5. **Accessibility**: Proper ARIA labels and keyboard navigation
6. **Modern UI**: Beautiful animations and hover effects
7. **Flexibility**: Configurable props for different use cases

## Future Enhancements

- [ ] Add loading skeletons
- [ ] Implement lazy loading for images
- [ ] Add more animation options
- [ ] Support for video thumbnails
- [ ] Advanced filtering options
- [ ] Comparison mode
- [ ] Wishlist functionality 
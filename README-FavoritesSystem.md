# Favorites System Implementation

This document describes the implementation of the favorites system for vendors and venues in the EMS application.

## Overview

The favorites system allows users to:
- Add vendors/venues to their favorites list
- Remove items from favorites
- View all their favorited items
- Filter favorites by type (vendor/venue)
- Toggle favorite status with heart icons

## API Endpoints

The system uses the following API endpoints:

1. **GET** `{{baseurl}}/api/v1/favorites` - Get all favorites for the current user
2. **POST** `{{baseurl}}/api/v1/favorites` - Create a new favorite
3. **DELETE** `{{baseurl}}/api/v1/favorites/{id}` - Delete a favorite by ID

## Components Updated

### 1. VendorCard Component (`components/VendorCard.tsx`)
- Added heart icon that shows favorite status
- Heart is red when favorited, gray when not
- Clicking heart toggles favorite status
- Integrates with favorites API
- Shows login alert if user is not authenticated

### 2. Favorites Page (`app/(main)/user/favorites/page.tsx`)
- Displays all user favorites
- Filter tabs for All/Vendors/Venues
- Real-time data from API
- Error handling and loading states
- Refresh functionality
- Remove favorite functionality

## New Files Created

### 1. Favorites API Service (`lib/api/favorites.ts`)
```typescript
class FavoritesAPI {
  async getFavorites(): Promise<Favorite[]>
  async createFavorite(data: CreateFavoriteRequest): Promise<Favorite>
  async deleteFavorite(id: string): Promise<void>
  async isVendorFavorited(vendorId: string): Promise<boolean>
  async getFavoriteByVendorId(vendorId: string): Promise<Favorite | null>
}
```

### 2. Favorites Hook (`hooks/use-favorites.ts`)
```typescript
export const useFavorites = () => {
  const {
    favorites,           // Array of favorite items
    isLoading,          // Loading state
    error,              // Error state
    addFavorite,        // Add new favorite
    removeFavorite,     // Remove favorite
    toggleFavorite,     // Toggle favorite status
    isFavorited,        // Check if item is favorited
    refreshFavorites,   // Refresh favorites list
  } = useFavorites()
}
```

## Data Structure

### Favorite Interface
```typescript
interface Favorite {
  id: string;
  userId: string;
  vendorId: string;
  vendorType: 'vendor' | 'venue';
  vendorName: string;
  vendorImage: string;
  vendorLocation: string;
  vendorRating: number;
  vendorCategory: string;
  createdAt: string;
  updatedAt: string;
}
```

### Create Favorite Request
```typescript
interface CreateFavoriteRequest {
  vendorId: string;
  vendorType: 'vendor' | 'venue';
  vendorName: string;
  vendorImage: string;
  vendorLocation: string;
  vendorRating: number;
  vendorCategory: string;
}
```

## Usage Examples

### Adding to Favorites
```typescript
const { toggleFavorite } = useFavorites();

const handleFavoriteClick = async () => {
  const favoriteData = {
    vendorId: "123",
    vendorType: "vendor",
    vendorName: "Photography Studio",
    vendorImage: "/image.jpg",
    vendorLocation: "Downtown",
    vendorRating: 4.5,
    vendorCategory: "Photography"
  };
  
  await toggleFavorite(favoriteData);
};
```

### Checking Favorite Status
```typescript
const { isFavorited } = useFavorites();
const isFavorite = isFavorited("123"); // Returns boolean
```

### Removing from Favorites
```typescript
const { removeFavorite } = useFavorites();
await removeFavorite("favorite-id-123");
```

## Features

### ✅ Implemented
- [x] Add/Remove favorites via heart icon
- [x] Real-time favorite status updates
- [x] Favorites page with filtering
- [x] API integration with error handling
- [x] Loading states and user feedback
- [x] Authentication checks
- [x] Toast notifications for actions
- [x] Responsive design

### 🔄 State Management
- Favorites are loaded on component mount
- Real-time updates when adding/removing
- Optimistic UI updates with error handling
- Persistent state across page navigation

### 🎨 UI/UX Features
- Heart icon changes color based on favorite status
- Loading states during API calls
- Error messages with retry options
- Filter tabs for different favorite types
- Responsive grid layout
- Hover effects and animations

## Authentication

The favorites system requires user authentication:
- Users must be logged in to add/remove favorites
- Login alerts are shown for unauthenticated users
- API calls include Bearer token authentication
- Graceful fallbacks for authentication errors

## Error Handling

- Network errors are caught and displayed
- User-friendly error messages
- Retry mechanisms for failed operations
- Fallback states for loading failures
- Console logging for debugging

## Performance Considerations

- Favorites are cached in local state
- Optimistic updates for better UX
- Debounced API calls where appropriate
- Efficient filtering and mapping operations

## Future Enhancements

Potential improvements for the favorites system:
- [ ] Bulk operations (add/remove multiple)
- [ ] Favorites sharing
- [ ] Favorites categories/tags
- [ ] Export favorites list
- [ ] Favorites analytics
- [ ] Offline support
- [ ] Push notifications for favorite updates

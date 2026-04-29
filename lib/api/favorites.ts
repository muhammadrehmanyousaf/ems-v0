import axios from 'axios'
import { BACKEND_URL } from '@/lib/backend-url'

// API endpoints
const API_ENDPOINTS = {
  GET_FAVORITES: `${BACKEND_URL}api/v1/favorites`,
  CREATE_FAVORITE: `${BACKEND_URL}api/v1/favorites`,
  DELETE_FAVORITE: (businessId: string | number) => `${BACKEND_URL}api/v1/favorites/${businessId}`,
} as const

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || '';
  }
  return '';
};

// Helper function to get user ID
const getUserId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_id') || '';
  }
  return '';
};

// Types for API responses
interface FavoriteBusiness {
  id: number;
  userId: number;
  businessId: number;
  createdAt: string;
  updatedAt: string;
  business: {
    id: number;
    name: string;
    city: string;
    subArea: string;
    minimumPrice: number;
    description: string;
    images: string[];
    subBusinessType: string;
    amenities: string[];
    maxCapacity: number;
    minCapacity: number;
    [key: string]: any;
  };
}

interface FavoritesResponse {
  status: boolean;
  message: string;
  data: FavoriteBusiness[];
}

interface CreateFavoriteResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    userId: number;
    businessId: number;
    createdAt: string;
    updatedAt: string;
  };
}

// API service for favorites
export class FavoritesAPI {
  // Get all user favorites (IDs only)
  static async getUserFavorites(): Promise<number[]> {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await axios.get(API_ENDPOINTS.GET_FAVORITES, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      // Response shape: { status, data: { results: [...], meta: {} } }
      const rows: FavoriteBusiness[] = response.data?.data?.results ?? [];
      return rows.map(f => f.businessId);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  }

  // Get full vendor data for all favorites (uses embedded business from the same endpoint)
  static async getFavoriteVendors(): Promise<any[]> {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await axios.get(API_ENDPOINTS.GET_FAVORITES, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      // Response shape: { status, data: { results: [...], meta: {} } }
      const rows: FavoriteBusiness[] = response.data?.data?.results ?? [];
      return rows
        .filter(f => f.business)
        .map(f => {
          const b: any = f.business;
          const images = Array.isArray(b.images) ? b.images : (b.images ? [b.images] : []);

          // subBusinessType is a PostgreSQL array — unwrap to first string
          const rawType = b.subBusinessType;
          const type = Array.isArray(rawType) ? (rawType[0] || '') : (rawType || '');

          // Derive price: minimumPrice first, then min package price
          const pkgPrices = Array.isArray(b.packages)
            ? b.packages.map((p: any) => Number(p.price)).filter((p: number) => p > 0)
            : [];
          const price = b.minimumPrice || (pkgPrices.length > 0 ? Math.min(...pkgPrices) : null) || null;

          const rating = Number(b.rating ?? 0) || 0;
          const reviewCount =
            Number(b.reviewCount ?? (Array.isArray(b.reviews) ? b.reviews.length : 0)) || 0;

          return {
            ...b,
            id: f.businessId,
            type,
            location: b.subArea || b.city || '',
            price,
            rating,
            reviewCount,
            reviews: Array.isArray(b.reviews) ? b.reviews : [],
            amenities: Array.isArray(b.amenities) ? b.amenities : [],
            images,
            sponsored: b.sponsored ?? false,
          };
        });
    } catch (error) {
      console.error('Error fetching favorite vendors:', error);
      return [];
    }
  }

  // Add business to favorites
  static async addToFavorites(businessId: string | number): Promise<boolean> {
    try {
      const token = getAuthToken();
      
      if (!token) {
        return false;
      }

      const response = await axios.post<CreateFavoriteResponse>(API_ENDPOINTS.CREATE_FAVORITE, {
        businessId: businessId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.status) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  // Remove business from favorites
  static async removeFromFavorites(businessId: string | number): Promise<boolean> {
    try {
      const token = getAuthToken();
      
      if (!token) {
        return false;
      }

      const response = await axios.delete(API_ENDPOINTS.DELETE_FAVORITE(businessId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  // Check if business is in favorites
  static async isBusinessFavorited(businessId: string | number, favoritesList?: number[]): Promise<boolean> {
    try {
      // If favorites list is provided, use it for quick lookup
      if (favoritesList) {
        return favoritesList.includes(Number(businessId));
      }
      
      // Otherwise, fetch from API
      const favorites = await this.getUserFavorites();
      return favorites.includes(Number(businessId));
    } catch (error) {
      console.error('Error checking if business is favorited:', error);
      return false;
    }
  }

  // Toggle favorite status
  static async toggleFavorite(businessId: string | number): Promise<boolean> {
    try {
      const isFavorited = await this.isBusinessFavorited(businessId);
      
      if (isFavorited) {
        return await this.removeFromFavorites(businessId);
      } else {
        return await this.addToFavorites(businessId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }
}

// Hook for using favorites data (for React components)
export const useFavoritesData = () => {
  return {
    getUserFavorites: FavoritesAPI.getUserFavorites,
    addToFavorites: FavoritesAPI.addToFavorites,
    removeFromFavorites: FavoritesAPI.removeFromFavorites,
    isBusinessFavorited: FavoritesAPI.isBusinessFavorited,
    toggleFavorite: FavoritesAPI.toggleFavorite,
  }
}

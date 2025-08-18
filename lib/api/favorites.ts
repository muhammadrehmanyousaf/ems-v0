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
  // Get all user favorites
  static async getUserFavorites(): Promise<number[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log('❌ No auth token found for favorites');
        return [];
      }

      console.log(`🌐 Calling API: ${API_ENDPOINTS.GET_FAVORITES}`);
      const response = await axios.get<FavoritesResponse>(API_ENDPOINTS.GET_FAVORITES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ Favorites API Response:`, response.data);
      
      if (response.data.status && response.data.data) {
        // Extract business IDs from the favorites
        const favoriteBusinessIds = response.data.data.map(favorite => favorite.businessId);
        console.log(`💖 Found ${favoriteBusinessIds.length} favorite businesses:`, favoriteBusinessIds);
        return favoriteBusinessIds;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching user favorites:', error);
      return [];
    }
  }

  // Add business to favorites
  static async addToFavorites(businessId: string | number): Promise<boolean> {
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.log('❌ No auth token found');
        return false;
      }

      console.log(`🌐 Adding business ${businessId} to favorites`);
      const response = await axios.post<CreateFavoriteResponse>(API_ENDPOINTS.CREATE_FAVORITE, {
        businessId: businessId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ Added to favorites:`, response.data);
      
      if (response.data.status) {
        console.log(`💖 Successfully added business ${businessId} to favorites`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      return false;
    }
  }

  // Remove business from favorites
  static async removeFromFavorites(businessId: string | number): Promise<boolean> {
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.log('❌ No auth token found');
        return false;
      }

      console.log(`🌐 Removing business ${businessId} from favorites`);
      const response = await axios.delete(API_ENDPOINTS.DELETE_FAVORITE(businessId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ Removed from favorites:`, response.data);
      return true;
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
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
      console.error('❌ Error checking if business is favorited:', error);
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
      console.error('❌ Error toggling favorite:', error);
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

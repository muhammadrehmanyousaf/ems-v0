import { BACKEND_URL } from '../backend-url';

export interface Favorite {
  id: string;
  userId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    type: string;
    category: string;
    location: string;
    rating: number;
    image: string;
    description: string;
  };
}

export interface CreateFavoriteRequest {
  businessId: string;
}

class FavoritesAPI {
  private baseURL = `${BACKEND_URL}api/v1/favorites`;

  // Get all favorites for the current user
  async getFavorites(): Promise<Favorite[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Favorites API response:', responseData); // Debug log
      
      // Handle backend response structure: { success, message, data }
      const favorites = responseData.data || responseData;
      console.log('Extracted favorites:', favorites); // Debug log
      
      if (!Array.isArray(favorites)) {
        console.warn('Favorites is not an array, returning empty array. Data:', favorites);
        return [];
      }
      
      return favorites;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  // Create a new favorite
  async createFavorite(favoriteData: CreateFavoriteRequest): Promise<Favorite | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Creating favorite with data:', favoriteData);
      console.log('Using token:', token ? 'Token exists' : 'No token');

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(favoriteData),
      });

      console.log('Create favorite response status:', response.status);
      console.log('Create favorite response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create favorite error response:', errorText);
        
        // Try to parse the error response for better error messages
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            // Don't throw error, just return null
            console.log('API returned error:', errorData.message);
            return null;
          }
        } catch (parseError) {
          // If parsing fails, just return null
          console.log('Could not parse error response');
        }
        
        // Don't throw error, just return null
        console.log('API request failed, returning null');
        return null;
      }

      const responseData = await response.json();
      console.log('Create favorite success response:', responseData);
      
      // Handle backend response structure: { success, message, data }
      return responseData.data || responseData;
    } catch (error) {
      console.error('Error creating favorite:', error);
      throw error;
    }
  }

  // Delete a favorite by ID
  async deleteFavorite(favoriteId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete favorite: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting favorite:', error);
      throw error;
    }
  }

  // Check if a business is favorited by the current user
  async isBusinessFavorited(businessId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(favorite => favorite.businessId === businessId);
    } catch (error) {
      console.error('Error checking if business is favorited:', error);
      return false;
    }
  }

  // Force refresh favorites state (useful for synchronization)
  async refreshFavoritesState(): Promise<Favorite[]> {
    try {
      // Clear any cached state and fetch fresh data
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh favorites: ${response.statusText}`);
      }

      const responseData = await response.json();
      const favorites = responseData.data || responseData;
      
      if (!Array.isArray(favorites)) {
        return [];
      }
      
      return favorites;
    } catch (error) {
      console.error('Error refreshing favorites state:', error);
      throw error;
    }
  }

  // Get favorite by business ID
  async getFavoriteByBusinessId(businessId: string): Promise<Favorite | null> {
    try {
      const favorites = await this.getFavorites();
      return favorites.find(favorite => favorite.businessId === businessId) || null;
    } catch (error) {
      console.error('Error getting favorite by business ID:', error);
      return null;
    }
  }
}

export const favoritesAPI = new FavoritesAPI();
export default favoritesAPI;

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FavoritesAPI } from '@/lib/api/favorites';

interface FavoritesContextType {
  favorites: number[];
  isLoading: boolean;
  refreshFavorites: () => Promise<void>;
  isFavorited: (businessId: string | number) => boolean;
  addToFavorites: (businessId: string | number) => Promise<boolean>;
  removeFromFavorites: (businessId: string | number) => Promise<boolean>;
  toggleFavorite: (businessId: string | number) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && 
    localStorage.getItem('user_id') && 
    localStorage.getItem('auth_token');

  // Load favorites on mount and when login status changes
  useEffect(() => {
    if (isLoggedIn) {
      loadFavorites();
    } else {
      // Clear favorites when user logs out
      setFavorites([]);
    }
  }, [isLoggedIn]);

  // Listen for login/logout events to refresh favorites
  useEffect(() => {
    const handleStorageChange = () => {
      const currentIsLoggedIn = typeof window !== 'undefined' && 
        localStorage.getItem('user_id') && 
        localStorage.getItem('auth_token');
      
      if (currentIsLoggedIn && favorites.length === 0) {
        loadFavorites();
      } else if (!currentIsLoggedIn) {
        setFavorites([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [favorites.length]);

  const loadFavorites = async () => {
    if (!isLoggedIn) return;
    
    // Check if we have cached data that's still valid
    const now = Date.now();
    if (favorites.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('💖 Using cached favorites data');
      return;
    }
    
    setIsLoading(true);
    try {
      const userFavorites = await FavoritesAPI.getUserFavorites();
      setFavorites(userFavorites);
      setLastFetchTime(now);
      console.log('💖 Loaded favorites:', userFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  const isFavorited = (businessId: string | number): boolean => {
    return favorites.includes(Number(businessId));
  };

  const addToFavorites = async (businessId: string | number): Promise<boolean> => {
    try {
      const success = await FavoritesAPI.addToFavorites(businessId);
      if (success) {
        setFavorites(prev => [...prev, Number(businessId)]);
        console.log(`💖 Added business ${businessId} to favorites`);
      }
      return success;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  };

  const removeFromFavorites = async (businessId: string | number): Promise<boolean> => {
    try {
      const success = await FavoritesAPI.removeFromFavorites(businessId);
      if (success) {
        setFavorites(prev => prev.filter(id => id !== Number(businessId)));
        console.log(`💖 Removed business ${businessId} from favorites`);
      }
      return success;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  };

  const toggleFavorite = async (businessId: string | number): Promise<boolean> => {
    const isCurrentlyFavorited = isFavorited(businessId);
    
    if (isCurrentlyFavorited) {
      return await removeFromFavorites(businessId);
    } else {
      return await addToFavorites(businessId);
    }
  };

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    refreshFavorites,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

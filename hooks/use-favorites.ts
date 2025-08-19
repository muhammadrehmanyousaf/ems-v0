'use client'

import { useState, useEffect, useCallback } from 'react'
import { FavoritesAPI } from '@/lib/api/favorites'

// Types
interface UseFavoritesReturn {
  favorites: number[]
  isLoading: boolean
  isFavorited: (businessId: string | number) => boolean
  toggleFavorite: (businessId: string | number) => Promise<boolean>
  refreshFavorites: () => Promise<void>
}

// Cache constants
const FAVORITES_CACHE_KEY = 'user_favorites_cache'
const FAVORITES_CACHE_TIMESTAMP_KEY = 'user_favorites_cache_timestamp'
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

// Check if user is authenticated
const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const userId = localStorage.getItem('user_id')
  const token = localStorage.getItem('auth_token')
  return !!(userId && token)
}

// Get cached favorites
const getCachedFavorites = (): number[] | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const timestamp = localStorage.getItem(FAVORITES_CACHE_TIMESTAMP_KEY)
    const cached = localStorage.getItem(FAVORITES_CACHE_KEY)
    
    if (timestamp && cached) {
      const now = Date.now()
      const cacheTime = parseInt(timestamp)
      
      if (now - cacheTime < CACHE_DURATION) {
        const favorites = JSON.parse(cached)
        console.log('💾 Using cached favorites:', favorites)
        return favorites
      }
    }
  } catch (error) {
    console.error('❌ Error reading cached favorites:', error)
  }
  
  return null
}

// Set cached favorites
const setCachedFavorites = (favorites: number[]) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favorites))
    localStorage.setItem(FAVORITES_CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('❌ Error caching favorites:', error)
  }
}

// Clear cached favorites
const clearCachedFavorites = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(FAVORITES_CACHE_KEY)
    localStorage.removeItem(FAVORITES_CACHE_TIMESTAMP_KEY)
  } catch (error) {
    console.error('❌ Error clearing cached favorites:', error)
  }
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load favorites from API with caching
  const loadFavorites = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated()) {
      setFavorites([])
      clearCachedFavorites()
      return
    }

    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedFavorites()
      if (cached) {
        setFavorites(cached)
        return
      }
    }

    setIsLoading(true)
    try {
      const userFavorites = await FavoritesAPI.getUserFavorites()
      setFavorites(userFavorites)
      setCachedFavorites(userFavorites)
      console.log('💖 Loaded favorites from API:', userFavorites)
    } catch (error) {
      console.error('❌ Error loading favorites:', error)
      setFavorites([])
      clearCachedFavorites()
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize favorites on mount
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_id' || e.key === 'auth_token') {
        if (isAuthenticated()) {
          loadFavorites()
        } else {
          setFavorites([])
          clearCachedFavorites()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadFavorites])

  // Check if business is favorited
  const isFavorited = useCallback((businessId: string | number): boolean => {
    return favorites.includes(Number(businessId))
  }, [favorites])

  // Toggle favorite with optimistic update
  const toggleFavorite = useCallback(async (businessId: string | number): Promise<boolean> => {
    if (!isAuthenticated()) {
      console.log('❌ User not authenticated')
      return false
    }

    const businessIdNum = Number(businessId)
    const isCurrentlyFavorited = isFavorited(businessId)
    
    // Optimistic update
    if (isCurrentlyFavorited) {
      setFavorites(prev => prev.filter(id => id !== businessIdNum))
    } else {
      setFavorites(prev => [...prev, businessIdNum])
    }
    
    try {
      let success = false
      
      if (isCurrentlyFavorited) {
        success = await FavoritesAPI.removeFromFavorites(businessId)
        if (success) {
          console.log(`💖 Removed business ${businessId} from favorites`)
          setCachedFavorites(favorites.filter(id => id !== businessIdNum))
        } else {
          // Revert optimistic update on failure
          setFavorites(prev => [...prev, businessIdNum])
        }
      } else {
        success = await FavoritesAPI.addToFavorites(businessId)
        if (success) {
          console.log(`💖 Added business ${businessId} to favorites`)
          setCachedFavorites([...favorites, businessIdNum])
        } else {
          // Revert optimistic update on failure
          setFavorites(prev => prev.filter(id => id !== businessIdNum))
        }
      }
      
      return success
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
      
      // Revert optimistic update on error
      if (isCurrentlyFavorited) {
        setFavorites(prev => [...prev, businessIdNum])
      } else {
        setFavorites(prev => prev.filter(id => id !== businessIdNum))
      }
      
      return false
    }
  }, [favorites, isFavorited])

  // Refresh favorites (force refresh from API)
  const refreshFavorites = useCallback(async () => {
    await loadFavorites(true)
  }, [loadFavorites])

  return {
    favorites,
    isLoading,
    isFavorited,
    toggleFavorite,
    refreshFavorites,
  }
}

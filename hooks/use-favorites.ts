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

// Cache TTL
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

// Cache keys are scoped per user so a logout/login doesn't surface
// a previous user's favorite IDs.
const cacheKey = (userId: string) => `user_favorites_cache:${userId}`
const cacheTimestampKey = (userId: string) =>
  `user_favorites_cache_timestamp:${userId}`

const getUserId = (): string => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('user_id') || ''
}

// Check if user is authenticated
const isAuthenticated = (): boolean => {
  const userId = getUserId()
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('auth_token')
  return !!(userId && token)
}

// Get cached favorites (only for the current user)
const getCachedFavorites = (): number[] | null => {
  if (typeof window === 'undefined') return null
  const userId = getUserId()
  if (!userId) return null

  try {
    const timestamp = localStorage.getItem(cacheTimestampKey(userId))
    const cached = localStorage.getItem(cacheKey(userId))

    if (timestamp && cached) {
      const now = Date.now()
      const cacheTime = parseInt(timestamp)

      if (now - cacheTime < CACHE_DURATION) {
        return JSON.parse(cached)
      }
    }
  } catch (error) {
    console.error('Error reading cached favorites:', error)
  }

  return null
}

// Set cached favorites for the current user
const setCachedFavorites = (favorites: number[]) => {
  if (typeof window === 'undefined') return
  const userId = getUserId()
  if (!userId) return

  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(favorites))
    localStorage.setItem(cacheTimestampKey(userId), Date.now().toString())
  } catch (error) {
    console.error('Error caching favorites:', error)
  }
}

// Clear all favorites cache entries (used on logout — we don't know which
// user just logged out, so we wipe every scoped key plus the legacy ones).
const clearCachedFavorites = () => {
  if (typeof window === 'undefined') return

  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (
        k &&
        (k.startsWith('user_favorites_cache:') ||
          k.startsWith('user_favorites_cache_timestamp:') ||
          k === 'user_favorites_cache' ||
          k === 'user_favorites_cache_timestamp')
      ) {
        keys.push(k)
      }
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch (error) {
    console.error('Error clearing cached favorites:', error)
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
    } catch (error) {
      console.error('Error loading favorites:', error)
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

  // Listen for authentication changes (cross-tab via 'storage', same-tab via
  // the custom events fired by UserContext.login/logout).
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_id' || e.key === 'auth_token') {
        if (isAuthenticated()) {
          loadFavorites(true)
        } else {
          setFavorites([])
          clearCachedFavorites()
        }
      }
    }

    const handleLogin = () => {
      // A new user just logged in — drop any previously-cached IDs and refetch.
      clearCachedFavorites()
      loadFavorites(true)
    }

    const handleLogout = () => {
      setFavorites([])
      clearCachedFavorites()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userLogin', handleLogin as EventListener)
    window.addEventListener('user-login', handleLogin as EventListener)
    window.addEventListener('userLogout', handleLogout)
    window.addEventListener('user-logout', handleLogout)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userLogin', handleLogin as EventListener)
      window.removeEventListener('user-login', handleLogin as EventListener)
      window.removeEventListener('userLogout', handleLogout)
      window.removeEventListener('user-logout', handleLogout)
    }
  }, [loadFavorites])

  // Check if business is favorited
  const isFavorited = useCallback((businessId: string | number): boolean => {
    return favorites.includes(Number(businessId))
  }, [favorites])

  // Toggle favorite with optimistic update
  const toggleFavorite = useCallback(async (businessId: string | number): Promise<boolean> => {
    if (!isAuthenticated()) {
      console.log('User not authenticated')
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
          // Persist via functional update so we read the latest state, not a
          // stale closure value.
          setFavorites((prev) => {
            const next = prev.filter((id) => id !== businessIdNum)
            setCachedFavorites(next)
            return next
          })
        } else {
          // Revert optimistic update on failure
          setFavorites((prev) =>
            prev.includes(businessIdNum) ? prev : [...prev, businessIdNum]
          )
        }
      } else {
        success = await FavoritesAPI.addToFavorites(businessId)
        if (success) {
          setFavorites((prev) => {
            const next = prev.includes(businessIdNum)
              ? prev
              : [...prev, businessIdNum]
            setCachedFavorites(next)
            return next
          })
        } else {
          // Revert optimistic update on failure
          setFavorites((prev) => prev.filter((id) => id !== businessIdNum))
        }
      }

      return success
    } catch (error) {
      console.error('Error toggling favorite:', error)
      
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

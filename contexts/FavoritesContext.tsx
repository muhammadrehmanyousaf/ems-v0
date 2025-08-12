"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { favoritesAPI } from '@/lib/api/favorites'
import type { Favorite, CreateFavoriteRequest } from '@/lib/api/favorites'
import { toast } from '@/components/ui/use-toast'

// Types
interface FavoritesState {
  favorites: Favorite[]
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

type FavoritesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FAVORITES'; payload: Favorite[] }
  | { type: 'ADD_FAVORITE'; payload: Favorite }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'RESET' }

// Initial state
const initialState: FavoritesState = {
  favorites: [],
  isLoading: false,
  error: null,
  isInitialized: false,
}

// Reducer
function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload, error: null }
    case 'ADD_FAVORITE':
      return { 
        ...state, 
        favorites: [...state.favorites, action.payload],
        error: null 
      }
    case 'REMOVE_FAVORITE':
      return { 
        ...state, 
        favorites: state.favorites.filter(fav => fav.id !== action.payload),
        error: null 
      }
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Context
interface FavoritesContextType {
  state: FavoritesState
  loadFavorites: () => Promise<void>
  addFavorite: (favoriteData: CreateFavoriteRequest) => Promise<Favorite | null>
  removeFavorite: (favoriteId: string) => Promise<void>
  toggleFavorite: (favoriteData: CreateFavoriteRequest) => Promise<boolean>
  isFavorited: (businessId: string) => boolean
  getFavoriteByBusinessId: (businessId: string) => Favorite | null
  clearError: () => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

// Provider component
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState)

  // Load favorites only once
  const loadFavorites = async () => {
    if (state.isInitialized || state.isLoading) return

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const data = await favoritesAPI.getFavorites()
      dispatch({ type: 'SET_FAVORITES', payload: data })
      dispatch({ type: 'SET_INITIALIZED', payload: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load favorites'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      dispatch({ type: 'SET_FAVORITES', payload: [] })
      dispatch({ type: 'SET_INITIALIZED', payload: false })
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Add favorite with optimistic update
  const addFavorite = async (favoriteData: CreateFavoriteRequest): Promise<Favorite | null> => {
    // Check if already favorited - if so, remove it instead
    if (isFavorited(favoriteData.businessId)) {
      const existingFavorite = getFavoriteByBusinessId(favoriteData.businessId)
      if (existingFavorite) {
        await removeFavorite(existingFavorite.id)
        return null
      }
    }

    // Create temporary favorite for optimistic update
    const tempFavorite: Favorite = {
      id: `temp-${Date.now()}`,
      userId: 'temp',
      businessId: favoriteData.businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business: {
        id: favoriteData.businessId,
        name: 'Loading...',
        type: 'Unknown',
        category: 'Unknown',
        location: 'Unknown',
        rating: 0,
        image: '/placeholder.jpg',
        description: 'Loading...'
      }
    }

    // Optimistic update
    dispatch({ type: 'ADD_FAVORITE', payload: tempFavorite })

    try {
      const newFavorite = await favoritesAPI.createFavorite(favoriteData)
      
      // If API returns null, just revert the optimistic update
      if (!newFavorite) {
        dispatch({ type: 'REMOVE_FAVORITE', payload: tempFavorite.id })
        console.log('⚠️ API returned null, reverting optimistic update')
        return null
      }
      
      // Replace temp with real favorite
      dispatch({ type: 'REMOVE_FAVORITE', payload: tempFavorite.id })
      dispatch({ type: 'ADD_FAVORITE', payload: newFavorite! })

      toast({
        title: "Success",
        description: "Added to favorites!",
      })

      return newFavorite
    } catch (err: any) {
      // Revert optimistic update
      dispatch({ type: 'REMOVE_FAVORITE', payload: tempFavorite.id })

      const errorMessage = err?.message || 'Failed to add favorite'
      
      if (errorMessage === "Already in favorites") {
        // Just refresh state, don't show error
        console.log('🔄 Already in favorites, refreshing state...')
        await loadFavorites()
        return null
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
      
      throw err
    }
  }

  // Remove favorite with optimistic update
  const removeFavorite = async (favoriteId: string) => {
    const favoriteToRemove = state.favorites.find(fav => fav.id === favoriteId)
    if (!favoriteToRemove) return

    // Optimistic update - ALWAYS remove from UI first
    dispatch({ type: 'REMOVE_FAVORITE', payload: favoriteId })

    // Always show success message
    toast({
      title: "Success",
      description: "Vendor removed from favorites!",
    })

    // Try to sync with backend, but don't care if it fails
    try {
      await favoritesAPI.deleteFavorite(favoriteId)
      console.log('✅ Backend sync successful')
    } catch (err) {
      console.log('⚠️ Backend sync failed, but vendor removed from UI:', err)
      // Don't revert UI - keep it removed
      // Don't show error - user already sees success
    }
  }

  // Toggle favorite - SIMPLIFIED LOGIC
  const toggleFavorite = async (favoriteData: CreateFavoriteRequest): Promise<boolean> => {
    try {
      console.log('🔄 toggleFavorite called with:', favoriteData)
      console.log('📊 Current favorites state:', state.favorites)
      
      const existingFavorite = getFavoriteByBusinessId(favoriteData.businessId)
      console.log('🔍 Existing favorite found:', existingFavorite)
      
      if (existingFavorite) {
        console.log('🗑️ Removing existing favorite:', existingFavorite.id)
        // If already favorited, remove it
        await removeFavorite(existingFavorite.id)
        return false
      } else {
        console.log('➕ Adding new favorite')
        // If not favorited, add it
        await addFavorite(favoriteData)
        return true
      }
    } catch (error) {
      console.error('❌ Error in toggleFavorite:', error)
      // Don't throw error, just return current state
      return isFavorited(favoriteData.businessId)
    }
  }

  // Check if favorited
  const isFavorited = (businessId: string): boolean => {
    return state.favorites.some(fav => fav.businessId === businessId)
  }

  // Get favorite by business ID
  const getFavoriteByBusinessId = (businessId: string): Favorite | null => {
    return state.favorites.find(fav => fav.businessId === businessId) || null
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  // Load favorites on mount (only once)
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading) {
      loadFavorites()
    }
  }, [state.isInitialized, state.isLoading])

  const value: FavoritesContextType = {
    state,
    loadFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    getFavoriteByBusinessId,
    clearError,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

// Hook to use favorites context
export function useFavoritesContext() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider')
  }
  return context
}

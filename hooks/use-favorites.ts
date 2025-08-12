"use client"

import { useFavoritesContext } from "@/contexts/FavoritesContext"

// Backward compatibility hook - now uses the efficient context system
export const useFavorites = () => {
  const context = useFavoritesContext()
  
  return {
    favorites: context.state.favorites,
    isLoading: context.state.isLoading,
    error: context.state.error,
    isInitialized: context.state.isInitialized,
    isFavorited: context.isFavorited,
    getFavoriteByBusinessId: context.getFavoriteByBusinessId,
    addFavorite: context.addFavorite,
    removeFavorite: context.removeFavorite,
    toggleFavorite: context.toggleFavorite,
    forceRefresh: context.loadFavorites,
    clearError: context.clearError,
  }
}

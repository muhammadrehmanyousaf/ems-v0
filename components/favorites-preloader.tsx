'use client'

import { useEffect, useState } from 'react'
import { useFavorites } from '@/hooks/use-favorites'
import { useVendors } from '@/hooks/use-vendors'
import VendorCard from '@/components/VendorCard'
import { Heart, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Vendor } from '@/lib/types'

interface FavoritesPreloaderProps {
  children: React.ReactNode
}

export function FavoritesPreloader({ children }: FavoritesPreloaderProps) {
  const { favorites, isLoading: favoritesLoading } = useFavorites()
  const { data: allVendors = [], isLoading: vendorsLoading } = useVendors()
  const [showCachedContent, setShowCachedContent] = useState(false)

  // Show cached content if we have favorites but vendors are still loading
  useEffect(() => {
    if (favorites.length > 0 && !favoritesLoading && vendorsLoading) {
      setShowCachedContent(true)
    } else if (!vendorsLoading) {
      setShowCachedContent(false)
    }
  }, [favorites, favoritesLoading, vendorsLoading])

  if (showCachedContent) {
    // Show cached favorites while vendors load
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-100 flex items-center">
                  <Heart className="w-8 h-8 text-purple-500 mr-3" />
                  My Favorites
                </h1>
                <p className="text-gray-600 dark:text-neutral-400 mt-2">
                  {favorites.length} {favorites.length === 1 ? 'vendor' : 'vendors'} saved
                  <span className="ml-2 text-sm text-blue-600">(Loading vendor details...)</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          <Card className="text-center py-12 dark:bg-neutral-900 dark:border-neutral-800">
            <CardContent>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Loading vendor details...</h3>
              <p className="text-gray-600 dark:text-neutral-400">
                Found {favorites.length} favorites, loading vendor information...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

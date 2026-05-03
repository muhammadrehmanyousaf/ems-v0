"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import VendorDetailsMobile from "@/components/VendorDetails/VendorDetailsMobile"
import type { Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"

export default function VenueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [venue, setVenue] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchVenueDetails = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid venue ID')
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch venue details from API
        const venueData = await VendorAPI.getBusinessById(id)
        
        if (venueData) {
          setVenue(venueData)
        } else {
          throw new Error('Venue not found')
        }
      } catch (err) {
        // Try to get from localStorage as fallback
        try {
          const storedVenues = localStorage.getItem('all_vendors')
          if (storedVenues) {
            const parsedVenues = JSON.parse(storedVenues)
            const storedVenue = parsedVenues.find((v: Vendor) => v.id.toString() === id)
            if (storedVenue) {
              setVenue(storedVenue)
              return
            }
          }
        } catch (localStorageError) {
        }
        
        setError(err instanceof Error ? err.message : 'Failed to load venue details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVenueDetails()
  }, [id, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-bridal-gold-dark mx-auto mb-4" />
          <p className="text-neutral-600 text-lg">Loading venue details...</p>
          <p className="text-sm text-neutral-500 mt-2">Please wait while we fetch the venue information</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Unable to Load Venue</h2>
          <p className="text-red-600 mb-6 text-sm">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full bg-bridal-gold hover:bg-bridal-gold-dark text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Venue Not Found</h2>
          <p className="text-neutral-600 mb-6">The venue you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={handleGoBack}
            className="bg-bridal-gold hover:bg-bridal-gold-dark text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return <VendorDetailsMobile vendor={venue} />
}


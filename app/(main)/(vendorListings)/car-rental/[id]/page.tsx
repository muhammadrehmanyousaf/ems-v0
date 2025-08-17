"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import VendorDetailsMobile from "@/components/VendorDetails/VendorDetailsMobile"
import type { Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"

export default function CarRentalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid vendor ID')
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔍 Fetching car rental vendor details for ID:', id)
        
        // Fetch vendor details from API
        const vendorData = await VendorAPI.getBusinessById(id)
        
        if (vendorData) {
          console.log('✅ Car rental vendor data received:', vendorData)
          setVendor(vendorData)
        } else {
          console.log('❌ No car rental vendor data received from API')
          throw new Error('Car rental vendor not found')
        }
      } catch (err) {
        console.error('❌ Error fetching car rental vendor details:', err)
        
        // Try to get from localStorage as fallback
        try {
          const storedVendors = localStorage.getItem('all_vendors')
          if (storedVendors) {
            const parsedVendors = JSON.parse(storedVendors)
            const storedVendor = parsedVendors.find((v: Vendor) => v.id.toString() === id)
            if (storedVendor) {
              console.log('✅ Found car rental vendor in localStorage fallback')
              setVendor(storedVendor)
              return
            }
          }
        } catch (localStorageError) {
          console.log('❌ Error reading from localStorage:', localStorageError)
        }
        
        setError(err instanceof Error ? err.message : 'Failed to load car rental vendor details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorDetails()
  }, [id, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-rose-500 mx-auto mb-4" />
          <p className="text-neutral-600 text-lg">Loading car rental vendor details...</p>
          <p className="text-sm text-neutral-500 mt-2">Please wait while we fetch the car rental vendor information</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Unable to Load Car Rental Vendor</h2>
          <p className="text-red-600 mb-6 text-sm">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
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

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Car Rental Vendor Not Found</h2>
          <p className="text-neutral-600 mb-6">The car rental vendor you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={handleGoBack}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return <VendorDetailsMobile vendor={vendor} />
}


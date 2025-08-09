"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import VendorDetails from "@/components/VendorDetails/VendorDetails"
import type { Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"

export default function CarRentalDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!id || typeof id !== 'string') return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch vendor details from API
        const vendorData = await VendorAPI.getBusinessById(id as string)
        setVendor(vendorData)
      } catch (err) {
        console.error('Error fetching vendor details:', err)
        setError('Failed to load vendor details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorDetails()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 text-lg">Loading vendor details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 text-lg">Vendor not found</p>
        </div>
      </div>
    )
  }

  return <VendorDetails vendor={vendor} />
}


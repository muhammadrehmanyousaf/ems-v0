"use client"

import React, { useState, useEffect } from "react"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import { Star, Loader2, MessageSquare, Calendar, MapPin, Building } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import axiosInstance from "@/lib/axiosConfig"
import { BACKEND_URL } from "@/lib/backend-url"

interface ReviewData {
  id: number
  rating: number
  comment: string
  createdAt: string
  business?: { id: number; name: string; city?: string; subArea?: string }
  booking?: { id: number; bookingDate: string; bookingTime: string }
}

export default function UserReviewsPage() {
  const { user, isAuthenticated, isLoading } = useUser()
  const router = useRouter()
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (user) fetchReviews()
  }, [user, isLoading])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get(`${BACKEND_URL}api/v1/reviews/my-reviews`)
      setReviews(res.data?.data || [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  )

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-neutral-600">Loading your reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
            <Star className="inline w-7 h-7 text-yellow-500 mr-2 -mt-1" />
            My Reviews
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"} submitted
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card className="bg-white/80 border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{reviews.length}</p>
              <p className="text-xs text-neutral-500">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                  : "0"}
              </p>
              <p className="text-xs text-neutral-500">Avg Rating</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {reviews.filter((r) => r.rating >= 4).length}
              </p>
              <p className="text-xs text-neutral-500">4+ Stars</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="bg-white/80 border-0 shadow-lg">
            <CardContent className="p-8 sm:p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No reviews yet</h3>
              <p className="text-neutral-600 mb-6">
                After completing a booking, you can leave a review for the vendor.
              </p>
              <Button onClick={() => router.push("/user/bookings")}>
                View Your Bookings
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-white/80 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {review.business?.name || "Business"}
                        </h3>
                      </div>
                      {review.business?.city && (
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {review.business.city}
                          {review.business.subArea ? `, ${review.business.subArea}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <Badge variant="secondary" className="text-xs">
                        {review.rating}/5
                      </Badge>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-neutral-700 mb-3 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(review.createdAt)}
                    </span>
                    {review.booking && (
                      <span className="flex items-center gap-1">
                        Booking #{review.booking.id}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

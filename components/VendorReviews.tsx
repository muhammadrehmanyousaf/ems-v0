"use client"

import { Star, User } from "lucide-react"
import type { Review } from "@/lib/types"

interface VendorReviewsProps {
  reviews?: Review[]
}

export default function VendorReviews({ reviews = [] }: VendorReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-center py-8 text-neutral-500">No reviews yet.</div>
  }

  return (
    <div className="space-y-6 mb-8">
      <h3 className="text-xl font-semibold text-neutral-900">Reviews ({reviews.length})</h3>
      <div className="space-y-4">
        {reviews.map((review, i) => (
          <div key={i} className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bridal-gold/15 rounded-full flex items-center justify-center text-bridal-gold-dark">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-neutral-900">{review.userName || review.userName || "Anonymous"}</h4>
                  <p className="text-xs text-neutral-500">{review.date || review.createdAt || "Recent"}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-neutral-700 ml-1">{review.rating || 5}.0</span>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mt-2">{review.comment || review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
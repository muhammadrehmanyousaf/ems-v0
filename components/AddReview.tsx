"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import type { Review } from "@/lib/types"

interface AddReviewProps {
  vendorId: string | number
  onAddReview: (review: Review) => void
}

export default function AddReview({ vendorId, onAddReview }: AddReviewProps) {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    
    setTimeout(() => {
      onAddReview({
        id: Date.now().toString(),
        rating,
        comment,
        content: comment,
        userName: "Guest User",
        author: "Guest User",
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString()
      } as any)
      
      setComment("")
      setRating(5)
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="bg-neutral-50 p-5 sm:p-6 rounded-xl border border-neutral-100">
      <h3 className="text-lg font-semibold mb-4 text-neutral-900">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Your Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" className="focus:outline-none transition-transform hover:scale-110" onClick={() => setRating(star)} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}>
                <Star className={`w-6 h-6 ${star <= (hoveredRating || rating) ? "text-yellow-400 fill-current" : "text-neutral-300"}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-neutral-700 mb-2">Your Review</label>
          <Textarea id="comment" placeholder="Share your experience with this vendor..." className="w-full min-h-[100px] resize-y bg-white border-neutral-200" value={comment} onChange={(e) => setComment(e.target.value)} required />
        </div>
        <Button type="submit" disabled={isSubmitting || !comment.trim()} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md transition-all duration-200">
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  )
}
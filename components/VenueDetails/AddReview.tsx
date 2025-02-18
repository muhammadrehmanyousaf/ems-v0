"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import type { Review } from "@/lib/types"

interface AddReviewProps {
  venueId: number
  onAddReview: (review: Review) => void
}

export default function AddReview({ venueId, onAddReview }: AddReviewProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [userName, setUserName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newReview: Review = {
      id: Date.now(),
      venueId,
      userName,
      rating,
      comment,
      date: new Date().toISOString().split("T")[0],
    }
    onAddReview(newReview)
    setRating(0)
    setComment("")
    setUserName("")
  }

  return (
    <div className="bg-white rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Write a Review</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer transition-colors ${
                  star <= (hoveredRating || rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              />
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="userName" className="block mb-2">
            Your Name
          </label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label htmlFor="comment" className="block mb-2">
            Your Review
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Share your experience with this venue"
            className="min-h-[100px]"
          />
        </div>
        <Button type="submit" disabled={!rating || !userName || !comment}>
          Submit Review
        </Button>
      </form>
    </div>
  )
}


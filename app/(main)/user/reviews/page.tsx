"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import {
  Star, MapPin, Calendar, Building2, MessageSquare,
  TrendingUp, ChevronRight, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";

interface ReviewData {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  vendorReply?: string;
  vendorReplyDate?: string;
  business?: { id: number; name: string; city?: string; subArea?: string };
  booking?: { id: number; bookingDate: string; bookingTime: string };
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function StarRow({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${size} ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function UserReviewsPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push("/login"); return; }
    if (user) fetchReviews();
  }, [user, isLoading]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`${BACKEND_URL}api/v1/reviews/my-reviews`);
      setReviews(res.data?.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 0;

  // Skeleton
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 w-40 skeleton-shimmer rounded-lg mb-2" />
            <div className="h-4 w-56 skeleton-shimmer rounded" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />)}
          </div>
          {[1,2,3].map(i => <div key={i} className="h-36 skeleton-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"} submitted
            </p>
          </div>
          <Button onClick={fetchReviews} disabled={loading} variant="outline" size="sm" className="flex items-center gap-2 border-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Reviews", value: reviews.length,             icon: MessageSquare, color: "bg-purple-50 text-purple-600",  num: "text-purple-600"  },
            { label: "Avg Rating",    value: avgRating.toFixed(1),        icon: Star,          color: "bg-yellow-50 text-yellow-500",  num: "text-yellow-500"  },
            { label: "4+ Stars",      value: reviews.filter(r => r.rating >= 4).length, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600", num: "text-emerald-600" },
          ].map(({ label, value, icon: Icon, color, num }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${num}`}>{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              After completing a booking, you can leave a review for the vendor.
            </p>
            <Button onClick={() => router.push("/user/bookings")} className="bg-purple-600 hover:bg-purple-700 text-white">
              View Your Bookings
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <h3 className="font-bold text-gray-900 truncate">
                        {review.business?.name || "Business"}
                      </h3>
                    </div>
                    {review.business?.city && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {review.business.city}
                        {review.business.subArea ? `, ${review.business.subArea}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <StarRow rating={review.rating} />
                    <p className="text-xs text-gray-400 mt-1">{RATING_LABELS[review.rating]}</p>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 bg-gray-50 rounded-xl p-3">
                    {review.comment}
                  </p>
                )}

                {/* Vendor reply */}
                {review.vendorReply && (
                  <div className="mb-4 pl-3 border-l-2 border-purple-200 bg-purple-50/40 rounded-r-xl py-2 pr-3">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Vendor Reply</p>
                    <p className="text-sm text-gray-700">{review.vendorReply}</p>
                    {review.vendorReplyDate && (
                      <p className="text-xs text-gray-400 mt-1">{fmtDate(review.vendorReplyDate)}</p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fmtDate(review.createdAt)}
                  </span>
                  {review.booking && (
                    <button
                      onClick={() => router.push(`/user/bookings/${review.booking!.id}`)}
                      className="flex items-center gap-1 text-purple-500 hover:text-purple-700 font-medium transition-colors"
                    >
                      Booking #{review.booking.id}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

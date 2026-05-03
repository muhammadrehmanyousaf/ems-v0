"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import {
  Star,
  MapPin,
  Calendar,
  Building2,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";

import {
  PageContainer,
  PageHeader,
  KpiCard,
  EmptyState,
} from "@/components/user-dashboard";

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

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function StarRow({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            size,
            s <= rating
              ? "fill-bridal-gold text-bridal-gold"
              : "text-bridal-beige",
          )}
        />
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
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
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
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const eyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Reviews</span>
    </>
  );

  const headerActions = (
    <Button
      onClick={fetchReviews}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-1.5"
    >
      <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
      Refresh
    </Button>
  );

  if (isLoading || loading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="My reviews"
          description="Feedback you've shared with vendors."
          actions={headerActions}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <KpiCard key={i} label="" value={0} isLoading />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="My reviews"
        description={`${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} submitted.`}
        actions={headerActions}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total reviews"
          value={reviews.length}
          icon={<MessageSquare className="size-4" />}
        />
        <KpiCard
          label="Average rating"
          value={avgRating.toFixed(1)}
          icon={<Star className="size-4" />}
          caption={avgRating > 0 ? RATING_LABELS[Math.round(avgRating)] : undefined}
        />
        <KpiCard
          label="4+ stars"
          value={reviews.filter((r) => r.rating >= 4).length}
          icon={<TrendingUp className="size-4" />}
          caption="High ratings given"
        />
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-6" />}
          title="No reviews yet"
          description="After completing a booking, you can leave a review for the vendor."
          action={
            <Button onClick={() => router.push("/user/bookings")} size="sm">
              View your bookings
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="size-3.5 text-bridal-gold flex-shrink-0" />
                    <h3 className="font-display italic text-[18px] text-foreground truncate">
                      {review.business?.name || "Business"}
                    </h3>
                  </div>
                  {review.business?.city ? (
                    <p className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {review.business.city}
                      {review.business.subArea
                        ? `, ${review.business.subArea}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex-shrink-0 text-right">
                  <StarRow rating={review.rating} />
                  <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-bridal-gold-dark mt-1">
                    {RATING_LABELS[review.rating]}
                  </p>
                </div>
              </div>

              {review.comment ? (
                <p className="text-[13.5px] text-foreground/85 leading-relaxed mb-4 bg-muted/30 rounded-md p-3">
                  {review.comment}
                </p>
              ) : null}

              {review.vendorReply ? (
                <div className="mb-4 pl-4 border-l-2 border-bridal-gold/45 bg-bridal-cream rounded-r-md py-2 pr-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark mb-1">
                    Vendor reply
                  </p>
                  <p className="text-[13px] text-foreground/85">
                    {review.vendorReply}
                  </p>
                  {review.vendorReplyDate ? (
                    <p className="text-[10.5px] text-muted-foreground mt-1">
                      {fmtDate(review.vendorReplyDate)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {fmtDate(review.createdAt)}
                </span>
                {review.booking ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/user/bookings/${review.booking!.id}`)}
                    className="inline-flex items-center gap-1 text-bridal-gold-dark hover:text-bridal-mauve font-medium transition-colors"
                  >
                    Booking #{review.booking.id}
                    <ChevronRight className="size-3" />
                  </button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

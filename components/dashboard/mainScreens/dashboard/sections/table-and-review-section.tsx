"use client";

import React from "react";
import RecentBookingTable from "../components/recent-booking-table";
import CustomerReviews from "../components/customer-reviews";
import type {
  RecentBookingsData,
  ReviewSummaryData,
} from "@/lib/api/analytics";

interface TableAndReviewSectionProps {
  recentBookings: RecentBookingsData | null;
  reviewSummary: ReviewSummaryData | null;
  loading?: boolean;
}

const TableAndReviewSection = ({
  recentBookings,
  reviewSummary,
  loading,
}: TableAndReviewSectionProps) => {
  return (
    <div className="grid grid-cols-6 gap-4 items-stretch">
      <div className="col-span-6 xl:col-span-4 max-h-[800px]">
        <RecentBookingTable
          rows={recentBookings?.bookings || []}
          stats={recentBookings?.stats}
          loading={loading}
        />
      </div>
      <div className="col-span-6 xl:col-span-2">
        <CustomerReviews
          average={reviewSummary?.average}
          distribution={reviewSummary?.distribution}
          verifiedPurchases={reviewSummary?.total}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default TableAndReviewSection;

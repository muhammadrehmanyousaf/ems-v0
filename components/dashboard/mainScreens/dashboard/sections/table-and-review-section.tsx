"use client";

import React from "react";
import RecentBookingTable from "../components/recent-booking-table";
import { RevenueBarChart } from "../components/revenue-bar-chart";
import CustomerReviews from "../components/customer-reviews";
import type {
  RecentBookingsData,
  RevenueTrendsData,
  ReviewSummaryData,
} from "@/lib/api/analytics";

interface TableAndReviewSectionProps {
  recentBookings: RecentBookingsData | null;
  revenueTrends: RevenueTrendsData | null;
  reviewSummary: ReviewSummaryData | null;
  loading?: boolean;
}

const TableAndReviewSection = ({
  recentBookings,
  revenueTrends,
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
      <div className="col-span-6 xl:col-span-2 grid md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-2 gap-4 h-full xlarge:h-auto">
        <div className="xlarge:max-h-[400px]">
          <RevenueBarChart
            data={revenueTrends?.data || []}
            period={revenueTrends?.period || ""}
            loading={loading}
          />
        </div>
        <div className="xlarge:max-h-[400px]">
          <CustomerReviews
            average={reviewSummary?.average}
            distribution={reviewSummary?.distribution}
            verifiedPurchases={reviewSummary?.total}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default TableAndReviewSection;

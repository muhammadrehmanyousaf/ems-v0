"use client";

import React from "react";
import BookingAreaChart from "../components/booking-area-chart";
import StatusPieChart from "../components/status-pie-chart";
import type { BookingTrendsData, StatusDistributionData } from "@/lib/api/analytics";

interface ChartsSectionsProps {
  bookingTrends: BookingTrendsData | null;
  statusDist: StatusDistributionData | null;
  loading?: boolean;
}

const ChartsSections = ({ bookingTrends, statusDist, loading }: ChartsSectionsProps) => {
  return (
    <div className="grid grid-cols-6 gap-4 items-stretch">
      <div className="col-span-6 xl:col-span-4 h-full">
        <BookingAreaChart
          chartHeight={320}
          data={bookingTrends?.data || []}
          trendPercent={bookingTrends?.trendPercent || 0}
          period={bookingTrends?.period || ""}
          loading={loading}
        />
      </div>
      <div className="col-span-6 xl:col-span-2 h-full">
        <StatusPieChart
          chartHeight={320}
          data={statusDist?.data || []}
          total={statusDist?.total || 0}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ChartsSections;

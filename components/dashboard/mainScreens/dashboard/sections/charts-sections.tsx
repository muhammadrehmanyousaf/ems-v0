"use client";

import React from "react";
import BookingAreaChart from "../components/booking-area-chart";
import StatusPieChart from "../components/status-pie-chart";

const ChartsSections = () => {
  return (
    <div className="grid grid-cols-6 gap-4 items-stretch">
      <div className="col-span-6 xl:col-span-4 h-full">
        <BookingAreaChart chartHeight={320} />
      </div>
      <div className="col-span-6 xl:col-span-2 h-full">
        <StatusPieChart chartHeight={320} />
      </div>
    </div>
  );
};

export default ChartsSections;

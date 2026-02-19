"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Heading } from "@/components/heading";
import DashboardDateFilter from "../../globalComponents/dashboard-date-filter";
import { Button } from "@/components/ui/button";
import CardsSection from "./sections/cards-section";
import ChartsSections from "./sections/charts-sections";
import { ScrollArea } from "@/components/ui/scroll-area";
import TableAndReviewSection from "./sections/table-and-review-section";
import {
  AnalyticsAPI,
  type DateRange,
  type DashboardKpis,
  type BookingTrendsData,
  type StatusDistributionData,
  type RevenueTrendsData,
  type RecentBookingsData,
  type ReviewSummaryData,
  type TodaysBookingsData,
  type TodaysBookingItem,
} from "@/lib/api/analytics";
import { useUser } from "@/context/UserContext";
import { CalendarCheck, Clock, Phone, Building2, DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AdminDashboardView = dynamic(() => import("./admin-dashboard-view"), { ssr: false });

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed") return "border-emerald-500 text-emerald-600 bg-emerald-50";
  if (s === "pending") return "border-amber-500 text-amber-600 bg-amber-50";
  if (s === "cancelled" || s === "canceled") return "border-red-500 text-red-600 bg-red-50";
  if (s === "completed") return "border-blue-500 text-blue-600 bg-blue-50";
  return "";
}

function TodayBookingItem({ item }: { item: TodaysBookingItem }) {
  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Clock className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{item.customerName}</p>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${statusBadgeClass(item.status)}`}>
            {item.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {item.time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {item.time}
            </span>
          )}
          {item.customerPhone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {item.customerPhone}
            </span>
          )}
          {item.business && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {item.business}
            </span>
          )}
        </div>
        {item.totalAmount > 0 && (
          <p className="text-xs font-medium flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            {formatPKR(item.totalAmount)}
          </p>
        )}
      </div>
    </div>
  );
}

const DashboardView = () => {
  const { user } = useUser();

  // Super admin gets a dedicated dashboard
  if (user?.isSuperAdmin) {
    return <AdminDashboardView />;
  }
  const [dateRange, setDateRange] = useState<DateRange>("this_month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Data states
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [bookingTrends, setBookingTrends] = useState<BookingTrendsData | null>(null);
  const [statusDist, setStatusDist] = useState<StatusDistributionData | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrendsData | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingsData | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryData | null>(null);
  const [todaysBookings, setTodaysBookings] = useState<TodaysBookingsData | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Use this_year for trend charts so they show full monthly data
    const chartRange: DateRange = "this_year";

    const results = await Promise.allSettled([
      AnalyticsAPI.getDashboardKpis(dateRange, customStart, customEnd),
      AnalyticsAPI.getBookingTrends(chartRange),
      AnalyticsAPI.getBookingStatusDistribution(chartRange),
      AnalyticsAPI.getRevenueTrends(chartRange),
      AnalyticsAPI.getRecentBookings(10),
      AnalyticsAPI.getReviewSummary(),
      AnalyticsAPI.getTodaysBookings(),
    ]);

    const labels = ["KPIs", "Booking Trends", "Status Distribution", "Revenue Trends", "Recent Bookings", "Reviews", "Today's Bookings"];
    const failed: string[] = [];

    const getValue = <T,>(r: PromiseSettledResult<T>, fallback: T, idx: number): T => {
      if (r.status === "fulfilled") return r.value;
      failed.push(labels[idx]);
      return fallback;
    };

    setKpis(getValue(results[0], null, 0));
    setBookingTrends(getValue(results[1], null, 1));
    setStatusDist(getValue(results[2], null, 2));
    setRevenueTrends(getValue(results[3], null, 3));
    setRecentBookings(getValue(results[4], null, 4));
    setReviewSummary(getValue(results[5], null, 5));
    setTodaysBookings(getValue(results[6], null, 6));

    if (failed.length > 0) {
      toast.error(`Failed to load: ${failed.join(", ")}`);
    }

    setLoading(false);
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDateChange = (range: DateRange, start?: string, end?: string) => {
    setDateRange(range);
    setCustomStart(start);
    setCustomEnd(end);
  };

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 w-full px-4 md:px-6">
        <Heading title={`Hi ${firstName}, Welcome Back!`} />
        <span className="flex items-center justify-end gap-2">
          <DashboardDateFilter value={dateRange} onChange={handleDateChange} />
          <Button variant="outline" className="gap-2" onClick={() => setSheetOpen(true)}>
            <CalendarCheck className="size-4" />
            Today&apos;s Bookings
            {todaysBookings && todaysBookings.count > 0 && (
              <span className="ml-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                {todaysBookings.count}
              </span>
            )}
          </Button>
        </span>
      </div>
      <ScrollArea className="h-[calc(100dvh-200px)] md:h-[calc(100dvh-140px)] overflow-auto px-4 md:px-6">
        <div className="space-y-4">
          <CardsSection data={kpis} loading={loading} />
          <ChartsSections
            bookingTrends={bookingTrends}
            statusDist={statusDist}
            loading={loading}
          />
          <TableAndReviewSection
            recentBookings={recentBookings}
            revenueTrends={revenueTrends}
            reviewSummary={reviewSummary}
            loading={loading}
          />
        </div>
      </ScrollArea>

      {/* Today's Bookings Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Today&apos;s Bookings
            </SheetTitle>
            <SheetDescription>
              {todaysBookings?.count ?? 0} booking{(todaysBookings?.count ?? 0) !== 1 ? "s" : ""} scheduled for today
            </SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          <div className="space-y-3">
            {!todaysBookings || todaysBookings.bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarCheck className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No bookings scheduled for today</p>
              </div>
            ) : (
              todaysBookings.bookings.map((item) => (
                <TodayBookingItem key={item.id} item={item} />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardView;

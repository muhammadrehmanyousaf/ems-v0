"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardDateFilter from "../../globalComponents/dashboard-date-filter";
import PageContainer from "@/components/dashboard/layout/page-container";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { KpiCard } from "./components/data-card";
import ChartsSections from "./sections/charts-sections";
import {
  AnalyticsAPI,
  type DateRange,
  type DashboardKpis,
  type BookingTrendsData,
  type StatusDistributionData,
  type RevenueTrendsData,
  type RecentBookingsData,
  type ReviewSummaryData,
  type PlatformRevenueData,
  type VendorPerformanceData,
  type PlatformOverviewData,
} from "@/lib/api/analytics";
import { useUser } from "@/context/UserContext";
import {
  DollarSign,
  Users,
  ClipboardList,
  Wallet,
} from "lucide-react";
import TopVendorsTable from "./components/top-vendors-table";
import RecentBookingTable from "./components/recent-booking-table";
import { RevenueBarChart } from "./components/revenue-bar-chart";
import CustomerReviews from "./components/customer-reviews";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const AdminDashboardView = () => {
  const { user } = useUser();
  const [dateRange, setDateRange] = useState<DateRange>("this_month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [platformRevenue, setPlatformRevenue] = useState<PlatformRevenueData | null>(null);
  const [platformOverview, setPlatformOverview] = useState<PlatformOverviewData | null>(null);
  const [vendorPerformance, setVendorPerformance] = useState<VendorPerformanceData | null>(null);
  const [bookingTrends, setBookingTrends] = useState<BookingTrendsData | null>(null);
  const [statusDist, setStatusDist] = useState<StatusDistributionData | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrendsData | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingsData | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryData | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const chartRange: DateRange = "this_year";

    const results = await Promise.allSettled([
      AnalyticsAPI.getDashboardKpis(dateRange, customStart, customEnd),
      AnalyticsAPI.getPlatformRevenue(dateRange, customStart, customEnd),
      AnalyticsAPI.getPlatformOverview(dateRange, customStart, customEnd),
      AnalyticsAPI.getVendorPerformance(chartRange),
      AnalyticsAPI.getBookingTrends(chartRange),
      AnalyticsAPI.getBookingStatusDistribution(chartRange),
      AnalyticsAPI.getRevenueTrends(chartRange),
      AnalyticsAPI.getRecentBookings(10),
      AnalyticsAPI.getReviewSummary(),
    ]);

    const labels = ["KPIs", "Revenue", "Overview", "Vendor Performance", "Booking Trends", "Status Distribution", "Revenue Trends", "Recent Bookings", "Reviews"];
    const failed: string[] = [];
    const getValue = <T,>(r: PromiseSettledResult<T>, fallback: T, idx: number): T => {
      if (r.status === "fulfilled") return r.value;
      failed.push(labels[idx]);
      return fallback;
    };

    setKpis(getValue(results[0], null, 0));
    setPlatformRevenue(getValue(results[1], null, 1));
    setPlatformOverview(getValue(results[2], null, 2));
    setVendorPerformance(getValue(results[3], null, 3));
    setBookingTrends(getValue(results[4], null, 4));
    setStatusDist(getValue(results[5], null, 5));
    setRevenueTrends(getValue(results[6], null, 6));
    setRecentBookings(getValue(results[7], null, 7));
    setReviewSummary(getValue(results[8], null, 8));

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

  const firstName = user?.fullName?.split(" ")[0] || "Admin";

  const totalRevenue = platformRevenue?.totalRevenue ?? kpis?.totalRevenue?.value ?? 0;
  const revenueDelta = kpis?.totalRevenue?.delta ?? 0;
  const totalFees = platformRevenue?.totalFees ?? 0;
  const pendingPayouts = platformRevenue?.pendingPayouts ?? 0;
  const totalBookings = kpis?.totalBookings?.value ?? 0;
  const bookingsDelta = kpis?.totalBookings?.delta ?? 0;
  const totalVendors = platformOverview?.totalVendors?.value ?? 0;
  const vendorsDelta = platformOverview?.totalVendors?.delta ?? 0;

  const eyebrow = user?.isSuperAdmin ? "Super admin · Overview" : "Admin · Overview";

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title={`Welcome back, ${firstName}`}
        description="Platform health at a glance — revenue, bookings, vendors and customer pulse."
        actions={<DashboardDateFilter value={dateRange} onChange={handleDateChange} />}
      />

      {/* KPI grid — 4 majors only. Businesses + Customers live in the
          Directory section already; cramming 6 cards in one row was clipping
          titles. 4 cards × 1 row at lg+ gives every card real breathing room. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={totalRevenue}
          isCurrency
          delta={revenueDelta}
          direction={revenueDelta >= 0 ? "up" : "down"}
          icon={DollarSign}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          loading={loading}
        />
        <KpiCard
          title="Platform Fees"
          value={totalFees}
          isCurrency
          icon={Wallet}
          iconColor="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
          loading={loading}
        />
        <KpiCard
          title="Total Bookings"
          value={totalBookings}
          delta={bookingsDelta}
          direction={bookingsDelta >= 0 ? "up" : "down"}
          icon={ClipboardList}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
          loading={loading}
        />
        <KpiCard
          title="Total Vendors"
          value={totalVendors}
          delta={vendorsDelta}
          direction={vendorsDelta >= 0 ? "up" : "down"}
          icon={Users}
          iconColor="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
          loading={loading}
        />
      </div>

      {/* Pending Payouts banner */}
      {!loading && pendingPayouts > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PKR {pendingPayouts.toLocaleString()}</strong> in pending vendor payouts awaiting release.
          </span>
        </div>
      )}

      {/* Charts */}
      <ChartsSections
        bookingTrends={bookingTrends}
        statusDist={statusDist}
        loading={loading}
      />

      {/* Top vendors + Revenue bar + Reviews */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 items-stretch">
        <div className="xl:col-span-4">
          {loading ? (
            <Skeleton className="h-[400px] w-full rounded-lg" />
          ) : (
            <TopVendorsTable vendors={vendorPerformance?.vendors || []} />
          )}
        </div>
        <div className="xl:col-span-2 grid md:grid-cols-2 xl:grid-cols-1 gap-4">
          <RevenueBarChart
            data={revenueTrends?.data || []}
            period={revenueTrends?.period || ""}
            loading={loading}
          />
          <CustomerReviews
            average={reviewSummary?.average}
            distribution={reviewSummary?.distribution}
            verifiedPurchases={reviewSummary?.total}
            loading={loading}
          />
        </div>
      </div>

      {/* Recent bookings */}
      <RecentBookingTable
        rows={recentBookings?.bookings || []}
        stats={recentBookings?.stats}
        loading={loading}
      />
    </PageContainer>
  );
};

export default AdminDashboardView;

"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

import DashboardDateFilter from "../../globalComponents/dashboard-date-filter";
import { Button } from "@/components/ui/button";
import CardsSection from "./sections/cards-section";
import ChartsSections from "./sections/charts-sections";
import RevenueSplitSection from "./sections/revenue-split-section";
import UpcomingAndDueSection from "./sections/upcoming-and-due-section";
import TableAndReviewSection from "./sections/table-and-review-section";
import CompletenessWidget from "./sections/completeness-widget";
import OperationsSummarySection from "./sections/operations-summary-section";
import NeedsAttentionStrip from "./sections/needs-attention-strip";
import LeadConversionTile from "./sections/lead-conversion-tile";
import PageContainer from "@/components/dashboard/layout/page-container";
import { PageHeader } from "@/components/dashboard/layout/page-header";

import {
  AnalyticsAPI,
  type DateRange,
  type DashboardKpis,
  type BookingTrendsData,
  type StatusDistributionData,
  type RecentBookingsData,
  type ReviewSummaryData,
  type TodaysBookingsData,
  type TodaysBookingItem,
  type UpcomingBookings7DaysData,
} from "@/lib/api/analytics";
import { PaymentsAPI } from "@/lib/api/dashboard";
import type { VendorRevenueResponse, VendorPayment } from "@/lib/dashboard-types";
import { useUser } from "@/context/UserContext";
import { useBusiness } from "@/context/BusinessContext";
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role";
import { CalendarCheck, Clock, Phone, Building2, DollarSign } from "lucide-react";
import { toast } from "sonner";
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

// Hook-free role-aware switcher. Without this split, the super-admin / vendor
// branches would have different hook counts between renders (the user loads
// async — first paint sees null) and React would crash the page blank.
const DashboardView = () => {
  const { user, isLoading } = useUser();
  if (isLoading) return null;
  if (isAdminLike(getDashboardRole(user))) return <AdminDashboardView />;
  return <VendorDashboardView />;
};

const VendorDashboardView = () => {
  const { user } = useUser();
  const { business } = useBusiness();
  const [dateRange, setDateRange] = useState<DateRange>("this_year");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [bookingTrends, setBookingTrends] = useState<BookingTrendsData | null>(null);
  const [statusDist, setStatusDist] = useState<StatusDistributionData | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingsData | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryData | null>(null);
  const [todaysBookings, setTodaysBookings] = useState<TodaysBookingsData | null>(null);
  const [vendorRevenue, setVendorRevenue] = useState<VendorRevenueResponse | null>(null);
  const [upcoming7Days, setUpcoming7Days] = useState<UpcomingBookings7DaysData | null>(null);

  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setRevenueLoading(true);

    const [analyticsResults, revenueResult] = await Promise.all([
      Promise.allSettled([
        AnalyticsAPI.getDashboardKpis(dateRange, customStart, customEnd),
        AnalyticsAPI.getBookingTrends(dateRange, customStart, customEnd),
        AnalyticsAPI.getBookingStatusDistribution(dateRange, customStart, customEnd),
        AnalyticsAPI.getRecentBookings(10),
        AnalyticsAPI.getReviewSummary(),
        AnalyticsAPI.getTodaysBookings(),
        AnalyticsAPI.getUpcomingBookings7Days(),
      ]),
      PaymentsAPI.getVendorRevenue().catch(() => null),
    ]);

    const labels = ["KPIs", "Booking Trends", "Status Distribution", "Recent Bookings", "Reviews", "Today's Bookings", "Upcoming 7 Days"];
    const failed: string[] = [];

    const get = <T,>(r: PromiseSettledResult<T>, fb: T, idx: number): T => {
      if (r.status === "fulfilled") return r.value;
      failed.push(labels[idx]);
      return fb;
    };

    setKpis(get(analyticsResults[0], null, 0));
    setBookingTrends(get(analyticsResults[1], null, 1));
    setStatusDist(get(analyticsResults[2], null, 2));
    setRecentBookings(get(analyticsResults[3], null, 3));
    setReviewSummary(get(analyticsResults[4], null, 4));
    setTodaysBookings(get(analyticsResults[5], null, 5));
    setUpcoming7Days(get(analyticsResults[6], null, 6));
    setVendorRevenue(revenueResult);

    if (failed.length > 0) toast.error(`Failed to load: ${failed.join(", ")}`);

    setLoading(false);
    setRevenueLoading(false);
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDateChange = (range: DateRange, start?: string, end?: string) => {
    setDateRange(range);
    setCustomStart(start);
    setCustomEnd(end);
  };

  const paymentsDue: VendorPayment[] = (vendorRevenue?.payments ?? [])
    .filter((p) => p.due > 0)
    .sort((a, b) => b.due - a.due);

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Vendor console · Overview"
        title={`Welcome back, ${firstName}`}
        description="At-a-glance signal for your business — bookings, revenue and reviews."
        actions={
          <>
            <DashboardDateFilter value={dateRange} onChange={handleDateChange} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSheetOpen(true)}>
              <CalendarCheck className="size-3.5" />
              Today&apos;s bookings
              {todaysBookings && todaysBookings.count > 0 && (
                <span className="ml-1 min-w-[18px] h-4 px-1.5 flex items-center justify-center rounded-full bg-bridal-cream border border-bridal-gold/45 text-bridal-gold-dark text-[10px] font-medium tabular-nums">
                  {todaysBookings.count}
                </span>
              )}
            </Button>
          </>
        }
      />

      {/* Command-center action hub — prioritised, one-tap "needs attention".
          Flag-gated (NEXT_PUBLIC_ACTION_CENTER); reads the existing
          operations-summary endpoint, no new backend. */}
      {process.env.NEXT_PUBLIC_ACTION_CENTER === '1' && <NeedsAttentionStrip />}

      <CardsSection data={kpis} loading={loading} />
      {business?.id && (
        <CompletenessWidget
          businessId={business.id}
          editHref="/dashboard/business"
        />
      )}
      {/* Cross-feature operations summary — Phase 1/2/3 widget grid */}
      <OperationsSummarySection />
      {/* Lead → Booking conversion (audit gap G3) — reuses existing
          insights-advanced endpoint, no extra fetch on the BE. */}
      <LeadConversionTile />
      <RevenueSplitSection data={vendorRevenue} loading={revenueLoading} />
      <UpcomingAndDueSection upcoming={upcoming7Days} due={paymentsDue} loading={loading} />
      <ChartsSections bookingTrends={bookingTrends} statusDist={statusDist} loading={loading} />
      <TableAndReviewSection recentBookings={recentBookings} reviewSummary={reviewSummary} loading={loading} />

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
    </PageContainer>
  );
};

export default DashboardView;

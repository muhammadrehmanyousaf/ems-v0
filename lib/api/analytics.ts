import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";

export type DateRange =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_7_days"
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "this_year"
  | "custom";

export interface KpiItem {
  value: number;
  delta: number;
}

export interface DashboardKpis {
  totalBookings: KpiItem;
  totalRevenue: KpiItem;
  revenueDue: KpiItem;
  todaysEvents: KpiItem;
  upcomingBookings: KpiItem;
}

export interface BookingTrendItem {
  month: string;
  bookings: number;
}

export interface BookingTrendsData {
  data: BookingTrendItem[];
  trendPercent: number;
  period: string;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  fill: string;
}

export interface StatusDistributionData {
  data: StatusDistributionItem[];
  total: number;
}

export interface RevenueTrendItem {
  month: string;
  revenue: number;
}

export interface RevenueTrendsData {
  data: RevenueTrendItem[];
  period: string;
}

export interface RecentBookingItem {
  id: number;
  customerName: string;
  customerPhone: string;
  eventType: string;
  status: string;
  bookingDate: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export interface BookingStats {
  newCount: number;
  pendingCount: number;
  confirmedCount: number;
  cancelledCount: number;
  completedCount: number;
  total: number;
}

export interface RecentBookingsData {
  bookings: RecentBookingItem[];
  stats: BookingStats;
}

export interface ReviewDistItem {
  stars: number;
  count: number;
}

export interface ReviewSummaryData {
  average: number;
  total: number;
  distribution: ReviewDistItem[];
}

export interface TodaysBookingItem {
  id: number;
  customerName: string;
  customerPhone: string;
  time: string;
  status: string;
  business: string;
  totalAmount: number;
}

export interface TodaysBookingsData {
  count: number;
  bookings: TodaysBookingItem[];
}

export interface UpcomingBookingItem {
  id: number;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  time: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  business: string;
}

export interface UpcomingBookings7DaysData {
  count: number;
  bookings: UpcomingBookingItem[];
}

// ─── Super Admin Types ─────────────────────────────────────────

export interface VendorRevenueItem {
  vendorId: number;
  vendorName: string;
  vendorEmail: string;
  vendorType: string;
  revenue: number;
  fees: number;
  payout: number;
  transactions: number;
}

export interface PlatformRevenueData {
  totalRevenue: number;
  totalFees: number;
  totalPayouts: number;
  pendingPayouts: number;
  byVendor: VendorRevenueItem[];
}

export interface VendorPerformanceItem {
  id: number;
  name: string;
  email: string;
  vendorType: string;
  active: boolean;
  businessCount: number;
  bookingCount: number;
  avgRating: number;
  reviewCount: number;
  joinedAt: string;
}

export interface VendorPerformanceData {
  vendors: VendorPerformanceItem[];
  total: number;
}

export interface PlatformKpiItem {
  value: number;
  delta?: number;
}

export interface PlatformOverviewData {
  totalVendors: PlatformKpiItem;
  activeVendors: PlatformKpiItem;
  totalBusinesses: PlatformKpiItem;
  totalCustomers: PlatformKpiItem;
  totalBookings: PlatformKpiItem;
}

function buildQuery(range: DateRange, startDate?: string, endDate?: string) {
  let qs = `range=${range}`;
  if (range === "custom" && startDate) qs += `&startDate=${startDate}`;
  if (range === "custom" && endDate) qs += `&endDate=${endDate}`;
  return qs;
}

export class AnalyticsAPI {
  static async getDashboardKpis(
    range: DateRange = "this_year",
    startDate?: string,
    endDate?: string
  ): Promise<DashboardKpis | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/kpis?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getBookingTrends(
    range: DateRange = "this_year",
    startDate?: string,
    endDate?: string
  ): Promise<BookingTrendsData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/booking-trends?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getBookingStatusDistribution(
    range: DateRange = "this_year",
    startDate?: string,
    endDate?: string
  ): Promise<StatusDistributionData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/booking-status?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getRevenueTrends(
    range: DateRange = "this_year",
    startDate?: string,
    endDate?: string
  ): Promise<RevenueTrendsData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/revenue-trends?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getRecentBookings(limit = 10): Promise<RecentBookingsData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/recent-bookings?limit=${limit}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getReviewSummary(): Promise<ReviewSummaryData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/review-summary`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getTodaysBookings(): Promise<TodaysBookingsData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/todays-bookings`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getUpcomingBookings7Days(): Promise<UpcomingBookings7DaysData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/upcoming-7-days`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  // ─── Super Admin Analytics ──────────────────────────────────

  static async getPlatformRevenue(
    range: DateRange = "this_month",
    startDate?: string,
    endDate?: string
  ): Promise<PlatformRevenueData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/platform-revenue?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getVendorPerformance(
    range: DateRange = "this_year",
    startDate?: string,
    endDate?: string
  ): Promise<VendorPerformanceData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/vendor-performance?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  static async getPlatformOverview(
    range: DateRange = "this_month",
    startDate?: string,
    endDate?: string
  ): Promise<PlatformOverviewData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/platform-overview?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  /**
   * A/R aging report — vendor-scoped per-customer outstanding-balance
   * rollup. The #1 PK vendor question: "kis se paise leny hen?"
   */
  static async getReceivables(): Promise<ReceivablesData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/receivables`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  /**
   * Revenue breakdowns — payment-method mix + top customers + by-business
   * slice, all in one shot for the Insights page.
   */
  static async getRevenueBreakdowns(
    range: DateRange = "this_year",
    startDate?: string,
    endDate?: string
  ): Promise<RevenueBreakdownsData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/revenue-breakdowns?${buildQuery(range, startDate, endDate)}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }

  /**
   * Cash-flow forecast — month-by-month expected inflows from BOOKED
   * installments. Different from the 90-day revenue projection (which is
   * statistical / rolling-30 × YoY blend). This one is just the math on
   * what's already on the books.
   */
  static async getCashFlowForecast(
    monthsAhead: number = 6,
  ): Promise<CashFlowForecastData | null> {
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/analytics/cash-flow-forecast?months=${monthsAhead}`
      );
      return res.data.data;
    } catch {
      return null;
    }
  }
}

// ─── A/R aging types ───────────────────────────────────────────────
export type ReceivablesBucketKey =
  | "current"
  | "days_1_30"
  | "days_31_60"
  | "days_61_90"
  | "days_90_plus";

export interface ReceivablesBucket {
  count: number;
  total: number;
}

export interface ReceivablesInstallment {
  id: number;
  label: string;
  amount: number;
  amountPaid: number;
  outstanding: number;
  dueAt: string;
  daysOverdue: number;
  bucket: ReceivablesBucketKey;
  status: string;
}

export interface ReceivablesBooking {
  bookingId: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
  installments: ReceivablesInstallment[];
  totalOutstanding: number;
}

export interface ReceivablesCustomer {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  totalOutstanding: number;
  installmentsOpen: number;
  oldestDaysOverdue: number;
  bookingCount: number;
  bookings: ReceivablesBooking[];
  bucket: ReceivablesBucketKey;
}

export interface ReceivablesData {
  buckets: Record<ReceivablesBucketKey, ReceivablesBucket>;
  totals: {
    grandOutstanding: number;
    customerCount: number;
    installmentsOpen: number;
    oldestDaysOverdue: number;
  };
  customers: ReceivablesCustomer[];
  generatedAt: string;
}

// ─── Revenue breakdowns types ─────────────────────────────────────
export type PaymentMethodKey =
  | "cash" | "jazzcash" | "easypaisa" | "raast"
  | "ibft" | "bank_transfer" | "other";

export interface PaymentMethodSlice {
  method: PaymentMethodKey | string;
  total: number;
  count: number;
  pct: number; // 0-100 (1 decimal)
}

export interface TopCustomerRow {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  totalRevenue: number;
  bookingCount: number;
  completedCount: number;
  lastBookingAt: string | null;
  isRepeat: boolean;
}

export interface BusinessRevenueRow {
  businessId: number;
  businessName: string;
  businessType: string | null;
  totalRevenue: number;
  bookingCount: number;
}

export interface RevenueBreakdownsData {
  byPaymentMethod: PaymentMethodSlice[];
  topCustomers: TopCustomerRow[];
  byBusiness: BusinessRevenueRow[];
  totals: {
    paymentMethodTotal: number;
    customerCount: number;
    businessCount: number;
  };
  range: { from: string; to: string };
}

// ─── Cash-flow forecast types ─────────────────────────────────────
export interface CashFlowMonth {
  key: string;            // "YYYY-MM"
  label: string;          // "May 2026"
  expectedIn: number;     // Rs expected this month
  installmentCount: number;
  cumulative: number;     // running sum from month 0
  isCurrentMonth: boolean;
}
export interface CashFlowForecastData {
  months: CashFlowMonth[];
  overdue: { total: number; count: number };
  beyondHorizon: { total: number; count: number };
  totals: {
    horizonTotal: number;
    grandTotal: number;   // overdue + months + beyond
    installmentsCovered: number;
    monthsCovered: number;
  };
  biggestMonth: { key: string; label: string; amount: number } | null;
  generatedAt: string;
}

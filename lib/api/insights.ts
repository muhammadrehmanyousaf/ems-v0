/**
 * Phase 4 #10.4 — Advanced insights API client.
 */

import axiosInstance from "@/lib/axiosConfig";

export interface FunnelRow {
  source: string;
  total: number;
  contacted: number;
  quoted: number;
  booked: number;
  lost: number;
  contactRate: number;
  quoteRate: number;
  bookingRate: number;
}

export interface MonthlyTrend {
  monthLabel: string;
  monthStart: string;
  bookings: number;
  revenue: number;
  avgTicket: number;
}

export interface InsightsAdvanced {
  generatedAt: string;
  funnel: FunnelRow[];
  quotes: {
    quotesSent: number;
    quotesAccepted: number;
    quoteAcceptanceRate: number | null;
  };
  monthly: MonthlyTrend[];
  customers: {
    unique: number;
    repeatCustomers: number;
    repeatRate: number;
    meanLtv: number;
    medianLtv: number;
    p90Ltv: number;
  };
  forecast: {
    rolling30: number;
    yoy90Revenue: number;
    projection90Trend: number;
    projection90Blend: number;
    methodology: string;
  };
}

export class InsightsAPI {
  static async getAdvanced(): Promise<InsightsAdvanced | null> {
    const res = await axiosInstance.get(
      `/api/v1/analytics/insights-advanced`,
    );
    return res.data?.data ?? null;
  }
}

/**
 * Vendor Portal Phase 4 #10.6 — Annual tax report API client.
 *
 * Mirrors /api/v1/tax. Pakistani fiscal year (1 Jul → 30 Jun) is
 * the default; ?basis=calendar swaps to 1 Jan → 31 Dec.
 */

import axiosInstance from "@/lib/axiosConfig";

export interface AnnualTaxReport {
  period: {
    basis: "fiscal" | "calendar";
    year: number;
    label: string;
    from: string;
    to: string;
  };
  summary: {
    bookingRevenue: number;
    bookingCount: number;
    sheetRevenue: number;
    sheetCount: number;
    fbrSubmittedCount: number;
    fbrSubmittedValue: number;
    totalExpenses: number;
    expenseCount: number;
    netPnl: number;
  };
  expensesByCategory: Record<string, number>;
  months: Array<{
    monthLabel: string;
    revenue: number;
    bookingCount: number;
    expenses: number;
  }>;
  generatedAt: string;
}

export class TaxReportAPI {
  static async getAnnualReport(
    year: number,
    basis: "fiscal" | "calendar" = "fiscal",
  ): Promise<AnnualTaxReport | null> {
    const res = await axiosInstance.get(`/api/v1/tax/annual-report`, {
      params: { year, basis },
    });
    return res.data?.data ?? null;
  }

  static pdfUrl(
    year: number,
    basis: "fiscal" | "calendar" = "fiscal",
  ): string {
    const qs = new URLSearchParams({
      year: String(year),
      basis,
    }).toString();
    return `/api/v1/tax/annual-report.pdf?${qs}`;
  }

  static async pdfBlob(
    year: number,
    basis: "fiscal" | "calendar" = "fiscal",
  ): Promise<Blob> {
    const res = await axiosInstance.get(`/api/v1/tax/annual-report.pdf`, {
      params: { year, basis },
      responseType: "blob",
    });
    return res.data;
  }
}

/**
 * WhatsApp send-log API.
 *
 * Fire-and-forget: the caller AWAITS this only because we want the
 * request to be in-flight before window.open() races the browser's
 * navigation. We swallow errors here so the wa.me link never fails
 * because the log endpoint is unreachable.
 */

import axiosInstance from "@/lib/axiosConfig";

export type WaTargetType = "lead" | "customer" | "booking" | "sheet" | "free";

export interface LogWaSendInput {
  templateKey?: string | null;       // e.g. 'confirm' / 'reminder' / 'thanks' / 'blank'
  templateLabel?: string | null;
  targetType: WaTargetType;
  targetId?: number | null;
  phoneTo: string;
  leadId?: number | null;
  bookingId?: number | null;
  customerId?: number | null;
  functionSheetId?: number | null;
  businessId?: number | null;
  messageBody?: string;
}

export class WhatsappAPI {
  /** Fire-and-forget — never throws. Returns void. */
  static async logSend(input: LogWaSendInput): Promise<void> {
    try {
      await axiosInstance.post("/api/v1/whatsapp/send-log", input);
    } catch {
      // Intentionally swallowed — never block the wa.me open on a
      // logging failure.
    }
  }
}

// ─── Template performance analytics types ─────────────────────────
export interface WhatsappTemplateRow {
  templateKey: string;
  templateLabel: string;
  sends: number;
  firstSentAt: string;
  lastSentAt: string;
  // Soft outcomes — null when no leads/bookings linked.
  leadLinked: number;
  leadBooked: number;
  leadBookedRate: number | null;
  bookingLinked: number;
  bookingCompleted: number;
  bookingCompletedRate: number | null;
  bookingPaid: number;
  bookingPaidRate: number | null;
}
export interface WhatsappByTargetRow {
  type: WaTargetType;
  count: number;
}
export interface WhatsappRecentSend {
  id: number;
  templateKey: string;
  templateLabel: string;
  targetType: WaTargetType;
  sentAt: string;
}
export interface WhatsappTemplatePerformanceData {
  hasData: boolean;
  totalSends: number;
  uniqueTemplates?: number;
  templates: WhatsappTemplateRow[];
  byTargetType: WhatsappByTargetRow[];
  recentSends: WhatsappRecentSend[];
  range: { from: string; to: string };
}

export class WhatsappAnalyticsAPI {
  static async getTemplatePerformance(
    range: "last_30_days" | "this_month" | "this_year" | "last_90_days" = "last_90_days",
  ): Promise<WhatsappTemplatePerformanceData | null> {
    try {
      const res = await axiosInstance.get(
        `/api/v1/analytics/whatsapp-templates?range=${range}`,
      );
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }
}

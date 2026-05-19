/**
 * Phase 5 — AI superpowers API client.
 *
 * Every helper returns null when the backend reports `configured: false`,
 * so call sites can render a graceful disabled state.
 */

import axiosInstance from "@/lib/axiosConfig";

export interface AiStatus {
  configured: boolean;
  features: {
    leadReply: boolean;
    beoLineItems: boolean;
    receiptOcr: boolean;
    reviewSummary: boolean;
  };
}

export interface LeadReplyResult {
  suggestion: string;
  model: string;
  latencyMs: number;
}

export interface BeoLineItem {
  label: string;
  qty: number;
  unitPrice: number;
  notes?: string;
}

export interface BeoLineItemsResult {
  lineItems: BeoLineItem[] | null;
  rawText: string;
  model: string;
  latencyMs: number;
}

export interface ReceiptParseResult {
  data: {
    amount: number | null;
    vendor: string | null;
    date: string | null;
    category: string | null;
    confidence?: number;
  };
  model: string;
  latencyMs: number;
}

export interface ReviewSummaryResult {
  summary: string | null;
  reviewCount: number;
  model: string;
  latencyMs: number;
}

export class AiAPI {
  static async status(): Promise<AiStatus> {
    const res = await axiosInstance.get("/api/v1/ai/status");
    return (
      res.data?.data ?? {
        configured: false,
        features: {
          leadReply: false,
          beoLineItems: false,
          receiptOcr: false,
          reviewSummary: false,
        },
      }
    );
  }

  static async draftLeadReply(leadId: number): Promise<LeadReplyResult | null> {
    try {
      const res = await axiosInstance.post(
        `/api/v1/ai/leads/${leadId}/reply`,
      );
      return res.data?.data ?? null;
    } catch (e: any) {
      if (e?.response?.status === 503) return null;
      throw e;
    }
  }

  static async draftBeoLineItems(
    sheetId: number,
  ): Promise<BeoLineItemsResult | null> {
    try {
      const res = await axiosInstance.post(
        `/api/v1/ai/function-sheets/${sheetId}/beo-line-items`,
      );
      return res.data?.data ?? null;
    } catch (e: any) {
      if (e?.response?.status === 503) return null;
      throw e;
    }
  }

  static async parseReceipt(
    imageBase64: string,
    mediaType: string = "image/jpeg",
  ): Promise<ReceiptParseResult | null> {
    try {
      const res = await axiosInstance.post(
        `/api/v1/ai/expenses/parse-receipt`,
        { imageBase64, mediaType },
      );
      return res.data?.data ?? null;
    } catch (e: any) {
      if (e?.response?.status === 503) return null;
      throw e;
    }
  }

  static async reviewSummary(
    businessId: number,
  ): Promise<ReviewSummaryResult | null> {
    try {
      const res = await axiosInstance.post(
        `/api/v1/ai/businesses/${businessId}/review-summary`,
      );
      return res.data?.data ?? null;
    } catch (e: any) {
      if (e?.response?.status === 503) return null;
      throw e;
    }
  }
}

/**
 * Helper: convert a File to a base64 string suitable for the
 * receipt OCR endpoint. Strips the data: prefix so the server
 * gets a pure base64 payload.
 */
export function fileToBase64(file: File): Promise<{
  base64: string;
  mediaType: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return reject(new Error("Invalid file"));
      resolve({ mediaType: m[1], base64: m[2] });
    };
    reader.readAsDataURL(file);
  });
}

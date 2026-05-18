/**
 * Phase 0 #2 — Bank Details API client.
 *
 * Mirrors the backend at /api/v1/banks. Vendors use this to add /
 * update / activate their payout bank account; without it, payouts
 * are blocked. Today the backend has full CRUD + admin verification
 * wired but no dashboard UI existed — this client + the matching
 * tab close that gap.
 */

import axiosInstance from "@/lib/axiosConfig";

export type BankVerificationMethod =
  | "document"
  | "micro_deposit"
  | "stripe_connect"
  | "manual";

export interface BankDetail {
  id: number;
  userId: number;
  bankName: string;
  accountHolderName: string;
  /** Backend returns masked (last 4 visible) on read. */
  accountNumber: string;
  iban: string | null;
  branchCode: string | null;
  isActive: boolean;
  isVerified: boolean;
  verificationMethod: BankVerificationMethod | null;
  verificationDocumentUrl: string | null;
  verifiedAt: string | null;
  verifiedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertBankDetailInput {
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  iban?: string | null;
  branchCode?: string | null;
  /** Auto-activates this account when true (deactivates siblings). */
  isActive?: boolean;
}

export class BankDetailsAPI {
  /** GET /api/v1/banks/vendor-bank-details — caller's bank accounts. */
  static async listMine(): Promise<BankDetail[]> {
    const res = await axiosInstance.get(`/api/v1/banks/vendor-bank-details`);
    return res.data?.data ?? [];
  }

  /** POST /api/v1/banks/bank-details — add a new bank account. */
  static async create(body: UpsertBankDetailInput): Promise<BankDetail> {
    const res = await axiosInstance.post(`/api/v1/banks/bank-details`, body);
    return res.data?.data;
  }

  /** PATCH /api/v1/banks/bank-details/:id — partial update. */
  static async update(id: number, body: UpsertBankDetailInput): Promise<BankDetail> {
    const res = await axiosInstance.patch(`/api/v1/banks/bank-details/${id}`, body);
    return res.data?.data;
  }

  /** DELETE /api/v1/banks/bank-details/:id — soft/hard delete. */
  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/banks/bank-details/${id}`);
  }

  /** PATCH /api/v1/banks/bank-details/:id/set-active — make this the payout target. */
  static async setActive(id: number): Promise<BankDetail> {
    const res = await axiosInstance.patch(`/api/v1/banks/bank-details/${id}/set-active`);
    return res.data?.data;
  }
}

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
  /** WW-DIRECT-PAY — bank | jazzcash | easypaisa. Absent reads as bank. */
  accountType?: VendorAccountType;
  accountNumber: string;
  iban: string | null;
  branchCode: string | null;
  isActive: boolean;
  isVerified: boolean;
  verificationMethod: BankVerificationMethod | null;
  verificationDocumentUrl: string | null;
  verifiedAt: string | null;
  verifiedByUserId: number | null;
  /**
   * WW-RECORD-MODE — publish this account to customers paying you.
   *
   * These rows have existed only for PAYOUTS (platform → vendor) and were never
   * shown to a customer. In record mode the venue collects the advance directly,
   * so the customer needs an account to transfer to — but repurposing a payout
   * account as a published collection account without asking would be a silent
   * change to live financial data. Opt-in, default false.
   *
   * A customer sees an account that is `showToCustomers` AND `isActive`.
   * `isVerified` is REPORTED to them rather than used to hide the account:
   * once the customer pays the venue directly, hiding an unchecked account
   * does not protect them, it just moves the number into a WhatsApp message
   * where it carries no status at all. Set
   * REQUIRE_VERIFIED_COLLECTION_ACCOUNT=1 on the API to restore the hard gate.
   */
  showToCustomers?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * WW-DIRECT-PAY — the rails a vendor can publish for customers to pay into.
 *
 * A wallet row reuses `accountNumber` for the MOBILE number and
 * `accountHolderName` for the registered name; `iban` and `branchCode` are not
 * sent, because a wallet has neither.
 */
export type VendorAccountType = "bank" | "jazzcash" | "easypaisa";

export interface UpsertBankDetailInput {
  accountType?: VendorAccountType;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  iban?: string | null;
  branchCode?: string | null;
  /** Auto-activates this account when true (deactivates siblings). */
  isActive?: boolean;
  /** WW-RECORD-MODE — show this account to customers paying you. Opt-in. */
  showToCustomers?: boolean;
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

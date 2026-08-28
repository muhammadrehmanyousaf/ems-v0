/**
 * WW-RECORD-MODE — payment instructions and customer payment claims.
 *
 * The platform RECORDS the advance; the venue collects it. Under PEFTA 2007 and
 * the SBP's PSO/PSP Rules a payment service provider cannot act as custodian of
 * a consumer's money, and escrow for domestic e-commerce is open only to EMIs —
 * so "we hold your deposit until the vendor confirms" was never something this
 * product could lawfully do, and the payment screen said it anyway.
 *
 * What the customer needs instead: the venue's real account, a reference the
 * venue can match against their bank statement, and a way to say they've paid.
 */

import axiosInstance from "@/lib/axiosConfig";

/** What kind of account this is. Wallets carry no IBAN and no branch code. */
export type PublishedAccountType = "bank" | "jazzcash" | "easypaisa";

export interface PublishedBankAccount {
  id: number;
  /** WW-DIRECT-PAY — absent on older payloads, which are all bank accounts. */
  accountType?: PublishedAccountType;
  /** "JazzCash" / "Easypaisa" / the bank's own name. */
  railLabel?: string;
  bankName: string;
  accountHolderName: string;
  /** For a wallet this is the mobile number the money is sent to. */
  accountNumber: string;
  /** NULL for a wallet — it has no IBAN, and showing a stale one misdirects. */
  iban: string | null;
  branchCode: string | null;
  /**
   * Whether an admin has checked this account. REPORTED, not enforced: hiding
   * an unverified account does not protect a customer who now pays the venue
   * directly, it just moves the account number into a WhatsApp message where
   * it carries no status at all. The screen marks it instead.
   */
  isVerified?: boolean;
}

export interface PaymentVendor {
  businessId: number;
  businessName: string | null;
  acceptsCash: boolean;
  acceptsBankTransfer: boolean;
  whatsappNumber: string | null;
  /**
   * Only accounts the vendor has PUBLISHED — opted in and active. Bank first,
   * then JazzCash / Easypaisa. Empty is a normal, safe state: the UI offers
   * cash or asks the customer to contact the venue, and never invents one.
   */
  accounts: PublishedBankAccount[];
}

export interface PaymentInstructions {
  bookingId: number;
  /** e.g. "BK-48219" — what the customer writes on the transfer. */
  reference: string;
  paymentType: "down_payment" | "remaining" | "full_payment" | null;
  amountDue: number;
  currency: string;
  paymentStatus: string;
  bookingStatus: string;
  totalAmount: number;
  /** The advance the booking REQUIRES — what to transfer. */
  advanceDue?: number;
  /** What has actually been received so far. */
  amountReceived?: number;
  /** Legacy alias for `advanceDue`; kept so older callers keep working. */
  downPayment: number;
  vendors: PaymentVendor[];
  /** FALSE ⇒ no vendor has published an account; do not show a transfer form. */
  bankTransferAvailable: boolean;
  /**
   * TRUE ⇒ a vendor on this booking has not accepted yet, so the customer must
   * NOT be asked to transfer. The server has always sent this and the client
   * type omitted it, so every caller was free to ignore it — and the pay page
   * did, asking for money against bookings the venue could still decline.
   */
  awaitingVendorApproval: boolean;
  /** Always "vendor_direct" — the venue collects, the platform records. */
  collectionModel: string;
}

export type ClaimMethod =
  | "bank_transfer"
  | "raast"
  | "ibft"
  | "jazzcash"
  | "easypaisa"
  | "cash";

export interface PaymentClaim {
  id: number;
  bookingId: number;
  amount: number | string;
  method: ClaimMethod | string;
  paymentType: string;
  transactionRef: string | null;
  proofUrl: string | null;
  notes: string | null;
  claimedAt: string;
  status: "pending" | "confirmed" | "rejected";
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export class PaymentInstructionsAPI {
  /**
   * What to pay, to whom, with what reference.
   *
   * Returns full account numbers, so the server restricts it to the booking's
   * own participants.
   */
  static async get(bookingId: number | string): Promise<PaymentInstructions> {
    const res = await axiosInstance.get(
      `/api/v1/bookings/${bookingId}/payment-instructions`,
    );
    return res.data?.data;
  }

  /**
   * "I've transferred."
   *
   * Moves no money and changes no status — the vendor confirms once it shows in
   * their account. The AMOUNT is deliberately not sent: the server uses its own
   * figure, so a claim can never name an arbitrary sum.
   */
  static async claim(
    bookingId: number | string,
    body: {
      method: ClaimMethod;
      transactionRef?: string;
      proofUrl?: string;
      notes?: string;
      paymentType?: string;
    },
  ): Promise<{ claim: PaymentClaim; reference: string }> {
    const res = await axiosInstance.post(
      `/api/v1/bookings/${bookingId}/payment-claims`,
      body,
    );
    return res.data?.data;
  }

  /**
   * Attach the transfer screenshot to a claim already filed.
   *
   * Deliberately a separate call from `claim()`: a failed or slow upload must
   * never lose the report itself. The bank reference alone is enough for the
   * venue to find the payment; the image is corroboration.
   */
  static async attachProof(
    bookingId: number | string,
    claimId: number,
    file: File,
  ): Promise<PaymentClaim> {
    const fd = new FormData();
    fd.append("proof", file);
    const res = await axiosInstance.post(
      `/api/v1/bookings/${bookingId}/payment-claims/${claimId}/proof`,
      fd,
      // Let the browser set the multipart boundary; a hand-written
      // Content-Type here produces a body the server cannot parse.
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data?.data?.claim;
  }

  /** The shared thread — both the customer and the vendor read the same rows. */
  static async list(bookingId: number | string): Promise<PaymentClaim[]> {
    const res = await axiosInstance.get(
      `/api/v1/bookings/${bookingId}/payment-claims`,
    );
    return res.data?.data?.claims ?? [];
  }

  /** Vendor checked and the money is not there. A reason is required. */
  static async reject(claimId: number, reason: string): Promise<PaymentClaim> {
    const res = await axiosInstance.patch(
      `/api/v1/payment-claims/${claimId}/reject`,
      { reason },
    );
    return res.data?.data?.claim;
  }
}

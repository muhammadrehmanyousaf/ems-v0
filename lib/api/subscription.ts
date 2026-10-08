/**
 * Subscription / plan API (§17.1, D6). Read current tier + catalog,
 * register an upgrade intent.
 *
 * There is no payment integration (D7) and the prices are placeholders —
 * both facts now travel to the client on `MyPlanData.pricing` rather than
 * living only in a comment here, because a comment is not a disclosure
 * (WWL-434).
 */

import axiosInstance from "@/lib/axiosConfig";

export type SubscriptionTier = "free" | "pro" | "premium";

export interface PlanCatalogEntry {
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  pricePkrMonthly: number;
  highlights: string[];
  caps: string[];
}

/** One gated feature, with a flag per tier. Drives the comparison table. */
export interface PlanComparisonRow {
  key: string;
  label: string;
  minTier: SubscriptionTier;
  free: boolean;
  pro: boolean;
  premium: boolean;
  /** The public "Premium" plan; absent on an older API response. */
  elite?: boolean;
}

export interface PricingNote {
  indicative: boolean;
  taxNote: string;
  disclosure: string;
}

export interface DeclineTrace {
  tier: SubscriptionTier;
  tierName: string;
  declinedAt: string | null;
  reason: string | null;
}

export interface MyPlanData {
  currentTier: SubscriptionTier;
  rawTier?: SubscriptionTier;
  subscriptionExpired?: boolean;
  subscriptionStartsAt: string | null;
  subscriptionEndsAt: string | null;
  pendingUpgradeTier: SubscriptionTier | null;
  upgradeRequestedAt: string | null;
  lastDecline?: DeclineTrace | null;
  plans: PlanCatalogEntry[];
  comparison?: PlanComparisonRow[];
  pricing?: PricingNote;
  tierNames?: Record<string, string>;
  /** Our free trial (no card). 0 = off. */
  trialDays?: number;
  trialEligible?: boolean;
}

export interface UpgradeRequestRow {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  vendorType: string | null;
  subscriptionTier: SubscriptionTier;
  pendingUpgradeTier: SubscriptionTier;
  upgradeRequestedAt: string | null;
}

/** What the portal gate and the billing page read. Set only by Safepay webhooks. */
export type BillingAccess = "active" | "past_due" | "pending" | "none";

export interface BillingSubscriptionRow {
  reference: string;
  tier: string;
  status: "pending" | "abandoned" | "active" | "payment_failed" | "paused" | "trialing" | "cancelled" | "superseded" | "lapsed";
  activatedAt: string | null;
  trialEndsAt?: string | null;
  currentPeriodEndsAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  createdAt: string;
}

export interface BillingStatus {
  access: BillingAccess;
  tier: string;
  /** BILLING_ENFORCE=1 on the server: the portal is closed without a paid plan. */
  enforced: boolean;
  environment: "sandbox" | "live";
  subscriptionEndsAt: string | null;
  /** The row that governs access: the live one, else a cancelled one with paid days left, else the newest. */
  subscription: BillingSubscriptionRow | null;
  /** A checkout started in the last two hours that Safepay has not confirmed yet. */
  pending: { reference: string; tier: string; createdAt: string } | null;
}

export interface CheckoutStart {
  checkoutUrl: string;
  reference: string;
  tier: string;
  amountPkrMonthly: number;
  environment: "sandbox" | "live";
}

/** One successful subscription charge — the row behind a receipt. */
export interface SubscriptionPaymentRow {
  id: number;
  receiptNo: string;
  tier: string;
  transactionId: string | null;
  amountPaisas: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
  environment: "sandbox" | "live";
  /** Recorded refunds against this charge, in paisas (0 when none). */
  refundedPaisas?: number;
  refundedAt?: string | null;
}

export interface SubscriptionReceipt {
  receipt: SubscriptionPaymentRow & { user?: { fullName: string | null; email: string | null; phoneNumber: string | null } };
  planName: string;
  issuer: { name: string; legalName: string; ntn: string; address: string; email: string; taxNote: string };
}

/** Super-admin: one Safepay subscription row with its vendor. */
export interface AdminSafepayRow extends BillingSubscriptionRow {
  id: number;
  userId: number;
  environment: "sandbox" | "live";
  safepaySubscriptionId: string | null;
  lastTransactionId: string | null;
  amountPaisas: number | null;
  replacesSubscriptionId?: number | null;
  creditDays?: number | null;
  pausedAt?: string | null;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  reconciledAt?: string | null;
  user: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null; vendorType: string | null; subscriptionTier: string; subscriptionEndsAt: string | null } | null;
}

export interface AdminSafepayLedger {
  environment: "sandbox" | "live";
  enforced: boolean;
  subscriptions: AdminSafepayRow[];
}

/** What switching plans would mean, before the vendor commits. */
export interface PlanChangePreview {
  allowed: boolean;
  /** The base plan is cancelled with paid days left: a new checkout reactivates it with those days as credit. */
  reactivation?: boolean;
  /** The base plan is a running free trial: paying now carries the unused trial days over. */
  fromTrial?: boolean;
  currentTier: string;
  currentPlanName: string;
  newTier: string;
  newPlanName: string;
  sameTier: boolean;
  unusedDays: number;
  creditDays: number;
  chargeNowPaisas: number;
  newPeriodEndsAt: string;
  oldPeriodEndsAt: string | null;
}

export interface AdminSafepayPaymentRow extends SubscriptionPaymentRow {
  refundReason: string | null;
  refundRef: string | null;
  user: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null } | null;
}

export class SubscriptionAPI {
  /** Vendor: preview a plan change (or a card change on the same tier). */
  static async changePlanPreview(tier: string): Promise<PlanChangePreview> {
    const res = await axiosInstance.get(`/api/v1/subscriptions/change-preview?tier=${encodeURIComponent(tier)}`);
    return res.data?.data as PlanChangePreview;
  }

  /** Vendor: start the hosted checkout for the new plan; the old one is cancelled once Safepay confirms. */
  static async startPlanChange(tier: string): Promise<CheckoutStart & { replaces: { tier: string; creditDays: number } }> {
    const res = await axiosInstance.post("/api/v1/subscriptions/change-plan", { tier });
    return res.data?.data;
  }

  /** Vendor: start the free trial (ours, no card). Once per vendor. */
  static async startTrial(tier: string): Promise<{ trialEndsAt: string; access: BillingAccess; subscription: BillingSubscriptionRow | null }> {
    const res = await axiosInstance.post("/api/v1/subscriptions/trial", { tier });
    return res.data?.data;
  }

  /** Vendor: cancel at Safepay and locally; access runs to the paid period end. */
  /** The vendor walked away from (or cancelled on) Safepay: free the screen at once. */
  static async cancelCheckout(): Promise<{ cancelled: number }> {
    const res = await axiosInstance.post("/api/v1/subscriptions/checkout/cancel", {});
    return res.data?.data;
  }

  static async cancelSubscription(reason?: string): Promise<{ access: BillingAccess; subscriptionEndsAt: string | null; subscription: BillingSubscriptionRow | null }> {
    const res = await axiosInstance.post("/api/v1/subscriptions/cancel", reason ? { reason } : {});
    return res.data?.data;
  }

  // Super-admin actions on one subscription row
  static async adminSubscriptionAction(id: number, action: "cancel" | "pause" | "resume" | "reconcile", body: Record<string, unknown> = {}): Promise<{ message: string; subscription: AdminSafepayRow }> {
    const res = await axiosInstance.post(`/api/v1/subscriptions/admin/safepay/subscriptions/${id}/${action}`, body);
    return { message: res.data?.message, subscription: res.data?.data?.subscription };
  }

  /** Super-admin, sandbox only: cancel sandbox subscriptions at Safepay, delete sandbox rows, return vendors to free. */
  static async adminResetSandbox(): Promise<{ message: string; result: { rows: number; cancelledAtSafepay: number; cancelFailed: string[]; receipts: number; events: number; usersReset: number } }> {
    const res = await axiosInstance.post("/api/v1/subscriptions/admin/safepay/sandbox-reset", {});
    return { message: res.data?.message, result: res.data?.data };
  }

  static async adminReconcileAll(): Promise<{ checked: number; changed: number; failed: number }> {
    const res = await axiosInstance.post("/api/v1/subscriptions/admin/safepay/reconcile", {});
    return res.data?.data;
  }

  static async adminListPayments(): Promise<AdminSafepayPaymentRow[]> {
    const res = await axiosInstance.get("/api/v1/subscriptions/admin/safepay/payments");
    return (res.data?.data?.payments ?? []) as AdminSafepayPaymentRow[];
  }

  static async adminRecordRefund(paymentId: number, body: { amountPaisas: number; reason?: string; ref?: string }): Promise<AdminSafepayPaymentRow> {
    const res = await axiosInstance.post(`/api/v1/subscriptions/admin/safepay/payments/${paymentId}/refund`, body);
    return res.data?.data?.payment;
  }

  /** Super-admin: every Safepay subscription row, newest first. */
  static async adminListSafepaySubscriptions(): Promise<AdminSafepayLedger> {
    const res = await axiosInstance.get("/api/v1/subscriptions/admin/safepay/subscriptions");
    const d = res.data?.data ?? {};
    return { environment: d.environment ?? "live", enforced: !!d.enforced, subscriptions: d.subscriptions ?? [] };
  }

  /** Every successful charge, newest first. */
  static async listPayments(): Promise<SubscriptionPaymentRow[]> {
    const res = await axiosInstance.get("/api/v1/subscriptions/payments");
    return (res.data?.data?.payments ?? []) as SubscriptionPaymentRow[];
  }

  /** One receipt by number; only the payer's own. */
  static async getReceipt(receiptNo: string): Promise<SubscriptionReceipt> {
    const res = await axiosInstance.get(`/api/v1/subscriptions/payments/${encodeURIComponent(receiptNo)}`);
    return res.data?.data as SubscriptionReceipt;
  }

  /** Where the vendor stands with Safepay right now. */
  static async getBillingStatus(): Promise<BillingStatus> {
    const res = await axiosInstance.get("/api/v1/subscriptions/status");
    return res.data?.data as BillingStatus;
  }

  /**
   * Start a hosted Safepay checkout for a tier. The server creates the
   * pending record and returns the URL; the browser is then sent there. The
   * amount is the server's — only the tier name travels.
   */
  static async startCheckout(tier: string): Promise<CheckoutStart> {
    const res = await axiosInstance.post("/api/v1/subscriptions/checkout", { tier });
    return res.data?.data as CheckoutStart;
  }

  /**
   * WWL-443 — this used to `catch { return null }`. The view then rendered
   * `plans = []`, so a failed request produced a billing page with NO PLANS ON
   * IT and a current-plan line reading "—", with no error, no retry and no
   * toast. A fault was indistinguishable from a product decision. Let it throw;
   * the caller has an error state now.
   */
  static async getMyPlan(): Promise<MyPlanData> {
    const res = await axiosInstance.get("/api/v1/subscriptions/me");
    const data = res.data?.data;
    if (!data) throw new Error("The plan catalog came back empty.");
    return data as MyPlanData;
  }

  /**
   * `replacePending` must be passed deliberately: with a request already
   * outstanding the server answers 409 rather than overwriting it (WWL-440).
   */
  static async requestUpgrade(tier: SubscriptionTier, replacePending = false): Promise<void> {
    await axiosInstance.post("/api/v1/subscriptions/request-upgrade", {
      tier,
      ...(replacePending ? { replacePending: true } : {}),
    });
  }

  // Super-admin
  static async listUpgradeRequests(): Promise<UpgradeRequestRow[]> {
    const res = await axiosInstance.get("/api/v1/subscriptions/admin/upgrade-requests");
    return res.data?.data?.requests ?? [];
  }

  static async activate(userId: number, months?: number): Promise<void> {
    await axiosInstance.post(`/api/v1/subscriptions/admin/${userId}/activate`, months ? { months } : {});
  }

  static async decline(userId: number, reason?: string): Promise<void> {
    await axiosInstance.post(`/api/v1/subscriptions/admin/${userId}/decline`, reason ? { reason } : {});
  }
}

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

export class SubscriptionAPI {
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

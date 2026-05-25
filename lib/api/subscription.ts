/**
 * Subscription / plan API (§17.1, D6). Read current tier + catalog,
 * register an upgrade intent. No payment integration yet (D7).
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

export interface MyPlanData {
  currentTier: SubscriptionTier;
  subscriptionStartsAt: string | null;
  subscriptionEndsAt: string | null;
  pendingUpgradeTier: SubscriptionTier | null;
  upgradeRequestedAt: string | null;
  plans: PlanCatalogEntry[];
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
  static async getMyPlan(): Promise<MyPlanData | null> {
    try {
      const res = await axiosInstance.get("/api/v1/subscriptions/me");
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  static async requestUpgrade(tier: SubscriptionTier): Promise<void> {
    await axiosInstance.post("/api/v1/subscriptions/request-upgrade", { tier });
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

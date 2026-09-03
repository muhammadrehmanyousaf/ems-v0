/**
 * Automation builder API (§M10) — vendor-defined no-code rules.
 * MVP: "N days before/after any event → notify me".
 */

import axiosInstance from "@/lib/axiosConfig";

export type TriggerType = "days_before_event" | "days_after_event";
export type ActionType = "notify_me";

export interface AutomationRule {
  id: number;
  createdByUserId: number;
  businessId: number | null;
  name: string;
  triggerType: TriggerType;
  offsetDays: number;
  actionType: ActionType;
  message: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  createdAt: string;
}

export interface CreateRuleInput {
  name: string;
  triggerType: TriggerType;
  offsetDays: number;
  actionType?: ActionType;
  message?: string;
  enabled?: boolean;
}

/** Built-in reminder toggle (server-defined; the vendor only opts in/out). */
export interface BuiltInReminder {
  kind: string;
  label: string;
  description: string;
  enabled: boolean;        // effective = vendorEnabled && !envDisabled
  envFlag?: string;
  envDisabled: boolean;    // ops kill-switch, wins over vendor pref
  vendorEnabled: boolean;  // the per-vendor opt-out the toggle sets
  delegated: boolean;      // handled by an external cron
}
export interface AutomationStatus {
  engine: { enabled: boolean; intervalMs: number };
  rules: BuiltInReminder[];
}

export class AutomationRulesAPI {
  /** Built-in reminders + engine status (the toggle surface). */
  static async getStatus(): Promise<AutomationStatus> {
    const res = await axiosInstance.get("/api/v1/automation/status");
    return res.data?.data ?? { engine: { enabled: false, intervalMs: 0 }, rules: [] };
  }
  /** Flip one built-in reminder on/off for this vendor. */
  static async setPref(kind: string, enabled: boolean): Promise<void> {
    await axiosInstance.patch("/api/v1/automation/prefs", { kind, enabled });
  }
  static async list(): Promise<{ rules: AutomationRule[]; triggerTypes: TriggerType[]; actionTypes: ActionType[] }> {
    const res = await axiosInstance.get("/api/v1/automation/rules");
    return res.data?.data ?? { rules: [], triggerTypes: [], actionTypes: [] };
  }
  static async create(input: CreateRuleInput): Promise<AutomationRule> {
    const res = await axiosInstance.post("/api/v1/automation/rules", input);
    return res.data?.data?.rule;
  }
  static async update(id: number, input: Partial<CreateRuleInput>): Promise<AutomationRule> {
    const res = await axiosInstance.patch(`/api/v1/automation/rules/${id}`, input);
    return res.data?.data?.rule;
  }
  static async toggle(id: number, enabled: boolean): Promise<AutomationRule> {
    const res = await axiosInstance.patch(`/api/v1/automation/rules/${id}`, { enabled });
    return res.data?.data?.rule;
  }
  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/automation/rules/${id}`);
  }
}

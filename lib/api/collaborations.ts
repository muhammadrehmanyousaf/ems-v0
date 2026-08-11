/**
 * Vendor↔vendor collaboration API (M23 Layer 2, §20.2). Invite another
 * Wedding Wala vendor to collaborate on an event; they accept/decline.
 * Amounts tracked, not collected (payment = later).
 */

import axiosInstance from "@/lib/axiosConfig";

export type CollabStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface CollabInvite {
  id: number;
  fromUserId: number;
  fromName: string | null;
  toUserId: number | null;
  toPhone: string | null;
  toEmail: string | null;
  toNameSnapshot: string | null;
  eventLabel: string | null;
  scope: string | null;
  agreedAmount: number | string | null;
  functionSheetId: number | null;
  status: CollabStatus;
  declineReason: string | null;
  respondedAt: string | null;
  createdAt: string;
  fromVendor?: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null } | null;
  toVendor?: { id: number; fullName: string | null } | null;
}

/** A vendor already on Wedding Wala, for the invite picker. */
export interface DirectoryVendor {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  vendorType: string | null;
  profileImage: string | null;
}

export interface SendCollabInput {
  toPhone?: string;
  toEmail?: string;
  toName?: string;
  eventLabel?: string;
  scope?: string;
  agreedAmount?: number;
  functionSheetId?: number;
}

export class CollaborationsAPI {
  static async send(input: SendCollabInput): Promise<{
    invite: CollabInvite;
    matched: boolean;
    /** True when we actually queued an invitation email to an off-platform vendor. */
    emailed?: boolean;
    /** The signup link, so the sender can pass it on themselves if they prefer. */
    joinUrl?: string | null;
  }> {
    const res = await axiosInstance.post("/api/v1/collaborations", input);
    return res.data?.data;
  }
  /**
   * Who can I invite? Searching the directory and picking a vendor makes the
   * phone/email match exact by construction, instead of depending on the sender
   * typing a stranger's contact details correctly from memory.
   */
  static async directory(q: string): Promise<DirectoryVendor[]> {
    const res = await axiosInstance.get("/api/v1/collaborations/directory", { params: { q } });
    return res.data?.data?.vendors ?? [];
  }
  /** Chase an off-platform invite that has not been answered. */
  static async resend(id: number): Promise<{ joinUrl?: string | null }> {
    const res = await axiosInstance.post(`/api/v1/collaborations/${id}/resend`, {});
    return res.data?.data ?? {};
  }
  static async incoming(): Promise<CollabInvite[]> {
    const res = await axiosInstance.get("/api/v1/collaborations/incoming");
    return res.data?.data?.invites ?? [];
  }
  static async outgoing(): Promise<CollabInvite[]> {
    const res = await axiosInstance.get("/api/v1/collaborations/outgoing");
    return res.data?.data?.invites ?? [];
  }
  static async accept(id: number): Promise<void> {
    await axiosInstance.post(`/api/v1/collaborations/${id}/accept`, {});
  }
  static async decline(id: number, reason?: string): Promise<void> {
    await axiosInstance.post(`/api/v1/collaborations/${id}/decline`, reason ? { reason } : {});
  }
  static async cancel(id: number): Promise<void> {
    await axiosInstance.post(`/api/v1/collaborations/${id}/cancel`, {});
  }
}

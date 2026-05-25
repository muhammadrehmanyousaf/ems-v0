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
  static async send(input: SendCollabInput): Promise<{ invite: CollabInvite; matched: boolean }> {
    const res = await axiosInstance.post("/api/v1/collaborations", input);
    return res.data?.data;
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

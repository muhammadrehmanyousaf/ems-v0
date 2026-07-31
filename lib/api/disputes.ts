// BK-067 admin queue — list + resolve. Customer-facing open/get is on
// `BookingAPI` (lib/api/bookings.ts); this module is admin-only.

import axiosInstance from "../axiosConfig";
import type { BookingDispute } from "./bookings";

export type DisputeStatus = BookingDispute["status"];
export type DisputeStatusFilter = "open" | "resolved" | "all";

export type DisputeResolution =
  | "refund"
  | "release"
  | "dismissed"
  | "forfeit";

export interface AdminDisputeRow extends BookingDispute {
  openedBy?: { id: number; fullName: string | null; email: string | null } | null;
  resolvedBy?: { id: number; fullName: string | null; email: string | null } | null;
  booking?: {
    id: number;
    bookingDate: string;
    status: string;
    customerName: string | null;
    customerEmail: string | null;
    totalAmount: string | number | null;
  } | null;
  openedAt: string;
}

export interface AdminDisputeList {
  rows: AdminDisputeRow[];
  count: number;
  page: number;
  limit: number;
}

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T;
}

export async function listAdminDisputes(params: {
  status?: DisputeStatusFilter | DisputeStatus;
  bookingId?: number;
  page?: number;
  limit?: number;
} = {}): Promise<AdminDisputeList> {
  const res = await axiosInstance.get(`/api/v1/admin/disputes`, { params });
  return (
    unwrap<AdminDisputeList>(res) ?? { rows: [], count: 0, page: 1, limit: 20 }
  );
}

/**
 * Disputes across the CALLER's own bookings.
 *
 * Distinct from listAdminDisputes, which hits the superAdmin-gated platform
 * queue and returns 403 for a vendor. Scope is enforced server-side by an inner
 * join on `booking.vendorIds @> [caller]`, so no scoping argument is accepted
 * or needed here — passing a bookingId narrows within your own bookings, it
 * cannot reach someone else's.
 *
 * No default status filter: a vendor looking at a customer wants the whole
 * history, settled disputes included.
 */
export async function listMyDisputes(params: {
  status?: "open" | "resolved";
  bookingId?: number;
  customerEmail?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminDisputeList> {
  const res = await axiosInstance.get(`/api/v1/bookings/my-disputes`, { params });
  return (
    unwrap<AdminDisputeList>(res) ?? { rows: [], count: 0, page: 1, limit: 50 }
  );
}

export async function resolveDispute(
  disputeId: number,
  body: { resolution: DisputeResolution; notes?: string },
): Promise<{ dispute: AdminDisputeRow; restoredPayoutCount: number }> {
  const res = await axiosInstance.post(
    `/api/v1/admin/disputes/${disputeId}/resolve`,
    body,
  );
  return (
    unwrap<{ dispute: AdminDisputeRow; restoredPayoutCount: number }>(res) ?? {
      dispute: null as unknown as AdminDisputeRow,
      restoredPayoutCount: 0,
    }
  );
}

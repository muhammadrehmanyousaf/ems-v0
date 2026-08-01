// Platform complaints — admin queue + a user's own complaints.
//
// Public intake does NOT go through here: it posts to the Next route handler
// at /api/complaints so it works for people who are not signed in.

import axiosInstance from "../axiosConfig";

export type ComplaintStatus = "open" | "in_progress" | "resolved" | "dismissed";

export type ComplaintCategory =
  | "vendor_conduct"
  | "booking_problem"
  | "payment_problem"
  | "listing_incorrect"
  | "app_problem"
  | "other";

export interface ComplaintRow {
  id: number;
  reference: string;
  raisedByUserId: number | null;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  category: ComplaintCategory;
  subject: string;
  body: string;
  bookingId: number | null;
  aboutBusinessId: number | null;
  status: ComplaintStatus;
  resolutionNotes: string | null;
  escalationPath: string | null;
  resolvedByUserId: number | null;
  resolvedAt: string | null;
  dueAt: string | null;
  createdAt: string;
}

export interface ComplaintCounts {
  open: number;
  inProgress: number;
  overdue: number;
}

export interface ComplaintList {
  rows: ComplaintRow[];
  count: number;
  page: number;
  limit: number;
  counts: ComplaintCounts;
}

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T;
}

export async function listComplaints(params: {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  q?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<ComplaintList> {
  const res = await axiosInstance.get("/api/v1/complaints", { params });
  return unwrap<ComplaintList>(res);
}

export async function getComplaint(id: number): Promise<ComplaintRow> {
  const res = await axiosInstance.get(`/api/v1/complaints/${id}`);
  return unwrap<ComplaintRow>(res);
}

export async function setComplaintStatus(
  id: number,
  status: "open" | "in_progress",
): Promise<ComplaintRow> {
  const res = await axiosInstance.patch(`/api/v1/complaints/${id}/status`, { status });
  return unwrap<ComplaintRow>(res);
}

export async function resolveComplaint(
  id: number,
  payload: {
    status?: "resolved" | "dismissed";
    resolutionNotes: string;
    escalationPath?: string;
  },
): Promise<ComplaintRow> {
  const res = await axiosInstance.post(`/api/v1/complaints/${id}/resolve`, payload);
  return unwrap<ComplaintRow>(res);
}

export async function listMyComplaints(): Promise<ComplaintRow[]> {
  const res = await axiosInstance.get("/api/v1/complaints/mine");
  return unwrap<ComplaintRow[]>(res) ?? [];
}

export const CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  vendor_conduct: "Vendor conduct",
  booking_problem: "Booking problem",
  payment_problem: "Payment problem",
  listing_incorrect: "Listing incorrect",
  app_problem: "App problem",
  other: "Other",
};

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

// Platform complaints — admin queue + vendor bug reports and bidirectional messaging.

import axiosInstance from "../axiosConfig";

export type ComplaintStatus =
  | "open"
  | "in_progress"
  | "waiting_on_vendor"
  | "resolved"
  | "dismissed";

export type ComplaintCategory =
  | "bug_report"
  | "app_problem"
  | "booking_problem"
  | "payment_problem"
  | "listing_incorrect"
  | "vendor_conduct"
  | "other";

export interface ComplaintMessage {
  id: string;
  senderId: number | null;
  senderRole: "vendor" | "admin";
  senderName: string;
  message: string;
  attachments?: string[];
  isResolution?: boolean;
  createdAt: string;
}

export interface ComplaintTelemetry {
  url?: string;
  userAgent?: string;
  screen?: string;
  businessId?: number | null;
  businessName?: string | null;
}

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
  thread?: ComplaintMessage[];
  telemetry?: ComplaintTelemetry | null;
  severity?: "low" | "medium" | "high" | "critical";
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
  status: "open" | "in_progress" | "waiting_on_vendor",
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

export async function submitComplaint(payload: {
  category: ComplaintCategory;
  subject: string;
  body: string;
  severity?: "low" | "medium" | "high" | "critical";
  telemetry?: ComplaintTelemetry;
  attachments?: string[];
  bookingId?: number | null;
  aboutBusinessId?: number | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<{ reference: string; dueAt?: string; id?: number }> {
  const res = await axiosInstance.post("/api/v1/complaints", payload);
  return unwrap(res);
}

export async function postComplaintMessage(
  id: number,
  payload: { message: string; attachments?: string[] }
): Promise<ComplaintRow> {
  const res = await axiosInstance.post(`/api/v1/complaints/${id}/messages`, payload);
  return unwrap<ComplaintRow>(res);
}

export const CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  bug_report: "Bug Report & Glitch",
  app_problem: "Portal / App Issue",
  booking_problem: "Booking Problem",
  payment_problem: "Payment / Billing Problem",
  vendor_conduct: "Vendor Conduct",
  listing_incorrect: "Listing Incorrect",
  other: "Other Inquiry",
};

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_vendor: "Waiting on Vendor",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

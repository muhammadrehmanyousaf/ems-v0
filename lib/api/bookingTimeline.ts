/**
 * Vendor Portal Phase 1 #7.6 — Day-of timeline API client.
 *
 * Mirrors the backend at:
 *   /api/v1/bookings/:bookingId/timeline   (by-booking sub-routes)
 *   /api/v1/timeline-tasks                 (per-task + today)
 *
 * Vendor-scoped on both — vendor must own one of the booking's
 * linked Businesses. Admin bypass available.
 */

import axiosInstance from "@/lib/axiosConfig";

export type TimelineCategory = "setup" | "event" | "teardown";
export type TimelineStatus = "pending" | "in_progress" | "done" | "skipped";

export interface TimelineTask {
  id: number;
  bookingId: number;
  label: string;
  category: TimelineCategory;
  scheduledTime: string | null; // HH:MM:SS
  durationMin: number | null;
  assignedTo: string | null;
  status: TimelineStatus;
  doneAt: string | null;
  notes: string | null;
  sortOrder: number;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayEvent {
  booking: {
    id: number;
    customerName: string | null;
    customerPhone: string | null;
    bookingDate: string | null;
    bookingTime: string | null;
    status: string;
    totalAmount: number | string | null;
    primaryBusiness: { id: number; name: string | null } | null;
  };
  tasks: TimelineTask[];
}

export interface TodayResponse {
  date: string; // YYYY-MM-DD
  events: TodayEvent[];
}

export type TimelineEventKind =
  | "mehndi"
  | "nikah"
  | "baraat"
  | "walima"
  | "engagement"
  | "dholki"
  | "generic";

export const TIMELINE_EVENT_KINDS: TimelineEventKind[] = [
  "mehndi",
  "nikah",
  "baraat",
  "walima",
  "engagement",
  "dholki",
  "generic",
];

export const TIMELINE_EVENT_KIND_LABELS: Record<TimelineEventKind, string> = {
  mehndi: "Mehndi",
  nikah: "Nikah",
  baraat: "Baraat",
  walima: "Walima",
  engagement: "Engagement",
  dholki: "Dholki",
  generic: "Generic event",
};

export interface CreateTaskInput {
  label: string;
  category?: TimelineCategory;
  scheduledTime?: string;
  durationMin?: number;
  assignedTo?: string;
  notes?: string;
  sortOrder?: number;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export class BookingTimelineAPI {
  /** GET /api/v1/bookings/:bookingId/timeline */
  static async list(bookingId: number): Promise<TimelineTask[]> {
    const res = await axiosInstance.get(
      `/api/v1/bookings/${bookingId}/timeline`,
    );
    return res.data?.data?.tasks ?? [];
  }

  /** POST /api/v1/bookings/:bookingId/timeline */
  static async create(
    bookingId: number,
    body: CreateTaskInput,
  ): Promise<TimelineTask> {
    const res = await axiosInstance.post(
      `/api/v1/bookings/${bookingId}/timeline`,
      body,
    );
    return res.data?.data?.task;
  }

  /** POST /api/v1/bookings/:bookingId/timeline/from-template */
  static async seedFromTemplate(
    bookingId: number,
    body: { kind?: TimelineEventKind; anchorTime?: string },
  ): Promise<TimelineTask[]> {
    const res = await axiosInstance.post(
      `/api/v1/bookings/${bookingId}/timeline/from-template`,
      body,
    );
    return res.data?.data?.tasks ?? [];
  }

  /** PATCH /api/v1/timeline-tasks/:id */
  static async update(id: number, body: UpdateTaskInput): Promise<TimelineTask> {
    const res = await axiosInstance.patch(`/api/v1/timeline-tasks/${id}`, body);
    return res.data?.data?.task;
  }

  /** POST /api/v1/timeline-tasks/:id/status */
  static async setStatus(id: number, status: TimelineStatus): Promise<TimelineTask> {
    const res = await axiosInstance.post(
      `/api/v1/timeline-tasks/${id}/status`,
      { status },
    );
    return res.data?.data?.task;
  }

  /** DELETE /api/v1/timeline-tasks/:id — soft delete. */
  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/timeline-tasks/${id}`);
  }

  /** GET /api/v1/timeline-tasks/today */
  static async today(): Promise<TodayResponse> {
    const res = await axiosInstance.get(`/api/v1/timeline-tasks/today`);
    return res.data?.data ?? { date: "", events: [] };
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<TimelineCategory, string> = {
  setup: "Setup",
  event: "Event",
  teardown: "Teardown",
};

export const CATEGORY_TONES: Record<
  TimelineCategory,
  { bg: string; text: string; border: string }
> = {
  setup: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  event: { bg: "bg-bridal-cream/60", text: "text-bridal-gold-dark", border: "border-bridal-gold/40" },
  teardown: { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-300" },
};

export const STATUS_LABELS: Record<TimelineStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
};

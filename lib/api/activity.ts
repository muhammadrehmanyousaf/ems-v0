import axiosInstance from "../axiosConfig";

/**
 * Activity & Audit Engine — typed client for /api/v1/activity (Phase 2).
 * Every response event carries `humanized` (the feed sentence) so the UI can
 * render without re-deriving copy.
 */

export interface ActivityEvent {
  id: string;
  occurredAt: string;
  plane: "AUDIT" | "ACTIVITY" | "DATA_ACCESS" | "OBSERVABILITY";
  action: string;
  category: string;
  severity: "INFO" | "NOTICE" | "WARNING" | "CRITICAL";
  outcome: "SUCCESS" | "FAILURE" | "DENIED";
  reason?: string | null;
  actorUserId?: number | null;
  actorRole?: string | null;
  actorDisplayName?: string | null;
  onBehalfOfUserId?: number | null;
  businessId?: number | null;
  targets?: Array<{ type: string; id: number; label?: string }> | null;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  context?: {
    ip?: string | null;
    ipCountry?: string | null;
    route?: string | null;
    source?: string | null;
    correlationId?: string | null;
  } | null;
  money?: { amount?: string; currency?: string; direction?: string; redacted?: boolean } | null;
  humanized: string;
}

export interface ActivityPage {
  total: number;
  page: number;
  pageSize: number;
  events: ActivityEvent[];
}

export interface ActivityFilters {
  action?: string;
  category?: string;
  plane?: string;
  businessId?: number;
  actorUserId?: number;
  severity?: string;
  outcome?: string;
  from?: string;
  to?: string;
  correlationId?: string;
  targetType?: string;
  targetId?: number;
  page?: number;
  pageSize?: number;
}

const BASE = "/api/v1/activity";
const unwrap = (res: { data?: { data?: ActivityPage } }): ActivityPage =>
  res.data?.data ?? { total: 0, page: 1, pageSize: 0, events: [] };

export const ActivityAPI = {
  /** RBAC-scoped global query (superadmin console). */
  async query(filters: ActivityFilters = {}): Promise<ActivityPage> {
    const res = await axiosInstance.get(BASE, { params: filters });
    return unwrap(res);
  },
  /** The current viewer's own humanized activity feed. */
  async feed(page = 1, pageSize = 30): Promise<ActivityPage> {
    const res = await axiosInstance.get(`${BASE}/feed`, { params: { page, pageSize } });
    return unwrap(res);
  },
  /** Everything one actor ever did (superadmin / self). */
  async actorTimeline(userId: number, page = 1, pageSize = 50): Promise<ActivityPage> {
    const res = await axiosInstance.get(`${BASE}/actor/${userId}`, { params: { page, pageSize } });
    return unwrap(res);
  },
  /** The full life of one record, e.g. a booking. */
  async recordHistory(type: string, id: number, page = 1, pageSize = 100): Promise<ActivityPage> {
    const res = await axiosInstance.get(`${BASE}/record/${type}/${id}`, { params: { page, pageSize } });
    return unwrap(res);
  },
  /** Dev forensics — every event for one request (superadmin). */
  async byCorrelation(correlationId: string): Promise<ActivityPage> {
    const res = await axiosInstance.get(`${BASE}/correlation/${encodeURIComponent(correlationId)}`);
    return unwrap(res);
  },
  /** Chain integrity check (superadmin). */
  async verify(chainKey: string): Promise<{ ok: boolean; checked: number; breaks: string[]; head: string | null }> {
    const res = await axiosInstance.get(`${BASE}/verify/${encodeURIComponent(chainKey)}`);
    return res.data?.data ?? { ok: false, checked: 0, breaks: [], head: null };
  },
};

// Ops Portal P1 — FE API client for prospects, calls, tasks, reports and spreadsheet imports (/api/v1/ops/*).
// Every call needs an ops role server-side; what a screen shows is a convenience, never the boundary.
import api from "@/lib/axiosConfig"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p
  return res.data.data
}
const BASE = "/api/v1/ops"

export type ProspectStatus = "new" | "attempting" | "contacted" | "interested" | "onboarding" | "live" | "not_interested" | "invalid" | "do_not_contact" | "duplicate"
export type ProspectView = "mine" | "callbacks" | "upcoming" | "never" | "interested" | "onboarding" | "stale" | "claim_assist" | "closed" | "all"
export type CallOutcome = "no_answer" | "busy" | "switched_off" | "wrong_number" | "spoke"
export type CallChannel = "call" | "whatsapp" | "in_person"

export interface ProspectPhone { raw: string; e164: string | null; key: string; kind: "mobile" | "landline" | "other"; label: string; status: "unknown" | "valid" | "wrong" | "dead" }
export interface ProspectRow {
  id: number; name: string; vendorType: string | null; cityId: number | null; cityName: string | null; area: string | null
  status: ProspectStatus; disposition: string | null; reviewReason: string | null; ownerUserId: number | null; ownerName: string | null; teamId: number | null
  attemptCount: number; lastAttemptAt: string | null; nextActionAt: string | null; matchKind: string | null; matchedBusinessId: number | null
  priority: number; sourceType: string; primaryPhoneKey: string | null; phones: ProspectPhone[]; lockedByUserId: number | null; lockedUntil: string | null; createdAt: string
}
export interface ProspectFull extends ProspectRow {
  address: string | null; mapsUrl: string | null; website: string | null; email: string | null; contactPerson: string | null; notes: string | null
  placeId: string | null; cityText: string | null; teamName: string | null; batchFile: string | null; firstAttemptAt: string | null; lastContactedAt: string | null; businessId: number | null
}
export interface CallLogRow { id: number; at: string; channel: CallChannel; outcome: CallOutcome; disposition: string; reason: string | null; note: string | null; phoneUsed: string | null; nextActionAt: string | null; statusFrom: string | null; statusTo: string | null; userId: number; agentName: string | null }
export interface TaskRow {
  id: number; kind: string; dueAt: string; note: string | null; doneAt?: string | null; assignedToUserId: number; assigneeName: string | null
  prospectId?: number; prospectName?: string; vendorType?: string | null; cityName?: string | null; status?: ProspectStatus; phones?: ProspectPhone[]; overdue?: boolean; due?: boolean
}
export interface AuditEventRow { id: number; at: string; action: string; actorUserId: number | null; actorName: string | null; after: Record<string, unknown> | null }
export interface ListingMatch { id: number; name: string | null; city: string | null; leads: number; newLeads: number; unclaimed: boolean; matchKind: string | null }
export interface ProspectDetail { prospect: ProspectFull; calls: CallLogRow[]; tasks: TaskRow[]; listing: ListingMatch | null; events: AuditEventRow[] }
export type ProspectCounts = Record<ProspectView, number>
export interface ProspectFacets { vendorTypes: { value: string; n: number }[]; cities: { id: number; name: string; n: number }[]; owners: { id: number; name: string; n: number }[]; reasons: string[] }
export interface OpsSummary { tasksDue: number; tasksOverdue: number; tasksNext24h: number; readyToCall: number; callsToday: number; connectedToday: number; interestedToday: number; interestedOpen: number; needsReview: number | null }
export interface TeamAgentRow { userId: number; fullName: string; teamName: string; calls: number; connected: number; interested: number; callsToday: number; openAssigned: number; live: number; overdueTasks: number }

export type ImportField = "name" | "vendorType" | "city" | "area" | "address" | "phone" | "phone2" | "whatsapp" | "email" | "website" | "mapsUrl" | "placeId" | "contactPerson" | "notes"
export type ImportMapping = Partial<Record<ImportField, number>>
export type ImportRowKind = "new" | "error" | "duplicate_file" | "duplicate_prospect" | "existing_vendor" | "matches_listing" | "possible_match"
export interface ImportRowLabel {
  index: number; row: number; kind: ImportRowKind; name: string; vendorType: string | null; city: string | null; phones: string[]
  errors: string[]; warnings: string[]; ref: { prospectId?: number; businessId?: number; name?: string; row?: number; claimed?: boolean } | null
}
export interface ImportSummary { total: number; new: number; matchesListing: number; possibleMatch: number; duplicateFile: number; duplicateProspect: number; existingVendor: number; error: number; phoneDamaged: number; willImport: number }
export type ImportPreview =
  | { needsMapping: true; headers: string[]; suggestedMapping: ImportMapping; message: string }
  | { needsMapping: false; batchId: number; headers: string[]; mapping: ImportMapping; suggestedMapping: ImportMapping; teamId: number | null; summary: ImportSummary; sample: ImportRowLabel[]; issues: ImportRowLabel[] }
export interface ImportBatchRow {
  id: number; fileName: string | null; status: "previewed" | "committed" | "discarded"; totalRows: number; newRows: number; duplicateRows: number; matchedRows: number
  reviewRows: number; errorRows: number; committedRows: number; createdAt: string; committedAt: string | null; team?: { id: number; name: string } | null
  uploadedBy?: { id: number; fullName: string } | null; uploadedByUserId: number
}

export interface ProspectQuery {
  view?: ProspectView; q?: string; status?: string; cityId?: number | string; vendorType?: string; owner?: string; teamId?: number; batchId?: number
  sort?: string; dir?: "asc" | "desc"; page?: number; pageSize?: number
}

export const prospectsApi = {
  list: (params: ProspectQuery): Promise<{ prospects: ProspectRow[]; total: number; page: number; pageSize: number; view: ProspectView }> => unwrap(api.get(`${BASE}/prospects`, { params })),
  counts: (params?: Omit<ProspectQuery, "view">): Promise<{ counts: ProspectCounts }> => unwrap(api.get(`${BASE}/prospects/counts`, { params })),
  facets: (): Promise<ProspectFacets> => unwrap(api.get(`${BASE}/prospects/facets`)),
  get: (id: number): Promise<ProspectDetail> => unwrap(api.get(`${BASE}/prospects/${id}`)),
  create: (body: {
    name: string; phone: string; vendorType?: string; city?: string; area?: string; address?: string; email?: string; website?: string; mapsUrl?: string
    contactPerson?: string; notes?: string; teamId?: number; sourceType?: string; assignToMe?: boolean
  }): Promise<{ prospect: ProspectFull }> => unwrap(api.post(`${BASE}/prospects`, body)),
  update: (id: number, body: Record<string, unknown>): Promise<{ prospect: ProspectFull }> => unwrap(api.patch(`${BASE}/prospects/${id}`, body)),
  next: (body?: { excludeId?: number; vendorType?: string; cityId?: number }): Promise<{ empty: boolean; id?: number; resumed?: boolean; leaseMinutes?: number; scheduledLater?: number; needsReview?: number }> =>
    unwrap(api.post(`${BASE}/prospects/next`, body ?? {})),
  renew: (id: number): Promise<{ leaseMinutes: number }> => unwrap(api.post(`${BASE}/prospects/${id}/lease/renew`, {})),
  release: (id: number): Promise<{ released: boolean }> => unwrap(api.post(`${BASE}/prospects/${id}/release`, {})),
  logCall: (id: number, body: { outcome: CallOutcome; disposition: string; channel?: CallChannel; phoneUsed?: string; note?: string; reason?: string; nextActionAt?: string }):
    Promise<{ prospect: ProspectFull; task: TaskRow | null; statusFrom: ProspectStatus; statusTo: ProspectStatus; reviewReason: string | null }> => unwrap(api.post(`${BASE}/prospects/${id}/calls`, body)),
  reopen: (id: number, note: string): Promise<{ prospect: ProspectFull }> => unwrap(api.post(`${BASE}/prospects/${id}/reopen`, { note })),
  review: (id: number, decision: "retry" | "invalid" | "not_interested", note?: string): Promise<{ prospect: ProspectFull }> => unwrap(api.post(`${BASE}/prospects/${id}/review`, { decision, note })),
  reassign: (ids: number[], ownerUserId: number | null): Promise<{ moved: number; requested: number; notVisible: number }> => unwrap(api.post(`${BASE}/prospects/bulk-reassign`, { ids, ownerUserId })),
  exportCsv: async (params: ProspectQuery): Promise<Blob> => (await api.get(`${BASE}/prospects/export`, { params, responseType: "blob" })).data as Blob,
}

export const tasksApi = {
  list: (scope: "mine" | "team" = "mine"): Promise<{ tasks: TaskRow[] }> => unwrap(api.get(`${BASE}/tasks`, { params: { scope } })),
  done: (id: number): Promise<{ task: TaskRow }> => unwrap(api.post(`${BASE}/tasks/${id}/done`, {})),
  snooze: (id: number, dueAt: string): Promise<{ task: TaskRow }> => unwrap(api.post(`${BASE}/tasks/${id}/snooze`, { dueAt })),
}

export const reportsApi = {
  summary: (): Promise<OpsSummary> => unwrap(api.get(`${BASE}/summary`)),
  team: (days = 7): Promise<{ days: number; agents: TeamAgentRow[] }> => unwrap(api.get(`${BASE}/team-report`, { params: { days } })),
}

export const importsApi = {
  preview: (body: {
    fileName?: string; headers: string[]; rows: string[][]; mapping?: ImportMapping; teamId?: number; cityId?: number
    defaultVendorType?: string; sourceType?: string; replaceBatchId?: number
  }): Promise<ImportPreview> => unwrap(api.post(`${BASE}/imports/preview`, body)),
  commit: (id: number, assignTo?: "pool" | "me" | number): Promise<{ batchId: number; created: number; skippedAsDuplicate: number }> => unwrap(api.post(`${BASE}/imports/${id}/commit`, { assignTo })),
  discard: (id: number): Promise<{ batchId: number }> => unwrap(api.delete(`${BASE}/imports/${id}`)),
  list: (): Promise<{ batches: ImportBatchRow[] }> => unwrap(api.get(`${BASE}/imports`)),
}

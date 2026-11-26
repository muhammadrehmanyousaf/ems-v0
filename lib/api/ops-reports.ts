// Ops Portal P5 — FE API client for reports, the quality queues (QA second look, written consent), the audit trail and the client export (/api/v1/ops/*).
// Every call needs an ops permission server-side and a lead only ever gets their own teams back; what a screen hides is a convenience, never the boundary.
import api from "@/lib/axiosConfig"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p
  return res.data.data
}
const BASE = "/api/v1/ops"

/* ------------------------------------------ reports ------------------------------------------ */

export interface ReportQuery { from?: string; to?: string; cityId?: number | string; teamId?: number | string }

export interface TeamAAgent {
  userId: number; name: string; teams: string[]; contacts: number; called: number; connected: number; connectRate: number | null; interested: number
  onboarded: number; avgCompleteness: number | null; qaPassed: number; qaFlagged: number; overdueCallbacks: number
}
export interface TeamAReport {
  imported: number; contacts: number; called: number; connected: number; connectRate: number | null; interested: number; interestedRate: number | null
  medianHoursImportToFirstCall: number | null; firstCalled: number; overdueCallbacks: number
  dropoff: { code: string | null; label: string; n: number }[]
  onboarded: {
    total: number; takeovers: number; newListings: number; avgCompleteness: number | null; venues: number; venuesWithPriceAndCapacity: number
    venuePriceCapacityRate: number | null; byDay: { day: string; n: number }[]
  }
  consent: { written: number; verbalOnly: number; withdrawn: number; none: number; writtenRate: number | null }
  qa: { queued: number; passed: number; flagged: number; passRate: number | null }
  byCity: { city: string; imported: number; called: number; onboarded: number }[]
  agents: TeamAAgent[]
}

export interface TeamBAgent {
  userId: number; name: string; teams: string[]; received: number; responded: number; withinSla: number; withinSlaRate: number | null; medianMinutes: number | null
  booked: number; unansweredOverdue: number; handedOver: number
}
export interface VendorManagerRow { userId: number; name: string; received: number; done: number; open: number; withinSla: number; withinSlaRate: number | null; medianHours: number | null; idleOverdue: number }
export interface TeamBReport {
  received: number; responded: number
  firstResponse: { slaMinutes: number; medianMinutes: number | null; withinSla: number; withinSlaRate: number | null; unansweredOverdue: number }
  qualified: number; qualifiedRate: number | null; booked: number; bookedRate: number | null; lost: number
  lostReasons: { reason: string; n: number }[]
  bySource: { source: string; received: number; booked: number; bookedRate: number | null }[]
  byCity: { city: string; received: number; booked: number; bookedRate: number | null }[]
  assignments: { slaHours: number; handedOver: number; done: number; open: number; medianHoursToFirstAction: number | null; withinSla: number; withinSlaRate: number | null; idleOverdue: number }
  agents: TeamBAgent[]
  managers: VendorManagerRow[]
}
export interface Report {
  range: { from: string; to: string; days: number }
  scope: { all: boolean; teamIds: number[] | null; cityId: number | null }
  teamA: TeamAReport
  teamB: TeamBReport
}

/* ------------------------------------------ quality ------------------------------------------ */

export type QaView = "queued" | "flagged" | "passed" | "all"
export type QaStatus = "none" | "queued" | "passed" | "flagged"
export interface QaRow {
  businessId: number; name: string; vendorType: string | null; city: string | null; businessStatus: string; completenessScore: number | null
  onboardMode: "new" | "takeover"; onboardedAt: string; needsMoreData: boolean; qaStatus: QaStatus; qaNote: string | null; qaReviewedAt: string | null
  onboardedByUserId: number | null; onboardedByName: string | null; reviewedByName: string | null; consent: "verbal_call" | "confirmed_written" | "withdrawn" | null
}
export interface QaList { view: QaView; counts: { queued: number; flagged: number; passed: number }; total: number; page: number; pageSize: number; rows: QaRow[] }

export type ConsentQueueKind = "awaiting" | "withdrawn"
export interface ConsentQueueRow {
  businessId: number; name: string; vendorType: string | null; city: string | null; phone: string | null; businessStatus: string; listed: boolean | null
  onboardedAt: string; onboardedByUserId: number | null; onboardedByName: string | null; consent: "verbal_call" | "confirmed_written" | "withdrawn" | null
  consentAt: string | null; hoursSinceOnboarded: number
}
export interface ConsentQueue { kind: ConsentQueueKind; chaseHours: number; counts: { awaiting: number; withdrawn: number }; total: number; page: number; pageSize: number; rows: ConsentQueueRow[] }

/* ------------------------------------------- audit ------------------------------------------- */

export interface AuditQuery { from?: string; to?: string; actorUserId?: number | string; action?: string; targetType?: string; targetId?: number | string; page?: number; pageSize?: number }
export interface AuditRow { id: number | string; at: string; actorUserId: number | null; actorName: string | null; action: string; targetType: string; targetId: number; before: unknown; after: unknown }
export interface AuditList {
  range: { from: string; to: string; days: number }; total: number; page: number; pageSize: number; rows: AuditRow[]
  actions: { action: string; n: number }[]; actors: { id: number; name: string; n: number }[]
}

export interface ClientExportQuery { from?: string; to?: string; status?: string; source?: string; cityId?: number | string }

/** A failed download comes back as a Blob (we asked for one); read the API's own message out of it. */
async function blobError(e: unknown): Promise<Error> {
  const data = (e as { response?: { data?: unknown } })?.response?.data
  if (data instanceof Blob) {
    try {
      const j = JSON.parse(await data.text()) as { message?: string }
      if (j?.message) return new Error(j.message)
    } catch { /* fall through */ }
  }
  return e instanceof Error ? e : new Error("The download failed. Please try again.")
}

export interface GeoQuery { from?: string; to?: string; cityId?: number | string; city?: string; subArea?: string; teamId?: number | string }
export interface GeoCityRow {
  city: string; subAreaCount: number; live: number; totalVendors: number; missingPhotos: number; missingPrices: number
  prospects: number; websiteLeads: number; shortlistRequests: number; bookings: number; bookedRevenuePkr: number
  clientsReceived: number; clientsResponded: number; clientsQualified: number; clientsVisits: number; clientsBooked: number
  clientsLost: number; bookedRate: number | null; medianReplyMin: number | null
}
export interface GeoSubAreaRow {
  city: string; subArea: string
  supply: { total: number; live: number; draft: number; venues: number; missingPhotos: number; missingPrices: number; avgCompleteness: number | null }
  outreach: { prospects: number; importedRange: number; calledRange: number; interested: number; live: number }
  demand: { websiteLeads: number; shortlistRequests: number; available: number; unavailable: number; noAnswer: number; freeRate: number | null; visits: number; bookedClients: number; bookings: number; confirmedBookings: number; bookedRevenuePkr: number }
  gap: { code: "supply_deficit" | "incomplete_supply" | "conversion_gap" | "healthy"; label: string; tone: "ok" | "warn" | "bad" }
}
export interface GeoReport {
  range: { from: string; to: string; days: number }
  filters: { city: string | null; subArea: string | null }
  summary: {
    totalCities: number; totalSubAreas: number; liveVendors: number; totalVendors: number
    websiteLeads: number; clientsReceived: number; clientsBooked: number; bookingsCount: number
    supplyGapSubAreas: number; topDemandCity: string | null; topDemandSubArea: string | null; biggestGapSubArea: string | null
  }
  byCity: GeoCityRow[]
  bySubArea: GeoSubAreaRow[]
}

export const opsReportsApi = {
  overview: (query: ReportQuery) => unwrap<Report>(api.get(`${BASE}/reports/overview`, { params: query })),
  geo: (query: GeoQuery) => unwrap<GeoReport>(api.get(`${BASE}/reports/geo`, { params: query })),
  qa: (params: { view?: QaView; page?: number; pageSize?: number }) => unwrap<QaList>(api.get(`${BASE}/qa`, { params })),
  reviewQa: (businessId: number, body: { result: "passed" | "flagged"; note?: string }) => unwrap<{ businessId: number; qaStatus: QaStatus }>(api.post(`${BASE}/qa/${businessId}/review`, body)),
  consentQueue: (params: { kind?: ConsentQueueKind; page?: number; pageSize?: number }) => unwrap<ConsentQueue>(api.get(`${BASE}/queues/consent`, { params })),
  audit: (query: AuditQuery) => unwrap<AuditList>(api.get(`${BASE}/audit`, { params: query })),
  /** Downloads the CSV through the authenticated client (a plain link would carry no token) and saves it with the server's filename. */
  async downloadClients(query: ClientExportQuery): Promise<void> {
    let res
    try { res = await api.get(`${BASE}/clients/export`, { params: query, responseType: "blob" }) } catch (e) { throw await blobError(e) }
    // Content-Disposition is not readable across origins unless the API exposes it, so the dated name is built here (Karachi day, like the server's)
    const cd = String(res.headers?.["content-disposition"] ?? "")
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())
    const name = /filename="([^"]+)"/.exec(cd)?.[1] ?? `clients-${today}.csv`
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement("a")
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 5000)
  },
  async downloadGeo(query: GeoQuery): Promise<void> {
    let res
    try { res = await api.get(`${BASE}/reports/geo/export`, { params: query, responseType: "blob" }) } catch (e) { throw await blobError(e) }
    const cd = String(res.headers?.["content-disposition"] ?? "")
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())
    const name = /filename="([^"]+)"/.exec(cd)?.[1] ?? `geo-report-${today}.csv`
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement("a")
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 5000)
  },
}

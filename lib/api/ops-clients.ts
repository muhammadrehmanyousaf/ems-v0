// Ops Portal P4 + P8 — FE API client for Client Desk, Complete Vendor Brief, Shortlists, Visits & Bookings (/api/v1/ops/*).
import api from "@/lib/axiosConfig"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p
  return res.data.data
}
const BASE = "/api/v1/ops"

export type ClientStatus =
  | "new"
  | "contacted"
  | "shortlisting"
  | "assigned"
  | "vendor_replied"
  | "visit_scheduled"
  | "booked"
  | "lost"
  | "closed"
export type ClientSource = "website" | "whatsapp" | "phone" | "referral" | "walk_in" | "other"
export type ClientView = "inbox" | "mine" | "unassigned" | "assigned" | "vendor_replied" | "visits" | "needs_response" | "closed" | "all"
export type ClientEventKind = "mehndi" | "barat" | "walima" | "nikah" | "engagement" | "dholki" | "other"
export type Availability = "pending" | "available" | "unavailable" | "no_answer"
export type ContactKind = "call" | "whatsapp" | "note"
export type TimelineKind = "note" | "call" | "whatsapp" | "status" | "assignment" | "shortlist" | "inquiry" | "system"

export interface ClientPhone { raw: string; e164: string | null; key: string | null; kind: string; label: string; status: string }
export interface ClientRow {
  id: number; name: string; phones: ClientPhone[]; primaryPhoneKey: string | null; whatsapp: string | null; email: string | null; cityName: string | null
  source: ClientSource; status: ClientStatus; guests: number | null; budgetPkr: string | null; ownerUserId: number | null; ownerName: string | null; teamId: number | null; teamName: string | null
  firstResponseDueAt: string | null; firstResponseAt: string | null; lastContactAt: string | null; createdAt: string; overdue: boolean
  visitAt?: string | null; visitBusinessId?: number | null; visitVenueName?: string | null; visitNote?: string | null; bookingId?: number | null
  inquiries: number; shortlisted: number; availableCount?: number; bookingsCount?: number
  nextEventDate: string | null; assigneeName: string | null; assignmentStage: AssignmentStage | null
}
export interface ClientFull extends ClientRow { requirements: string | null; notes: string | null; statusReason: string | null; cityId: number | null }
export interface ClientEventRow { id: number; kind: ClientEventKind; eventDate: string | null; guests: number | null; budgetPkr: string | null; notes: string | null }
export interface InquiryRow { id: number; createdAt: string; status: string; eventType: string | null; eventDate: string | null; inquiry: string | null; businessId: number | null; vendorName: string | null; vendorCity: string | null }
export interface ShortlistRow {
  id: number; businessId: number; businessName: string; city: string | null; subArea: string | null; maxCapacity: number | null; minimumPrice: string | null
  vendorType: string | null; availability: Availability; quotedPricePkr: string | null; perHeadPkr: string | null
  checkedForDate?: string | null; holdUntil?: string | null; tokenAmountPkr?: string | null; altSuggestion?: string | null
  note: string | null; checkedAt: string | null; createdAt: string; checkedByName: string | null; listedPerHeadPkr: string | null
}
export type AssignmentStage = "new" | "contacted" | "confirmed" | "unavailable"
export interface AssignmentRow { id: number; status: "open" | "done" | "cancelled"; stage: AssignmentStage; stageNote: string | null; stageAt: string | null; reason: string | null; note: string | null; createdAt: string; firstActionAt: string | null; closedAt: string | null; assigneeName: string; assignedToUserId: number; assignedByName: string | null }
export interface TimelineRow { id: number; kind: TimelineKind; body: string | null; meta: Record<string, unknown> | null; at: string; authorName: string | null }
export interface ClientTaskRow { id: number; kind: string; dueAt: string; note: string | null; doneAt: string | null; businessId: number | null; assignedToUserId: number; assigneeName: string }
export interface ClientDetail {
  client: ClientFull
  events: ClientEventRow[]
  inquiries: InquiryRow[]
  shortlist: ShortlistRow[]
  assignments: AssignmentRow[]
  timeline: TimelineRow[]
  tasks: ClientTaskRow[]
  bookings?: { id: number; status: string; paymentStatus: string; bookingDate: string | null; eventCity: string | null; eventType: string | null; totalAmount: number | string | null; opsStage: string | null; vendors?: string | null }[]
}
export interface ClientList { rows: ClientRow[]; total: number; page: number; pageSize: number; view: ClientView }
export type ClientCounts = Record<ClientView, number>
export interface ClientQuery { view?: ClientView; q?: string; status?: ClientStatus; cityId?: number | string; page?: number; pageSize?: number; sort?: "oldest" | "newest" | "event" | "name" }
export interface ClientCreateBody {
  name: string; phone: string; source?: ClientSource; whatsapp?: string; email?: string; cityId?: number | string; city?: string; guests?: number | string; budgetPkr?: number | string
  requirements?: string; notes?: string; event?: { kind?: ClientEventKind; eventDate?: string; guests?: number | string; budgetPkr?: number | string; notes?: string }
}
export interface ClientTaskListRow { id: number; kind: string; dueAt: string; note: string | null; doneAt: string | null; businessId: number | null; clientId: number; clientName: string; clientStatus: ClientStatus; overdue: boolean }

export const clientsApi = {
  list: (query: ClientQuery) => unwrap<ClientList>(api.get(`${BASE}/clients`, { params: query })),
  counts: () => unwrap<ClientCounts>(api.get(`${BASE}/clients/counts`)),
  create: (body: ClientCreateBody) => unwrap<{ id: number; existing: boolean }>(api.post(`${BASE}/clients`, body)),
  fromVendor: (body: ClientCreateBody & {
    businessId: number
    spokeNow?: boolean
    sendToVendorTeam?: boolean
    assignedToUserId?: number
    assignNote?: string
    shortlistNote?: string
  }) => unwrap<{ id: number; existing: boolean; assigned: boolean; assignment: { assignmentId: number; assigneeName: string } | null }>(api.post(`${BASE}/clients/from-vendor`, body)),
  sync: () => unwrap<{ linked: number; created: number; skipped?: boolean }>(api.post(`${BASE}/clients/sync`)),
  get: (id: number) => unwrap<ClientDetail>(api.get(`${BASE}/clients/${id}`)),
  update: (id: number, patch: Record<string, unknown>) => unwrap<ClientDetail>(api.patch(`${BASE}/clients/${id}`, patch)),
  addEvent: (id: number, body: { kind?: ClientEventKind; eventDate?: string; guests?: number | string; budgetPkr?: number | string; notes?: string }) => unwrap<ClientDetail>(api.post(`${BASE}/clients/${id}/events`, body)),
  removeEvent: (id: number, eventId: number) => unwrap<ClientDetail>(api.delete(`${BASE}/clients/${id}/events/${eventId}`)),
  contact: (id: number, kind: ContactKind, body?: string) => unwrap<ClientDetail>(api.post(`${BASE}/clients/${id}/contact`, { kind, body })),
  setStatus: (id: number, status: ClientStatus, reason?: string) => unwrap<ClientDetail>(api.post(`${BASE}/clients/${id}/status`, { status, reason })),
  claim: (id: number) => unwrap<ClientDetail>(api.post(`${BASE}/clients/${id}/claim`)),
  setOwner: (id: number, toUserId: number | null, reason: string) => unwrap<ClientDetail>(api.post(`${BASE}/clients/${id}/owner`, { toUserId, reason })),
  scheduleVisit: (id: number, body: { businessId: number; visitAt: string; visitNote?: string }) =>
    unwrap<ClientDetail>(api.post(`${BASE}/clients/${id}/visit`, body)),
  bookClient: (id: number, body: {
    existingBookingId?: number
    businessId?: number
    bookingDate?: string
    bookingTime?: string
    eventType?: string
    guestCount?: number | string
    totalAmount?: number | string
    advanceDuePkr?: number | string
    notes?: string
  }) => unwrap<{ bookingId: number; detail: ClientDetail }>(api.post(`${BASE}/clients/${id}/book`, body)),
  tasks: (done = false) => unwrap<{ tasks: ClientTaskListRow[] }>(api.get(`${BASE}/clients/tasks`, { params: { done: done ? "true" : undefined } })),
  doneTask: (id: number) => unwrap<{ id: number }>(api.post(`${BASE}/clients/tasks/${id}/done`)),
}

/* ------------------------------ shortlist and assignment ------------------------------ */

export interface AssigneeSuggestion { userId: number; fullName: string; teamName: string; openCount: number; cityMatch: boolean }
export interface AssigneeList { suggestions: AssigneeSuggestion[]; noCityMatch: boolean; nobody: boolean }

export const shortlistApi = {
  add: (clientId: number, businessIds: number[], note?: string) => unwrap<{ added: number; alreadyThere: number }>(api.post(`${BASE}/clients/${clientId}/shortlist`, { businessIds, note })),
  remove: (clientId: number, itemId: number) => unwrap<{ removed: boolean }>(api.delete(`${BASE}/clients/${clientId}/shortlist/${itemId}`)),
  assignees: (clientId: number) => unwrap<AssigneeList>(api.get(`${BASE}/clients/${clientId}/assignees`)),
  assign: (clientId: number, body: { assignedToUserId?: number; reason?: string; note?: string }) => unwrap<{ assignmentId: number; assignedToUserId: number; assigneeName: string; venues: number; reassigned: boolean }>(api.post(`${BASE}/clients/${clientId}/assign`, body)),
}

/* ---------------------------------- vendor search & complete brief ---------------------------------- */

export type VendorFlag = "ac" | "valet" | "wifi" | "generator" | "separateHalls" | "multipleEvents" | "outsideDecor" | "outsideDj" | "outsideFood" | "inHouseCateringOnly" | "parking" | "catering" | "outsideVendors"
export interface VendorQuery {
  vendorType?: string; city?: string; area?: string; q?: string; guests?: number | string; priceMin?: number | string; priceMax?: number | string; perHeadMin?: number | string; perHeadMax?: number | string
  completenessMin?: number | string; claimed?: "yes" | "no" | ""; confirmedWithinDays?: number | string; includePending?: boolean; flags?: VendorFlag[]; sort?: "fit" | "price" | "capacity" | "name"; page?: number; pageSize?: number
}
export interface VendorRow {
  id: number; name: string; slug: string | null; city: string | null; subArea: string | null; vendorType: string | null; maxCapacity: number | null; minCapacity: number | null; minimumPrice: string | null
  completenessScore: number | null; verificationTier: number | null; parking: boolean | null; carParkingCapacity: number | null; catering: boolean | null; outsideVendorsAllowed: boolean | null
  typeSpecificDetails: Record<string, unknown> | null; venueType: string | null; subBusinessType: string[] | null; claimed: boolean; isLive?: boolean; status?: string
  imagesCount?: number; packagesCount?: number; menusCount?: number
  perHeadFromPkr: string | null; perHeadToPkr: string | null; lastConfirmedFreeAt: string | null; dataMissing: boolean
}
export interface VendorBrief {
  vendor: {
    id: number; name: string; slug: string | null; city: string | null; subArea: string | null; address: string | null; googleMapsUrl: string | null
    description: string | null; additionalInfo: string | null; cancelationPolicy: string | null; downPaymentType: string | null; downPayment: number | null
    securityDepositPkr: number | null; indoorCapacity: number | null; outdoorCapacity: number | null; seatedCapacity: number | null
    oneDishPolicy: boolean | null; eventClosingTime: string | null; amenities: string[]
    vendorType: string | null; venueType: string | null; subBusinessType: string[] | null
    maxCapacity: number | null; minCapacity: number | null; minimumPrice: string | null
    perHeadFromPkr: string | null; perHeadToPkr: string | null; completenessScore: number | null
    parking: boolean | null; carParkingCapacity: number | null; catering: boolean | null; outsideVendorsAllowed: boolean | null
    typeSpecificDetails: Record<string, unknown> | null; claimed: boolean; isLive: boolean; status: string
    images: string[]; videos: string[]; brandLogo: string | null; lastConfirmedFreeAt: string | null
  }
  packages: { id: number; name: string; description: string; price: number | null; pricingUnit: string | null; minGuaranteeCount: number | null; includesFood: boolean; capacity: number | null; features: string[] }[]
  menus: { id: number; title: string; price: number | null; pricingUnit: string | null; minGuaranteeCount: number | null; items: string[] }[]
  busyDates: { date: string; slot: string; kind: "booking" | "hold"; status: string }[]
  recentChecks: { id: number; availability: Availability; checkedForDate: string | null; quotedPricePkr: string | null; perHeadPkr: string | null; tokenAmountPkr: string | null; holdUntil: string | null; altSuggestion: string | null; note: string | null; checkedAt: string | null; checkedByName: string | null }[]
}
export interface VendorSearchResult { rows: VendorRow[]; total: number; dataMissing: number; page: number; pageSize: number }

export const vendorsApi = {
  search: (q: VendorQuery) => unwrap<VendorSearchResult>(api.get(`${BASE}/vendors/search`, { params: { ...q, includePending: q.includePending ? "1" : undefined, flags: q.flags?.length ? q.flags.join(",") : undefined, claimed: q.claimed || undefined } })),
  compare: (ids: number[]) => unwrap<{ rows: VendorRow[] }>(api.get(`${BASE}/vendors/compare`, { params: { ids: ids.join(",") } })),
  brief: (id: number) => unwrap<VendorBrief>(api.get(`${BASE}/vendors/${id}/brief`)),
}

/* ----------------------------- a vendor manager's assignments ----------------------------- */

export interface MyAssignmentRow {
  id: number; status: "open" | "done"; stage: AssignmentStage; stageNote: string | null; stageAt: string | null; createdAt: string; firstActionAt: string | null; closedAt: string | null; note: string | null; clientId: number; clientName: string
  clientStatus?: ClientStatus; visitAt?: string | null; visitVenueName?: string | null
  cityName: string | null; guests: number | null; budgetPkr: string | null; nextEventDate: string | null; venues: number; unchecked: number
}
export interface AssignedItem {
  id: number; businessId: number; businessName: string; city: string | null; subArea: string | null; maxCapacity: number | null; minimumPrice: string | null; availability: Availability
  quotedPricePkr: string | null; perHeadPkr: string | null; checkedForDate?: string | null; holdUntil?: string | null; tokenAmountPkr?: string | null; altSuggestion?: string | null
  note: string | null; checkedAt: string | null; contactPhone: string | null; listedPerHeadPkr: string | null
}
export interface AssignedDetail {
  assignment: { id: number; status: "open" | "done"; stage: AssignmentStage; stageNote: string | null; stageAt: string | null; createdAt: string; firstActionAt: string | null; closedAt: string | null; note: string | null }
  client: { id: number; name: string; phones: ClientPhone[]; whatsapp: string | null; cityName: string | null; guests: number | null; budgetPkr: string | null; requirements: string | null; status: ClientStatus; visitAt?: string | null; visitNote?: string | null; visitVenueName?: string | null }
  events: { kind: ClientEventKind; eventDate: string | null; guests: number | null; budgetPkr: string | null; notes: string | null }[]
  items: AssignedItem[]
}

export const assignmentsApi = {
  mine: (all = false) => unwrap<{ assignments: MyAssignmentRow[] }>(api.get(`${BASE}/assignments`, { params: { status: all ? "all" : undefined } })),
  get: (id: number) => unwrap<AssignedDetail>(api.get(`${BASE}/assignments/${id}`)),
  check: (itemId: number, body: { availability: "available" | "unavailable" | "no_answer"; quotedPricePkr?: number | string; perHeadPkr?: number | string; checkedForDate?: string; holdUntil?: string; tokenAmountPkr?: number | string; altSuggestion?: string; note?: string }) =>
    unwrap<{ itemId: number; availability: Availability; suggestUpdate: { taskId: number; businessId: number } | null }>(api.post(`${BASE}/assignments/items/${itemId}/check`, body)),
  complete: (id: number, note?: string) => unwrap<{ done: boolean }>(api.post(`${BASE}/assignments/${id}/complete`, { note })),
  setStage: (id: number, stage: AssignmentStage, note?: string) => unwrap<{ stage: AssignmentStage; stageNote: string | null; changed: boolean }>(api.post(`${BASE}/assignments/${id}/stage`, { stage, note })),
}

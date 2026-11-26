// Ops Portal P7 — FE API client for Bookings Coordination Desk (/api/v1/ops/bookings/*).
// Core Bookings/payment records remain read-only; coordination stages, claims & call/WhatsApp logs live in OpsBookingMeta & OpsBookingLogs.
import api from "@/lib/axiosConfig"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data
}
const BASE = "/api/v1/ops/bookings"

export type OpsBookingStage = "new" | "vendor_contacted" | "vendor_confirmed" | "couple_confirmed" | "ready" | "issue" | "resolved"
export type OpsBookingPriority = "normal" | "urgent"
export type OpsBookingView = "needs_action" | "confirmed" | "pending" | "upcoming" | "completed" | "cancelled" | "all"
export type OpsBookingParty = "vendor" | "couple" | "internal"
export type OpsBookingChannel = "call" | "whatsapp" | "note"

export interface OpsBookingVendorRef {
  businessId: number
  name: string
  city: string | null
  vendorType: string | null
  phone: string | null
}

export interface OpsBookingRow {
  id: number
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  bookingDate: string | null
  bookingTime: string | null
  status: string
  paymentStatus: string
  totalAmount: number | string | null
  downPayment: number | string | null
  advanceDuePkr: number | string | null
  bookingSource: string
  eventCity: string | null
  eventType: string | null
  guestCount: number | null
  createdAt: string
  opsStage: OpsBookingStage
  priority: OpsBookingPriority
  ownerUserId: number | null
  ownerName: string | null
  clientId: number | null
  nextFollowUpAt: string | null
  lastContactAt: string | null
  vendors: OpsBookingVendorRef[]
}

export interface OpsBookingVendorDetail extends OpsBookingVendorRef {
  subArea: string | null
  ownerName: string | null
  lineTotal: number | string | null
  linePaid: number | string | null
  bookingTime: string | null
  packageName: string | null
  menuTitle: string | null
}

export interface OpsBookingLogRow {
  id: number
  targetParty: OpsBookingParty
  channel: OpsBookingChannel
  outcome: string | null
  note: string | null
  nextFollowUpAt: string | null
  at: string
  userId: number | null
  agentName: string | null
}

export interface OpsBookingDetail {
  booking: {
    id: number
    status: string
    paymentStatus: string
    paymentMethod: string | null
    bookingSource: string
    bookingDate: string | null
    bookingTime: string | null
    eventCity: string | null
    eventType: string | null
    guestCount: number | null
    totalAmount: number | string | null
    downPayment: number | string | null
    advanceDuePkr: number | string | null
    additionalRequests: string | null
    customerName: string | null
    customerPhone: string | null
    customerEmail: string | null
    createdAt: string
  }
  ops: {
    opsStage: OpsBookingStage
    priority: OpsBookingPriority
    ownerUserId: number | null
    ownerName: string | null
    clientId: number | null
    nextFollowUpAt: string | null
    lastContactAt: string | null
    vendorConfirmedAt: string | null
    coupleConfirmedAt: string | null
    notes: string | null
  }
  vendors: OpsBookingVendorDetail[]
  logs: OpsBookingLogRow[]
  statusHistory: { id: number; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }[]
}

export type OpsBookingCounts = Record<OpsBookingView, number>

export interface OpsBookingQuery {
  view?: OpsBookingView
  q?: string
  status?: string
  opsStage?: OpsBookingStage
  source?: string
  city?: string
  businessId?: number
  sort?: "newest" | "oldest" | "event_soonest" | "amount"
  page?: number
  pageSize?: number
}

export const opsBookingsApi = {
  list: (params?: OpsBookingQuery): Promise<{ rows: OpsBookingRow[]; total: number; page: number; pageSize: number; view: OpsBookingView }> =>
    unwrap(api.get(BASE, { params })),
  counts: (): Promise<{ counts: OpsBookingCounts }> => unwrap(api.get(`${BASE}/counts`)),
  sync: (): Promise<{ created: number; linkedClients: number; skipped?: boolean }> => unwrap(api.post(`${BASE}/sync`, {})),
  get: (id: number): Promise<OpsBookingDetail> => unwrap(api.get(`${BASE}/${id}`)),
  claim: (id: number): Promise<OpsBookingDetail> => unwrap(api.post(`${BASE}/${id}/claim`, {})),
  updateStage: (
    id: number,
    body: { opsStage?: OpsBookingStage; priority?: OpsBookingPriority; notes?: string | null; nextFollowUpAt?: string | null },
  ): Promise<OpsBookingDetail> => unwrap(api.post(`${BASE}/${id}/stage`, body)),
  logContact: (
    id: number,
    body: { targetParty: OpsBookingParty; channel: OpsBookingChannel; outcome?: string | null; note?: string | null; nextFollowUpAt?: string | null },
  ): Promise<OpsBookingDetail> => unwrap(api.post(`${BASE}/${id}/log`, body)),
}

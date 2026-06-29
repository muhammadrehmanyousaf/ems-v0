// Venue-OS — FE API client.
//
// Typed wrapper over the flag-gated /api/v1/venue-os surface, on the vendor
// `auth_token` (the shared default axios instance). Every endpoint is dark on
// the backend until a FeatureFlagOverride enables it for the pilot Org, so these
// calls return 404 until then — callers should gate UI on `health().flags`.
import api from "@/lib/axiosConfig";

export type IsDeclared = "DECLARED" | "MANAGEMENT_ONLY" | "UNDECIDED";

export type VenueOsFlags = Record<string, boolean>;

export interface VenueOsHealth {
  flags: VenueOsFlags;
  accessibleBusinessIds: number[] | null;
}

export interface PnlShape {
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit: number;
  netProfit: number;
  byType?: Record<string, number>;
}
export interface PerEventPnl extends PnlShape {
  eventId: number;
}
export interface OrgBusinessPnl extends PnlShape {
  businessId: number;
  name: string;
}
export interface OrgRollup {
  orgId: number;
  businessCount: number;
  totals: PnlShape;
  perBusiness: OrgBusinessPnl[];
}

export interface ConsolidationEliminations {
  internalTradeVolume: number;
  intercoRevenue: number;
  intercoCost: number;
  netImpact: number;
}
export interface ConsolidatedRollup {
  orgId: number;
  businessCount: number;
  gross: PnlShape;
  consolidated: PnlShape;
  eliminations: ConsolidationEliminations;
  perBusiness: OrgBusinessPnl[];
}

export interface WageEntry {
  id: number;
  businessId: number;
  eventId: number | null;
  workerName: string;
  shiftDate: string;
  agreedRate: string;
  amountPaid: string;
  subFloorFlag: boolean;
  ageBand: string;
  glJournalEntryId: number | null;
}
export interface WageRecordResult {
  entry: WageEntry;
  warnings: string[];
  ageBand: string;
  subFloorFlag: boolean;
  minFloor: number | null;
}
export interface WagePostResult {
  wageEntryId: number;
  eventId: number | null;
  amount: number;
  idempotentHit?: boolean;
  dryRun?: boolean;
  journalEntry?: JournalEntryShape;
}
export interface LabourByEvent {
  eventId: number;
  shifts: number;
  totalPaid: number;
}

export interface FixedAsset {
  id: number;
  businessId: number;
  name: string;
  category: string;
  cost: string;
  salvageValue: string;
  usefulLifeMonths: number;
  inServiceDate: string;
  method: string;
  active: boolean;
}
export interface DepreciationLine {
  assetId: number;
  name: string;
  amount?: number;
  jeNo?: string | null;
  idempotentHit?: boolean;
  dryRun?: boolean;
  skipped?: string;
}
export interface DepreciationRun {
  businessId: number;
  period: string;
  assetCount: number;
  postedCount: number;
  totalDepreciation: number;
  results: DepreciationLine[];
}

export interface FullyCostedEventPnl {
  eventId: number;
  businessId: number;
  driver: string;
  direct: PerEventPnl;
  allocatedOverhead: number;
  fullyCostedNet: number;
  overheadPool: number;
  weight: number;
}

export interface EventMargin {
  eventId: number;
  revenue: number;
  directNet: number;
  allocatedOverhead: number;
  fullyCostedNet: number;
  marginPct: number | null;
}
export interface EventMargins {
  businessId: number;
  driver: string;
  pool: number;
  eventCount: number;
  events: EventMargin[];
}

export interface TaxPart {
  taxType: string;
  jurisdiction: string;
  basis: string;
  taxAmount: number;
  ratePercent?: number | null;
  fixedAmount?: number | null;
  ready?: boolean;
}
export interface TaxBreakdown {
  baseAmount: number;
  wht236cb: TaxPart | null;
  provincial: TaxPart | null;
  totalTax: number;
}

export interface PdcAlert {
  id: number;
  bookingId: number | null;
  amount: string;
  chequeDate: string;
  status: string;
  overdue: boolean;
}

export interface EventNight {
  id: number;
  bookingId: number;
  subVenueId: number | null;
  businessId: number | null;
  safeCapacity: number | null;
  liveHeadcount: number;
  peakHeadcount: number;
  overCapFlag: boolean;
  status: string;
}
export interface HeadcountResult {
  liveHeadcount: number;
  peakHeadcount: number;
  safeCapacity: number | null;
  overCapFlag: boolean;
}

export interface CashFloat {
  id: number;
  businessId: number;
  openingFloat: string;
  collected: string;
  deposited: string;
  closingCounted: string | null;
  overShort: string | null;
  status: "OPEN" | "CLOSED";
}
export interface CloseFloatResult {
  floatId: number;
  expected: number;
  closingCounted: number;
  overShort: number;
  short: boolean;
}

export interface AvailabilityConflict {
  id: number;
  bookingId: number | null;
  s: string;
  e: string;
}
export interface AvailabilityResult {
  available: boolean;
  conflicts: AvailabilityConflict[];
}

export interface RecostAlert {
  costPerHead: number;
  quotedPerHead: number;
  marginPerHead: number;
  marginPct: number | null;
  underwater: boolean;
}
export interface RecostDish {
  dishName: string;
  deghCost: number;
  platesPerDegh: number;
  costPerPlate: number;
  missingRates: number[];
}
export interface MenuRecost {
  costPerHead: number;
  dishes: RecostDish[];
  missingRates: number[];
  alert: RecostAlert | null;
}

export interface JournalLineShape {
  accountId: number;
  debit: number;
  credit: number;
  memo?: string | null;
}
export interface JournalEntryShape {
  id?: number;
  jeNo: string | null;
  narration: string;
  isDeclared: string;
  basis: string;
  lines: JournalLineShape[];
}
export interface GlPostResult {
  journalEntry: JournalEntryShape;
  idempotentHit?: boolean;
  dryRun?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE = "/api/v1/venue-os";

async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export interface ComputeTaxBody {
  baseAmount: number;
  jurisdiction: string;
  category?: string;
  filerStatus?: "FILER" | "NON_FILER";
  businessId?: number;
}

export const venueOsApi = {
  health: (): Promise<VenueOsHealth> => unwrap<VenueOsHealth>(api.get(`${BASE}/health`)),

  orgRollup: (orgId: number, isDeclared?: IsDeclared): Promise<OrgRollup> =>
    unwrap<OrgRollup>(api.get(`${BASE}/org/${orgId}/rollup`, { params: { isDeclared } })),

  orgConsolidated: (orgId: number, isDeclared?: IsDeclared): Promise<ConsolidatedRollup> =>
    unwrap<ConsolidatedRollup>(api.get(`${BASE}/org/${orgId}/consolidated`, { params: { isDeclared } })),

  eventPnl: (bookingId: number, businessId?: number, isDeclared?: IsDeclared): Promise<PerEventPnl> =>
    unwrap<PerEventPnl>(api.get(`${BASE}/bookings/${bookingId}/pnl`, { params: { businessId, isDeclared } })),

  costedEventPnl: (
    bookingId: number,
    businessId: number,
    driver?: "REVENUE_SHARE" | "EVENT_COUNT",
    isDeclared?: IsDeclared,
  ): Promise<FullyCostedEventPnl> =>
    unwrap<FullyCostedEventPnl>(api.get(`${BASE}/bookings/${bookingId}/costed-pnl`, { params: { businessId, driver, isDeclared } })),

  eventMargins: (
    businessId: number,
    opts?: { driver?: "REVENUE_SHARE" | "EVENT_COUNT"; from?: string; to?: string; isDeclared?: IsDeclared },
  ): Promise<EventMargins> => unwrap<EventMargins>(api.get(`${BASE}/business/${businessId}/event-margins`, { params: opts })),

  listFixedAssets: (businessId: number): Promise<FixedAsset[]> =>
    unwrap<FixedAsset[]>(api.get(`${BASE}/business/${businessId}/fixed-assets`)),

  createFixedAsset: (body: {
    businessId: number;
    name: string;
    category?: string;
    cost: number;
    salvageValue?: number;
    usefulLifeMonths: number;
    inServiceDate: string;
    method?: string;
  }): Promise<FixedAsset> => unwrap<FixedAsset>(api.post(`${BASE}/fixed-assets`, body)),

  runDepreciation: (businessId: number, body: { period: string; dryRun?: boolean; isDeclared?: IsDeclared }): Promise<DepreciationRun> =>
    unwrap<DepreciationRun>(api.post(`${BASE}/business/${businessId}/depreciation/run`, body)),

  recordWage: (body: {
    businessId: number;
    eventId?: number;
    workerName: string;
    shiftDate: string;
    agreedRate: number;
    amountPaid: number;
    province?: string;
    paidIn?: string;
    proof?: string;
  }): Promise<WageRecordResult> => unwrap<WageRecordResult>(api.post(`${BASE}/wages`, body)),

  postWageToGl: (wageEntryId: number, body?: { dryRun?: boolean; isDeclared?: IsDeclared }): Promise<WagePostResult> =>
    unwrap<WagePostResult>(api.post(`${BASE}/wages/${wageEntryId}/post-to-gl`, body || {})),

  labourByEvent: (businessId: number, opts?: { from?: string; to?: string }): Promise<LabourByEvent[]> =>
    unwrap<LabourByEvent[]>(api.get(`${BASE}/business/${businessId}/labour-by-event`, { params: opts })),

  computeTax: (body: ComputeTaxBody): Promise<TaxBreakdown> =>
    unwrap<TaxBreakdown>(api.post(`${BASE}/tax/compute`, body)),

  pdcAlerts: (businessId?: number, withinDays?: number): Promise<PdcAlert[]> =>
    unwrap<PdcAlert[]>(api.get(`${BASE}/pdc/alerts`, { params: { businessId, withinDays } })),

  openEventNight: (body: {
    bookingId: number;
    subVenueId?: number;
    businessId?: number;
    safeCapacity?: number;
  }): Promise<EventNight> => unwrap<EventNight>(api.post(`${BASE}/event-nights`, body)),

  recordHeadcount: (id: number, direction: "IN" | "OUT", count = 1): Promise<HeadcountResult> =>
    unwrap<HeadcountResult>(api.post(`${BASE}/event-nights/${id}/headcount`, { direction, count })),

  openCashFloat: (body: { businessId: number; openingFloat?: number }): Promise<CashFloat> =>
    unwrap<CashFloat>(api.post(`${BASE}/cash-float`, body)),

  recordToFloat: (id: number, body: { collected?: number; deposited?: number; businessId?: number }): Promise<CashFloat> =>
    unwrap<CashFloat>(api.post(`${BASE}/cash-float/${id}/record`, body)),

  closeCashFloat: (id: number, body: { closingCounted: number; businessId?: number }): Promise<CloseFloatResult> =>
    unwrap<CloseFloatResult>(api.post(`${BASE}/cash-float/${id}/close`, body)),

  checkAvailability: (body: {
    subVenueId: number;
    slot: { start: string; end: string };
    turnaroundMin?: number;
    businessId?: number;
  }): Promise<AvailabilityResult> => unwrap<AvailabilityResult>(api.post(`${BASE}/scheduling/check-availability`, body)),

  recostMenu: (body: { cardIds: number[]; businessId?: number; quotedPerHead?: number }): Promise<MenuRecost> =>
    unwrap<MenuRecost>(api.post(`${BASE}/catering/recost`, body)),

  postBookingToGl: (
    bookingId: number,
    body: {
      eventType: string;
      amount: number;
      isDeclared?: IsDeclared;
      basis?: "CASH" | "ACCRUAL";
      businessId?: number;
      orgId?: number;
      counterpartyBusinessId?: number;
      dryRun?: boolean;
    },
  ): Promise<GlPostResult> => unwrap<GlPostResult>(api.post(`${BASE}/bookings/${bookingId}/post-to-gl`, body)),
};

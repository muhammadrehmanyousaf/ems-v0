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

export interface VenueLease {
  id: number;
  businessId: number;
  venueName: string;
  monthlyRent: string;
  pagriAmount: string;
  securityDeposit: string;
  leaseStartDate: string;
  leaseTermMonths: number;
  escalationPercent: string;
  escalationEveryMonths: number;
  active: boolean;
}
export interface LeaseScheduleItem {
  leaseId: number;
  venueName: string;
  elapsedMonths: number;
  remainingMonths: number;
  monthlyRent: number;
  monthlyPagri: number;
  futureRent: number;
  remainingPagri: number;
  totalCommitted: number;
  securityDeposit: number;
}
export interface RentAccrualLine {
  leaseId: number;
  venueName: string;
  rent?: number;
  pagri?: number;
  rentIdempotentHit?: boolean;
  pagriIdempotentHit?: boolean;
  skipped?: string;
}
export interface RentAccrualRun {
  businessId: number;
  period: string;
  leaseCount: number;
  totalRent: number;
  totalPagri: number;
  total: number;
  dryRun: boolean;
  results: RentAccrualLine[];
}

export interface AnnexBLine {
  accountCode: string;
  name: string;
  amount: number;
}
export interface AnnexBCodeGroup {
  annexbCode: string;
  amount: number;
  accounts: AnnexBLine[];
}
export interface AnnexBReport {
  businessId: number;
  periodFrom: string;
  periodTo: string;
  isDeclared: string;
  view: string;
  revenue: { lines: AnnexBLine[]; total: number };
  expenses: { byAnnexbCode: AnnexBCodeGroup[]; uncodedExpense: AnnexBLine[]; total: number };
  netProfit: number;
}
export interface TrialBalanceAccount {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}
export interface TrialBalance {
  businessId: number;
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  variance: number;
  balanced: boolean;
}
export interface Section21Clause {
  clause: string;
  status: "READY" | "NOT_READY" | "NO_RULE";
  label: string;
  ruleCode?: string;
  thresholdPkr?: number;
  actionType?: string;
  basePkr?: number;
  disallowedPkr?: number;
  byHead?: { accountCode: string; name: string; basePkr: number; disallowedPkr: number; count: number }[];
  framing?: string;
}
export interface Section21Report {
  businessId: number;
  periodFrom: string;
  periodTo: string;
  clauses: Section21Clause[];
  totalDisallowedPkr: number;
  anyNotReady: boolean;
}

export interface CloseRitualStep {
  step: string;
  posted?: number;
  totalPkr?: number;
  leaseCount?: number;
  jeNos?: string[];
}
export interface CloseRitualResult {
  businessId: number;
  period: string;
  dryRun: boolean;
  steps: CloseRitualStep[];
  trialBalance: { balanced: boolean; variance: number; totalDebit: number; totalCredit: number; accounts: number };
  monthEndClose: { ritualStatus: string } | null;
  locked?: boolean;
}

export interface OwnVsLeasePath {
  upfront: number;
  totalCash: number;
  npvCost: number;
}
export interface OwnVsLeaseResult {
  horizonMonths: number;
  annualDiscountRate: number;
  breakEvenMonth: number | null;
  lease: OwnVsLeasePath;
  own: OwnVsLeasePath;
  recommendation: "OWN" | "LEASE";
  npvSaving: number;
}

export interface PeriodStatus {
  businessId: number;
  period: string;
  status: "OPEN" | "CLOSED";
  lockedEntryCount?: number;
  snapshotRevenue?: string | number | null;
  snapshotCogs?: string | number | null;
  snapshotOpex?: string | number | null;
  snapshotNetProfit?: string | number | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  alreadyClosed?: boolean;
  alreadyOpen?: boolean;
  reopened?: boolean;
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

  periodStatus: (businessId: number, period: string): Promise<PeriodStatus> =>
    unwrap<PeriodStatus>(api.get(`${BASE}/business/${businessId}/period/${period}/status`)),

  closePeriod: (businessId: number, period: string, body?: { isDeclared?: IsDeclared }): Promise<PeriodStatus> =>
    unwrap<PeriodStatus>(api.post(`${BASE}/business/${businessId}/period/${period}/close`, body || {})),

  reopenPeriod: (businessId: number, period: string): Promise<PeriodStatus> =>
    unwrap<PeriodStatus>(api.post(`${BASE}/business/${businessId}/period/${period}/reopen`, {})),

  listVenueLeases: (businessId: number): Promise<VenueLease[]> =>
    unwrap<VenueLease[]>(api.get(`${BASE}/business/${businessId}/venue-leases`)),

  leaseSchedule: (businessId: number, period?: string): Promise<LeaseScheduleItem[]> =>
    unwrap<LeaseScheduleItem[]>(api.get(`${BASE}/business/${businessId}/lease-schedule`, { params: { period } })),

  createVenueLease: (body: {
    businessId: number;
    venueName: string;
    monthlyRent: number;
    pagriAmount?: number;
    securityDeposit?: number;
    leaseStartDate: string;
    leaseTermMonths: number;
    escalationPercent?: number;
    escalationEveryMonths?: number;
  }): Promise<VenueLease> => unwrap<VenueLease>(api.post(`${BASE}/venue-leases`, body)),

  runRentAccrual: (businessId: number, body: { period: string; dryRun?: boolean; isDeclared?: IsDeclared }): Promise<RentAccrualRun> =>
    unwrap<RentAccrualRun>(api.post(`${BASE}/business/${businessId}/lease-accrual/run`, body)),

  annexB: (businessId: number, from: string, to: string, isDeclared?: string): Promise<AnnexBReport> =>
    unwrap<AnnexBReport>(api.get(`${BASE}/business/${businessId}/annex-b`, { params: { from, to, isDeclared } })),

  trialBalance: (businessId: number, opts?: { from?: string; to?: string; asOf?: string; isDeclared?: IsDeclared }): Promise<TrialBalance> =>
    unwrap<TrialBalance>(api.get(`${BASE}/business/${businessId}/trial-balance`, { params: opts })),

  section21Addbacks: (businessId: number, from: string, to: string): Promise<Section21Report> =>
    unwrap<Section21Report>(api.get(`${BASE}/business/${businessId}/section-21-addbacks`, { params: { from, to } })),

  closeRitual: (businessId: number, period: string, body?: { dryRun?: boolean; isDeclared?: IsDeclared; lock?: boolean }): Promise<CloseRitualResult> =>
    unwrap<CloseRitualResult>(api.post(`${BASE}/business/${businessId}/period/${period}/close-ritual`, body || {})),

  monthEnd: (businessId: number, period: string): Promise<{ businessId: number; period: string; ritualStatus: string }> =>
    unwrap<{ businessId: number; period: string; ritualStatus: string }>(api.get(`${BASE}/business/${businessId}/month-end/${period}`)),

  ownVsLease: (body: {
    horizonMonths: number;
    own: { purchasePrice: number; salvageValue?: number; monthlyMaintenance?: number };
    lease?: { monthlyRent: number; pagriAmount?: number; securityDeposit?: number; escalationPercent?: number; escalationEveryMonths?: number };
    leaseId?: number;
    annualDiscountRate?: number;
    businessId?: number;
  }): Promise<OwnVsLeaseResult> => unwrap<OwnVsLeaseResult>(api.post(`${BASE}/capital/own-vs-lease`, body)),

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

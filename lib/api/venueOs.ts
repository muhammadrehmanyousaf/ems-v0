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

export interface Section21Meter {
  businessId: number;
  amountPkr: number;
  paymentMode: string;
  accountHead: string | null;
  clause: string;
  status: string;
  thresholdPkr: number | null;
  disallowedPkr: number;
  disallowedIfCashPkr: number;
  cleanIfBankedPkr: number;
  framing: string;
}
export interface StructuringResult {
  warn: boolean;
  patterns: string[];
  ctrThresholdPkr: number;
  instructsDepositInFull: boolean;
  dismissable: boolean;
  warningText: string;
}
export interface BenamiResult {
  level: "none" | "family_exempt" | "review" | "high";
  reason: string;
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

export type ThreeWayMatchStatus = "MATCH" | "SHORT_DELIVERY" | "OVER_RATE" | "MULTI";

export interface PurchaseOrderLine {
  id: number;
  purchaseOrderId: number;
  descr: string | null;
  qtyOrdered: string;
  unit: string | null;
  ratePkr: string;
  lineTotal: string;
}
export interface PurchaseOrder {
  id: number;
  businessId: number;
  supplierId: number | null;
  bookingId: number | null;
  paymentMode: string;
  status: string;
  lines?: PurchaseOrderLine[];
}
export interface GrnLineInput {
  purchaseOrderLineId: number;
  qtyAccepted: number;
  actualRatePkr?: number;
}
export interface GoodsReceivedNote {
  id: number;
  purchaseOrderId: number;
  businessId: number;
  status: string;
  threeWayMatchStatus: ThreeWayMatchStatus;
  shortfallPkr: string;
  acceptedValuePkr: string;
  supplierInvoiceId?: number | null;
  glJournalEntryId?: number | null;
}
export interface AcceptGrnResult {
  grn: GoodsReceivedNote;
  supplierInvoice?: { id: number; totalAmount: string; status: string; supplierNameSnapshot: string };
  journalEntry: JournalEntryShape | null;
  idempotentHit: boolean;
}
export interface SettleInvoiceResult {
  supplierInvoice: { id: number; amountPaid: string; status: string };
  journalEntry: JournalEntryShape;
}

export interface GensetReconFlags {
  skimOverBand: boolean;
  runHourPadding: boolean;
  receiptOverClaim: boolean;
}
export interface GensetSkimBaseline {
  n: number;
  isCalibrated: boolean;
  isVerified: boolean;
  skimPercent: number;
  label: string;
}
export interface GensetReconResult {
  reconciled: boolean;
  reason?: string;
  bookingId?: number;
  generatorIdentifier?: string;
  bandSource?: string;
  isCalibrated?: boolean;
  baseline?: GensetSkimBaseline;
  skim?: { expectedL: number; recorded: number; skimVarianceL: number; skimPercent: number; flags: GensetReconFlags };
  flags?: GensetReconFlags;
}
export interface GensetSkimEvent {
  id: number;
  bookingId: number | null;
  occurredAt: string;
  dipConsumptionL: number;
  expectedConsumptionL: number;
  skimVarianceL: number;
  skimPercent: number;
  flags: Partial<GensetReconFlags>;
  bandSource: string;
}
export interface GensetSkimSummary {
  businessId: number;
  generatorIdentifier: string;
  events: GensetSkimEvent[];
  flaggedCount: number;
  baseline: GensetSkimBaseline;
}

export interface UtilityMeter {
  id: number;
  businessId: number;
  label: string;
  meterType: string;
  discoOrUtility: string | null;
  sanctionedLoadKva: string | null;
  isSubMeter: boolean;
  active: boolean;
}
export interface UtilityBillLineInput {
  lineType: string;
  units?: number;
  rate?: number;
  amount: number;
  isBlackMarket?: boolean;
  notes?: string;
}
export interface UtilityBillResult {
  bill: { id: number; businessId: number; meterId: number; billingMonth: string; totalPayable: string };
  reconciliation: { billId: number; totalLines: number; totalPayable: number; residual: number; balanced: boolean };
}
export interface EventUtilityShare {
  eventId: number;
  weight: number;
  allocatedPkr: number;
  basis: string;
}
export interface AllocationResult {
  run?: { id: number; status: string; billingMonth: string; utilityType: string } | null;
  dryRun?: boolean;
  basisUsed?: string;
  totalAllocatable: number;
  residualPkr: number;
  eventCosts: EventUtilityShare[];
  journalCount?: number;
  reason?: string;
}
export interface OffSeasonAccrualResult {
  total: number;
  dryRun?: boolean;
  reason?: string;
  accruals: { eventType: string; amount: number; journalEntryId?: number; idempotentHit?: boolean }[];
}
export interface EventUtilityRollup {
  eventId: number;
  byUtility: Record<string, number>;
  totalPkr: number;
  basisUsed: string | null;
}
export interface SupplierUdhaarBaseline {
  n: number;
  isCalibrated: boolean;
  isVerified: boolean;
  markupPercent: number;
  aprPercent: number;
  label: string;
}

export interface Committee {
  id: number;
  businessId: number;
  name: string;
  role: string;
  monthlyContributionPkr: string;
  cycleMonths: number;
  potPkr: string;
  startMonth: string;
  myPayoutMonth: string | null;
  status: string;
}
export interface IjarahSchedule {
  leaseId: number;
  remainingMonths: number;
  monthlyRental: number;
  futureRentals: number;
  balloonResidualPkr: number;
  takafulRemaining: number;
  totalCommitted: number;
}
export interface IjarahLeaseRow {
  lease: { id: number; businessId: number; lessor: string; structure: string; monthlyRentalPkr: string; termMonths: number; rentalStartDate: string };
  schedule: IjarahSchedule;
}
export interface SupplierUdhaarResult {
  udhaar: { id: number; udhaarPricePkr: string; amountOutstandingPkr: string; status: string; impliedMarkupPct: string | null };
  impliedMarkupPct: number | null;
  annualizedAprPct: number | null;
  journalEntryId: number;
}
export interface UdhaarAging {
  businessId: number;
  asOf: string;
  buckets: { CURRENT: number; D30: number; D60: number; D90_PLUS: number };
  totalOutstanding: number;
  bySupplier: Record<string, number>;
}
export interface AdvanceFloat {
  businessId: number;
  totalAdvancesHeldPkr: number;
  securityDepositsPkr: number;
  refundablePortionPkr: number;
  netFloatPkr: number;
}
export interface LiabilityMonth {
  month: string;
  committeeDuePkr: number;
  ijarahRentalDuePkr: number;
  supplierUdhaarDuePkr: number;
  bankMarkupDuePkr: number;
  pdcChequesDuePkr: number;
  refundLiabilityPkr: number;
  totalDuePkr: number;
  projectedCashPkr: number;
  shortfallPkr: number;
  bounceRisk: boolean;
}
export interface LiabilityCalendar {
  businessId: number;
  fromMonth: string;
  toMonth: string;
  months: LiabilityMonth[];
  bounceRiskMonth: string | null;
  totalDue: number;
}
export interface FacilityMixItem {
  instrument: string;
  amount: number;
  note: string;
}
export interface RunwayPlan {
  businessId: number;
  seasonYear: number;
  openingCashPkr: number;
  financingGapMonth: string | null;
  peakGapPkr: number;
  runwayHeadline: string;
  recommendedFacilityMix: FacilityMixItem[];
  bounceRiskMonth?: string | null;
  months?: LiabilityMonth[];
}

export interface CommsConfig {
  id: number;
  businessId: number;
  smsSenderMask: string | null;
  displayName: string | null;
  greenTick: boolean;
  messagingTier: string | null;
  qualityRating: string | null;
  monthlyBudgetPkr: string | null;
  defaultLanguage: string;
  ivrEnabled: boolean;
}
export interface CommsCostRow {
  bucket: string;
  count: number;
  pkr: string;
  usd: string;
}
export interface CommsCostRollup {
  businessId: number;
  groupBy: string;
  rows: CommsCostRow[];
}
export interface ContactWindow {
  open: boolean;
  openUntil: string | null;
  lastInboundAt: string | null;
}
export interface MessageEventRow {
  id: number;
  businessId: number | null;
  key: string;
  defaultCategory: string;
  channelLadderJson: string[] | null;
  requiresOptIn: boolean;
  allowsFreeForm: boolean;
}
export interface SendEventResult {
  message: { id: number; category: string; costPkr: string; state: string; toMsisdn: string };
  category?: string;
  windowOpen?: boolean;
  idempotentHit: boolean;
}

export interface ForceMajeureItem {
  bookingId: number;
  advancePaid: number;
  isPeakDate?: boolean;
}
export interface ForceMajeureResultRow {
  bookingId: number;
  action: string;
  creditNoteId?: number;
  refundedAmount?: number;
  forfeitedAmount?: number;
  idempotentHit?: boolean;
  planned?: boolean;
  skipped?: string;
}
export interface ForceMajeureBatchResult {
  batchRef: string;
  ruleApplied: string;
  dryRun: boolean;
  affectedCount: number;
  creditsIssued?: number;
  refundsIssued?: number;
  totalCreditAmount?: number;
  totalRefundAmount?: number;
  results: ForceMajeureResultRow[];
}
export interface CreditNote {
  id: number;
  bookingId: number;
  creditNoteNo: string;
  disposition: string;
  principalAmount: string;
  refundedAmount: string;
  forfeitedAmount: string;
  tax236cbReversalStatus: string;
  pstReversalStatus: string;
  batchRef: string | null;
}
export interface InsurancePolicy {
  id: number;
  businessId: number;
  policyType: string;
  insurer: string | null;
  policyNo: string | null;
  sumInsured: string | null;
  expiryDate: string;
  premiumAmount: string | null;
  status: string;
  isVendorOwned: boolean;
}
export interface ClaimRoi {
  businessId: number;
  premiumPaid: number;
  recovered: number;
  ratio: number | null;
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

  section21Meter: (body: { businessId: number; amountPkr: number; paymentMode?: string; accountHead?: string }): Promise<Section21Meter> =>
    unwrap<Section21Meter>(api.post(`${BASE}/aml/section21-meter`, body)),

  structuringCheck: (body: { businessId: number; proposedDepositPkr: number; sameDayDeposits?: { depositPkr: number; branchLabel?: string }[]; monthDepositsPkr?: number; ctrThresholdPkr?: number }): Promise<StructuringResult> =>
    unwrap<StructuringResult>(api.post(`${BASE}/aml/structuring-check`, body)),

  benamiCheck: (body: { businessId: number; relationship: string; traceableFunding?: boolean }): Promise<BenamiResult> =>
    unwrap<BenamiResult>(api.post(`${BASE}/aml/benami-check`, body)),

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

  // Procurement GRN three-way-match (WS3)
  createPurchaseOrder: (body: {
    businessId: number;
    supplierId?: number;
    bookingId?: number;
    paymentMode?: string;
    tenorDays?: number;
    lines: { descr?: string; qtyOrdered: number; unit?: string; ratePkr: number; inventoryItemId?: number; cateringItemId?: number }[];
  }): Promise<PurchaseOrder> => unwrap<PurchaseOrder>(api.post(`${BASE}/purchase-orders`, body)),

  listPurchaseOrders: (businessId: number): Promise<PurchaseOrder[]> =>
    unwrap<PurchaseOrder[]>(api.get(`${BASE}/business/${businessId}/purchase-orders`)),

  receiveGrn: (body: {
    purchaseOrderId: number;
    businessId: number;
    receivedAt?: string;
    photoUrl?: string;
    supplierId?: number;
    lines: GrnLineInput[];
  }): Promise<GoodsReceivedNote> => unwrap<GoodsReceivedNote>(api.post(`${BASE}/goods-received-notes`, body)),

  acceptGrn: (id: number, body?: { isDeclared?: IsDeclared; basis?: "CASH" | "ACCRUAL" }): Promise<AcceptGrnResult> =>
    unwrap<AcceptGrnResult>(api.post(`${BASE}/goods-received-notes/${id}/accept`, body || {})),

  settleSupplierInvoice: (id: number, body: { amountPaid: number; paymentMode?: string }): Promise<SettleInvoiceResult> =>
    unwrap<SettleInvoiceResult>(api.post(`${BASE}/supplier-invoices/${id}/settle`, body)),

  // Genset-skim measurement (WS7-A)
  reconcileGenset: (body: { businessId: number; generatorIdentifier?: string; bookingId: number; kva?: number }): Promise<GensetReconResult> =>
    unwrap<GensetReconResult>(api.post(`${BASE}/genset/reconcile`, body)),

  gensetSkimSummary: (businessId: number, opts?: { from?: string; to?: string; generatorIdentifier?: string }): Promise<GensetSkimSummary> =>
    unwrap<GensetSkimSummary>(api.get(`${BASE}/business/${businessId}/genset/skim-summary`, { params: opts })),

  // Utility apportionment (WS7-B)
  createUtilityMeter: (body: { businessId: number; label: string; meterType: string; discoOrUtility?: string; sanctionedLoadKva?: number; generatorIdentifier?: string }): Promise<UtilityMeter> =>
    unwrap<UtilityMeter>(api.post(`${BASE}/utility-meters`, body)),

  listUtilityMeters: (businessId: number): Promise<UtilityMeter[]> =>
    unwrap<UtilityMeter[]>(api.get(`${BASE}/business/${businessId}/utility-meters`)),

  createUtilityBill: (body: { meterId: number; billingMonth: string; totalPayable: number; dueDate?: string; lines?: UtilityBillLineInput[] }): Promise<UtilityBillResult> =>
    unwrap<UtilityBillResult>(api.post(`${BASE}/utility-bills`, body)),

  runUtilityAllocation: (
    businessId: number,
    body: { billingMonth: string; utilityType?: string; requestedBasis?: string; residualShare?: number; isDeclared?: IsDeclared; dryRun?: boolean },
  ): Promise<AllocationResult> => unwrap<AllocationResult>(api.post(`${BASE}/business/${businessId}/utility-allocation/run`, body)),

  runOffSeasonAccrual: (businessId: number, body: { billingMonth: string; isDeclared?: IsDeclared; dryRun?: boolean }): Promise<OffSeasonAccrualResult> =>
    unwrap<OffSeasonAccrualResult>(api.post(`${BASE}/business/${businessId}/utility-allocation/off-season`, body)),

  eventUtilityRollup: (bookingId: number, businessId?: number): Promise<EventUtilityRollup> =>
    unwrap<EventUtilityRollup>(api.get(`${BASE}/bookings/${bookingId}/utility-rollup`, { params: { businessId } })),

  supplierUdhaarBaseline: (businessId: number, supplierName: string): Promise<SupplierUdhaarBaseline> =>
    unwrap<SupplierUdhaarBaseline>(api.get(`${BASE}/business/${businessId}/supplier-udhaar/${encodeURIComponent(supplierName)}/baseline`)),

  // Working-capital liability calendar (WS8)
  createCommittee: (body: { businessId: number; name: string; role?: string; memberCount?: number; monthlyContributionPkr: number; cycleMonths: number; potPkr: number; startMonth: string; myPayoutMonth?: string }): Promise<Committee> =>
    unwrap<Committee>(api.post(`${BASE}/committees`, body)),

  listCommittees: (businessId: number): Promise<Committee[]> =>
    unwrap<Committee[]>(api.get(`${BASE}/business/${businessId}/committees`)),

  generateCommitteeLedger: (id: number): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/committees/${id}/generate-ledger`, {})),

  recordCommitteeContribution: (id: number, body: { period: string; mode?: string }): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/committees/${id}/contribution`, body)),

  recordCommitteePayout: (id: number, body?: { period?: string }): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/committees/${id}/payout`, body || {})),

  createIjarahLease: (body: { businessId: number; lessor?: string; structure?: string; monthlyRentalPkr: number; termMonths: number; rentalStartDate: string; balloonResidualPkr?: number; takafulPremiumPkr?: number }): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/ijarah-leases`, body)),

  listIjarahLeases: (businessId: number, asOf?: string): Promise<IjarahLeaseRow[]> =>
    unwrap<IjarahLeaseRow[]>(api.get(`${BASE}/business/${businessId}/ijarah-leases`, { params: { asOf } })),

  runIjarahAccrual: (businessId: number, body: { period: string; dryRun?: boolean; isDeclared?: IsDeclared }): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/business/${businessId}/ijarah-accrual/run`, body)),

  recordSupplierUdhaar: (body: { businessId: number; supplierType?: string; supplierNameSnapshot?: string; cashPricePkr?: number; udhaarPricePkr: number; dueDate?: string }): Promise<SupplierUdhaarResult> =>
    unwrap<SupplierUdhaarResult>(api.post(`${BASE}/supplier-udhaar`, body)),

  settleSupplierUdhaar: (id: number, body: { amountPkr: number; mode?: string }): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/supplier-udhaar/${id}/settle`, body)),

  supplierUdhaarAging: (businessId: number, asOf?: string): Promise<UdhaarAging> =>
    unwrap<UdhaarAging>(api.get(`${BASE}/business/${businessId}/supplier-udhaar/aging`, { params: { asOf } })),

  createBankFacility: (body: { businessId: number; lender?: string; type?: string; sanctionedLimitPkr: number; utilisedPkr?: number; kiborPct?: number; spreadPct?: number }): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/bank-facilities`, body)),

  advanceFloat: (businessId: number, asOf?: string): Promise<AdvanceFloat> =>
    unwrap<AdvanceFloat>(api.get(`${BASE}/business/${businessId}/advance-float`, { params: { asOf } })),

  liabilityCalendar: (businessId: number, from: string, to: string, persist?: boolean): Promise<LiabilityCalendar> =>
    unwrap<LiabilityCalendar>(api.get(`${BASE}/business/${businessId}/liability-calendar`, { params: { from, to, persist } })),

  computeRunway: (businessId: number, body: { seasonYear: number; openingCashPkr?: number }): Promise<RunwayPlan> =>
    unwrap<RunwayPlan>(api.post(`${BASE}/business/${businessId}/working-capital/runway`, body)),

  // Multi-channel comms engine (WS6)
  sendCommsEvent: (body: { businessId: number; toMsisdn?: string; contactId?: number; eventKey: string; variables?: Record<string, string>; bookingId?: number; idempotencyKey?: string }): Promise<SendEventResult> =>
    unwrap<SendEventResult>(api.post(`${BASE}/comms/send-event`, body)),

  getCommsCostRollup: (businessId: number, groupBy?: "event" | "month"): Promise<CommsCostRollup> =>
    unwrap<CommsCostRollup>(api.get(`${BASE}/business/${businessId}/comms/cost-rollup`, { params: { groupBy } })),

  getCommsConfig: (businessId: number): Promise<CommsConfig | null> =>
    unwrap<CommsConfig | null>(api.get(`${BASE}/business/${businessId}/comms/config`)),

  putCommsConfig: (businessId: number, body: Partial<CommsConfig>): Promise<CommsConfig> =>
    unwrap<CommsConfig>(api.put(`${BASE}/business/${businessId}/comms/config`, body)),

  getContactWindow: (businessId: number, contactId: number): Promise<ContactWindow> =>
    unwrap<ContactWindow>(api.get(`${BASE}/business/${businessId}/comms/contacts/${contactId}/window`)),

  suppressContact: (contactId: number): Promise<{ contactId: number }> =>
    unwrap<{ contactId: number }>(api.post(`${BASE}/comms/contacts/${contactId}/suppress`, {})),

  listMessageEvents: (businessId?: number): Promise<MessageEventRow[]> =>
    unwrap<MessageEventRow[]>(api.get(`${BASE}/comms/events`, { params: { businessId } })),

  // Force-majeure batch + credit notes (WS9)
  previewForceMajeure: (body: { businessId: number; dateFrom?: string; dateTo?: string; rule?: string; govtOrderRef?: string; items?: ForceMajeureItem[] }): Promise<ForceMajeureBatchResult> =>
    unwrap<ForceMajeureBatchResult>(api.post(`${BASE}/force-majeure/preview`, body)),

  runForceMajeureBatch: (body: { businessId: number; dateFrom?: string; dateTo?: string; rule?: string; reason?: string; govtOrderRef?: string; items?: ForceMajeureItem[]; perEventOverrides?: Record<number, string>; refundPct?: number }): Promise<ForceMajeureBatchResult> =>
    unwrap<ForceMajeureBatchResult>(api.post(`${BASE}/force-majeure/batch`, body)),

  forceMajeureRefund: (bookingId: number, body: { businessId: number; advancePaid: number; rule?: string; refundPct?: number; reason?: string; batchRef?: string }): Promise<unknown> =>
    unwrap<unknown>(api.post(`${BASE}/bookings/${bookingId}/force-majeure-refund`, body)),

  listCreditNotes: (bookingId: number, businessId?: number): Promise<CreditNote[]> =>
    unwrap<CreditNote[]>(api.get(`${BASE}/bookings/${bookingId}/credit-notes`, { params: { businessId } })),

  // Insurance + weather tracking (WS9)
  createPolicy: (body: { businessId: number; policyType: string; insurer?: string; policyNo?: string; sumInsured?: number; expiryDate: string; premiumAmount?: number }): Promise<InsurancePolicy> =>
    unwrap<InsurancePolicy>(api.post(`${BASE}/insurance/policies`, body)),

  listPolicies: (businessId: number, opts?: { status?: string; policyType?: string; expiringWithinDays?: number }): Promise<InsurancePolicy[]> =>
    unwrap<InsurancePolicy[]>(api.get(`${BASE}/business/${businessId}/insurance/policies`, { params: opts })),

  updatePolicyStatus: (id: number, status: string): Promise<InsurancePolicy> =>
    unwrap<InsurancePolicy>(api.patch(`${BASE}/insurance/policies/${id}/status`, { status })),

  sweepPolicies: (): Promise<{ recomputed: number; remindersQueued: number }> =>
    unwrap<{ recomputed: number; remindersQueued: number }>(api.post(`${BASE}/insurance/policies/sweep`, {})),

  claimRoi: (businessId: number): Promise<ClaimRoi> =>
    unwrap<ClaimRoi>(api.get(`${BASE}/business/${businessId}/insurance/claim-roi`)),
};

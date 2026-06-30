"use client";

/**
 * Venue-OS hub — the single page that surfaces the whole P1 vendor-OS pilot:
 * status + tax calculator, group roll-up, per-event P&L, the live EventNight
 * gauge, the PDC clearing drawer, and the cash-float close. The page is gated by
 * isOrgMembershipOn() (the umbrella flag); each sub-panel additionally self-gates
 * on its own feature flag (GL / payment-ledger) and renders nothing until that
 * flag is on, so a partial pilot simply shows fewer panels. Additive — composes
 * existing components, touches no other screen.
 */
import * as React from "react";
import { isOrgMembershipOn } from "@/lib/org-membership-flag";
import { VenueOsInsights } from "./venue-os-insights";
import { OrgRollupView } from "./org-rollup-view";
import { GroupConsolidationView } from "./group-consolidation-view";
import { PeriodCloseView } from "./period-close-view";
import { AccountingDepthView } from "./accounting-depth-view";
import { AmlCockpitView } from "./aml-cockpit-view";
import { ProcurementView } from "./procurement-view";
import { GensetSkimView } from "./genset-skim-view";
import { UtilityAllocationView } from "./utility-allocation-view";
import { LiabilityCalendarView } from "./liability-calendar-view";
import { WorkingCapitalRunwayView } from "./working-capital-runway-view";
import { WorkingCapitalInstrumentsView } from "./working-capital-instruments-view";
import { CommsEngineView } from "./comms-engine-view";
import { ForceMajeureBatchView } from "./force-majeure-batch-view";
import { InsurancePoliciesView } from "./insurance-policies-view";
import { EventPnlView } from "./event-pnl-view";
import { EventCostedPnlView } from "./event-costed-pnl-view";
import { EventMarginsView } from "./event-margins-view";
import { DepreciationView } from "./depreciation-view";
import { VenueLeaseView } from "./venue-lease-view";
import { OwnVsLeaseView } from "./own-vs-lease-view";
import { WageCostingView } from "./wage-costing-view";
import { EventNightGauge } from "./event-night-gauge";
import { PdcDrawer } from "./pdc-drawer";
import { CashFloatClose } from "./cash-float-close";
import { SchedulingCheck } from "./scheduling-check";
import { CateringRecost } from "./catering-recost";
import { BookingGlPost } from "./booking-gl-post";

export function VenueOsHubView(): React.ReactElement {
  if (!isOrgMembershipOn()) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm font-medium">Venue-OS is not enabled for this account.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The multi-venue workspace, per-event P&amp;L, tax engine and cash controls are part of a pilot. Ask your
          account manager to switch it on.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VenueOsInsights />
      <OrgRollupView />
      <GroupConsolidationView />
      <PeriodCloseView />
      <AccountingDepthView />
      <AmlCockpitView />
      <ProcurementView />
      <div className="grid gap-6 lg:grid-cols-2">
        <GensetSkimView />
        <UtilityAllocationView />
      </div>
      <WorkingCapitalRunwayView />
      <LiabilityCalendarView />
      <WorkingCapitalInstrumentsView />
      <CommsEngineView />
      <div className="grid gap-6 lg:grid-cols-2">
        <ForceMajeureBatchView />
        <InsurancePoliciesView />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <EventPnlView />
        <EventNightGauge />
      </div>
      <EventCostedPnlView />
      <EventMarginsView />
      <DepreciationView />
      <VenueLeaseView />
      <OwnVsLeaseView />
      <WageCostingView />
      <div className="grid gap-6 lg:grid-cols-2">
        <PdcDrawer />
        <CashFloatClose />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SchedulingCheck />
        <CateringRecost />
      </div>
      <BookingGlPost />
    </div>
  );
}

export default VenueOsHubView;

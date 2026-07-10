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
import { useVenueOsFlags } from "@/lib/venue-os-runtime-flags";
import { VenueOsInsights } from "./venue-os-insights";
import { BiCockpitView } from "./bi-cockpit-view";
import { OrgRollupView } from "./org-rollup-view";
import { GroupConsolidationView } from "./group-consolidation-view";
import { PeriodCloseView } from "./period-close-view";
import { AccountingDepthView } from "./accounting-depth-view";
import { ComplianceExportView } from "./compliance-export-view";
import { AmlCockpitView } from "./aml-cockpit-view";
import { AmlRegistersView } from "./aml-registers-view";
import { DnfbpCardView } from "./dnfbp-card-view";
import { ProcurementView } from "./procurement-view";
import { RateContractView } from "./rate-contract-view";
import { KitchenBomView } from "./kitchen-bom-view";
import { GensetSkimView } from "./genset-skim-view";
import { UtilityAllocationView } from "./utility-allocation-view";
import { TariffEstimatorView } from "./tariff-estimator-view";
import { LiabilityCalendarView } from "./liability-calendar-view";
import { PdcStressOptimiserView } from "./pdc-stress-optimiser-view";
import { WorkingCapitalRunwayView } from "./working-capital-runway-view";
import { WorkingCapitalInstrumentsView } from "./working-capital-instruments-view";
import { FinancingView } from "./financing-view";
import { CapexView } from "./capex-view";
import { CommsEngineView } from "./comms-engine-view";
import { CommsChannelsView } from "./comms-channels-view";
import { ForceMajeureBatchView } from "./force-majeure-batch-view";
import { InsurancePoliciesView } from "./insurance-policies-view";
import { WeatherClaimView } from "./weather-claim-view";
import { EventNightConsoleView } from "./event-night-console-view";
import { LegalEsgView } from "./legal-esg-view";
import { DiasporaVendorView } from "./diaspora-vendor-view";
import { GuestListView } from "./guest-list-view";
import { CapTableView } from "./cap-table-view";
import { PartnerLedgerView } from "./partner-ledger-view";
import { VenueSpacesManagerView } from "./venue-spaces-manager-view";
import { SpaceSlotsEditor } from "./space-slots-editor";
import { SpaceCalendarView } from "./space-calendar-view";
import { BulkImportView } from "./bulk-import-view";
import { SuccessionView } from "./succession-view";
import { EventPnlView } from "./event-pnl-view";
import { EventCostedPnlView } from "./event-costed-pnl-view";
import { EventMarginsView } from "./event-margins-view";
import { SpacePnlView } from "./space-pnl-view";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ExpenseCockpit } from "@/components/dashboard/mainScreens/expenses/expense-cockpit";
import { EventProfitBoard } from "./event-profit-board";
import { TodayBoard } from "./today-board";
import { Icon, type IconName } from "@/components/dashboard/shared/icon";

// Everyday tabs a normal hall owner needs; the accountant/CFO tools live under
// "Advanced" so they never wall off the day-to-day surface.
const PRIMARY_TABS: { value: string; label: string; icon: IconName }[] = [
  { value: "today", label: "Today", icon: "CalendarCheck" },
  { value: "profit", label: "Bookings & Profit", icon: "TrendingUp" },
  { value: "money", label: "Money & Expenses", icon: "Wallet" },
  { value: "spaces", label: "Spaces", icon: "LayoutGrid" },
  { value: "cash", label: "Cash & Cheques", icon: "CreditCard" },
  { value: "kitchen", label: "Kitchen", icon: "Utensils" },
  { value: "advanced", label: "Advanced", icon: "Settings2" },
];

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function AdvGroup({ value, title, icon, children }: { value: string; title: string; icon: IconName; children: React.ReactNode }): React.ReactElement {
  return (
    <AccordionItem value={value} className="rounded-lg border border-border px-3">
      <AccordionTrigger className="py-3 text-sm hover:no-underline">
        <span className="flex items-center gap-2"><Icon name={icon} size={16} className="text-muted-foreground" /> {title}</span>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

export function VenueOsHubView(): React.ReactElement {
  // Resolve per-venue flags for the active business (populates the runtime store
  // the flag functions read). Shows the hub for venues with a per-business
  // override even when the global env flag is off.
  const { loading } = useVenueOsFlags();

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">Loading your venue-OS workspace…</p>
      </div>
    );
  }

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
    <div className="space-y-5">
      {/* One honest line so an owner is never lost about what this screen is. */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon name="Building2" size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Your venue command centre</h3>
            <p className="text-sm text-muted-foreground">
              Run tonight&apos;s event, see whether each shaadi made money, track every expense, chase cheques, and
              manage your halls — all in one place. Start with <span className="font-medium text-foreground">Today</span>;
              the deeper accounting tools sit under <span className="font-medium text-foreground">Advanced</span>.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-auto">
            {PRIMARY_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 whitespace-nowrap">
                <Icon name={t.icon} size={15} />
                <span>{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="today" className="mt-5">
          <Section title="Tonight" hint="What's happening at your hall right now — headcount vs safe capacity, valet & incidents, RSVPs, and is-this-slot-free.">
            <TodayBoard />
            <EventNightGauge />
            <EventNightConsoleView />
            <GuestListView />
            <SchedulingCheck />
          </Section>
        </TabsContent>

        <TabsContent value="profit" className="mt-5">
          <Section title="Bookings & profit" hint="Did this shaadi make money — and what tax do you owe on it?">
            <EventProfitBoard />
            <EventPnlView />
            <CateringRecost />
            <VenueOsInsights />
          </Section>
        </TabsContent>

        <TabsContent value="money" className="mt-5">
          <Section title="Money & expenses" hint="Every rupee out — by day, month or year, split by category and by function (hall rent & overheads included).">
            <ExpenseCockpit />
            <WageCostingView />
            <VenueLeaseView />
            <div className="grid gap-6 lg:grid-cols-2">
              <GensetSkimView />
              <UtilityAllocationView />
            </div>
            <DepreciationView />
            <TariffEstimatorView />
          </Section>
        </TabsContent>

        <TabsContent value="spaces" className="mt-5">
          <Section title="Spaces & calendar" hint="Build your hall / floor / partition tree, set slots, see the availability grid, and see which space earns most.">
            <VenueSpacesManagerView />
            <SpaceSlotsEditor />
            <SpaceCalendarView />
            <SpacePnlView />
          </Section>
        </TabsContent>

        <TabsContent value="cash" className="mt-5">
          <Section title="Cash & cheques" hint="Close the daily galla with over/short, and chase post-dated cheques before they clear or bounce.">
            <div className="grid gap-6 lg:grid-cols-2">
              <CashFloatClose />
              <PdcDrawer />
            </div>
            <LiabilityCalendarView />
            <PdcStressOptimiserView />
          </Section>
        </TabsContent>

        <TabsContent value="kitchen" className="mt-5">
          <Section title="Kitchen & suppliers" hint="Recipe cost & theft check, purchase orders, and supplier rate contracts.">
            <KitchenBomView />
            <ProcurementView />
            <RateContractView />
          </Section>
        </TabsContent>

        <TabsContent value="advanced" className="mt-5">
          <p className="mb-3 text-sm text-muted-foreground">
            Accountant &amp; multi-venue tools. Open a section only when you need it — a plain hall owner can ignore this whole tab.
          </p>
          <Accordion type="multiple" className="space-y-2">
            <AdvGroup value="costing" title="Full costing & margins" icon="TrendingUp">
              <EventCostedPnlView />
              <EventMarginsView />
              <BookingGlPost />
            </AdvGroup>
            <AdvGroup value="accounting" title="Accounting & tax" icon="FileText">
              <AccountingDepthView />
              <PeriodCloseView />
              <ComplianceExportView />
            </AdvGroup>
            <AdvGroup value="group" title="Group, partners & capital" icon="Building2">
              <BiCockpitView />
              <OrgRollupView />
              <GroupConsolidationView />
              <CapexView />
              <OwnVsLeaseView />
              <CapTableView />
              <PartnerLedgerView />
              <SuccessionView />
            </AdvGroup>
            <AdvGroup value="working-capital" title="Working capital & financing" icon="DollarSign">
              <WorkingCapitalRunwayView />
              <WorkingCapitalInstrumentsView />
              <FinancingView />
            </AdvGroup>
            <AdvGroup value="compliance" title="Compliance (AML / KYC)" icon="ShieldCheck">
              <AmlCockpitView />
              <AmlRegistersView />
              <DnfbpCardView />
            </AdvGroup>
            <AdvGroup value="legal" title="Legal, insurance & safety" icon="ClipboardList">
              <InsurancePoliciesView />
              <WeatherClaimView />
              <ForceMajeureBatchView />
              <LegalEsgView />
            </AdvGroup>
            <AdvGroup value="setup" title="Setup & tools" icon="Settings2">
              <BulkImportView />
              <CommsEngineView />
              <CommsChannelsView />
              <DiasporaVendorView />
            </AdvGroup>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VenueOsHubView;

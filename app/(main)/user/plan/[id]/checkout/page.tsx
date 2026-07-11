"use client";

/**
 * Shaadi Plan — checkout (spec §6, §9).
 *
 * A review of which vendor lines will book, an optional "Check availability"
 * pass that surfaces per-line warnings before committing, then the
 * orchestrator POST that books best-effort (one Booking per function) and
 * returns an honest per-line outcome (booked ✓ / slot-gone ⤳ retry /
 * failed). Never fakes success — the outcome screen shows exactly what
 * happened (spec §6 partial-failure semantics).
 *
 * Flag-gated (mount effect); legacy flows untouched.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { useWeddingPlanFlag } from "@/lib/wedding-plan";
import {
  WeddingPlansAPI,
  type PlanFull,
  type PlanItem,
  type WeddingEvent,
  type AvailabilityResult,
  type CheckoutOutcome,
} from "@/lib/api/weddingPlans";
import {
  eventTypeLabel,
  eventTypeOrder,
  fmtPlanDate,
  fmtPKR,
  toNum,
} from "@/lib/wedding-plan-events";
import { CheckoutOutcomeView } from "@/components/wedding-plan/checkout-outcome";

/** The default set the orchestrator books (spec §6). */
function isBookable(it: PlanItem): boolean {
  return (
    (it.status === "shortlisted" ||
      it.status === "inquiry_sent" ||
      it.status === "quoted") &&
    it.agreedAmount != null &&
    Number(it.agreedAmount) > 0
  );
}

function planTitle(p: PlanFull["plan"]): string {
  if (p.title?.trim()) return p.title;
  if (p.brideName && p.groomName) return `${p.brideName} & ${p.groomName}`;
  return "Your Wedding";
}

export default function PlanCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUser();
  const enabled = useWeddingPlanFlag();
  const [mounted, setMounted] = React.useState(false);
  const planId = Number(params?.id);

  const [full, setFull] = React.useState<PlanFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [avail, setAvail] = React.useState<Record<number, AvailabilityResult>>({});
  const [checkingAvail, setCheckingAvail] = React.useState(false);
  const [booking, setBooking] = React.useState(false);
  const [outcome, setOutcome] = React.useState<CheckoutOutcome | null>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/user/plan/${planId}/checkout`);
    }
  }, [isAuthenticated, isLoading, router, planId]);

  const load = React.useCallback(async () => {
    if (!user || !enabled || !Number.isFinite(planId)) return;
    setLoading(true);
    try {
      const detail = await WeddingPlansAPI.getFull(planId);
      setFull(detail);
      // Pre-select every bookable line.
      if (detail) {
        const ids = detail.events
          .flatMap((e) => e.items ?? [])
          .filter(isBookable)
          .map((it) => it.id);
        setSelected(new Set(ids));
      }
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't load this plan";
      toast({ title: "Couldn't load", description: msg, variant: "destructive" });
      setFull(null);
    } finally {
      setLoading(false);
    }
  }, [user, enabled, planId]);

  React.useEffect(() => {
    if (user && enabled) load();
  }, [user, enabled, load]);

  // --- Derived ------------------------------------------------------------
  const events: WeddingEvent[] = React.useMemo(
    () =>
      full
        ? [...full.events].sort(
            (a, b) =>
              (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
              eventTypeOrder(a.eventType) - eventTypeOrder(b.eventType),
          )
        : [],
    [full],
  );

  const bookableByEvent = React.useMemo(
    () =>
      events
        .map((e) => ({
          event: e,
          items: (e.items ?? []).filter(isBookable),
        }))
        .filter((g) => g.items.length > 0),
    [events],
  );

  const itemsById = React.useMemo(() => {
    const m: Record<number, PlanItem> = {};
    for (const g of bookableByEvent) for (const it of g.items) m[it.id] = it;
    return m;
  }, [bookableByEvent]);

  const eventByItem = React.useMemo(() => {
    const m: Record<number, WeddingEvent> = {};
    for (const g of bookableByEvent) for (const it of g.items) m[it.id] = g.event;
    return m;
  }, [bookableByEvent]);

  const labelForItem = React.useCallback(
    (itemId: number): string => {
      const it = itemsById[itemId];
      const ev = eventByItem[itemId];
      const name = it?.business?.name || (it ? `Vendor #${it.businessId}` : `Line #${itemId}`);
      const evLabel = ev ? ev.title?.trim() || eventTypeLabel(ev.eventType) : "";
      return evLabel ? `${name} · ${evLabel}` : name;
    },
    [itemsById, eventByItem],
  );

  const selectedIds = React.useMemo(() => [...selected], [selected]);
  const selectedSubtotal = selectedIds.reduce(
    (sum, id) => sum + toNum(itemsById[id]?.agreedAmount),
    0,
  );

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const checkAvailability = async () => {
    if (selectedIds.length === 0) return;
    setCheckingAvail(true);
    try {
      const results = await WeddingPlansAPI.availability(planId, { itemIds: selectedIds });
      const map: Record<number, AvailabilityResult> = {};
      for (const r of results) map[r.itemId] = r;
      setAvail(map);
      const unavailable = results.filter((r) => r.status === "unavailable").length;
      toast({
        title: unavailable ? "Some slots need attention" : "Availability checked",
        description: unavailable
          ? `${unavailable} line${unavailable === 1 ? "" : "s"} may be unavailable — see the warnings.`
          : "All selected vendors look available.",
        variant: unavailable ? "destructive" : undefined,
      });
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't check availability";
      toast({ title: "Couldn't check", description: msg, variant: "destructive" });
    } finally {
      setCheckingAvail(false);
    }
  };

  const book = async () => {
    if (selectedIds.length === 0) return;
    setBooking(true);
    try {
      const result = await WeddingPlansAPI.checkout(planId, { itemIds: selectedIds });
      setOutcome(result);
      const n = result.booked.length;
      toast({
        title: n > 0 ? `Booked ${n} function${n === 1 ? "" : "s"}` : "Nothing booked",
        description:
          result.skipped.length || result.failed.length
            ? "See the breakdown below."
            : "Vendors have been notified.",
        variant: n === 0 ? "destructive" : undefined,
      });
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Checkout failed";
      toast({ title: "Checkout failed", description: msg, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  // --- Guard rails --------------------------------------------------------
  if (!mounted) {
    return (
      <PageContainer>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!enabled) {
    return (
      <PageContainer>
        <PageHeader title="Not available" />
        <Button variant="outline" onClick={() => router.push("/user/plan")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back
        </Button>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!full) {
    return (
      <PageContainer>
        <PageHeader title="Plan not found" />
        <Button variant="outline" onClick={() => router.push("/user/plan")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to plans
        </Button>
      </PageContainer>
    );
  }

  // --- Outcome screen -----------------------------------------------------
  if (outcome) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={
            <Link
              href={`/user/plan/${planId}`}
              className="inline-flex items-center gap-1 text-bridal-gold-dark hover:text-bridal-charcoal"
            >
              <ArrowLeft className="h-3 w-3" />
              {planTitle(full.plan)}
            </Link>
          }
          title="Booking result"
        />
        <CheckoutOutcomeView
          outcome={outcome}
          itemsById={itemsById}
          labelForItem={labelForItem}
          planId={planId}
          onRetry={() => {
            setOutcome(null);
            load();
          }}
        />
      </PageContainer>
    );
  }

  // --- Review screen ------------------------------------------------------
  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Link
            href={`/user/plan/${planId}`}
            className="inline-flex items-center gap-1 text-bridal-gold-dark hover:text-bridal-charcoal"
          >
            <ArrowLeft className="h-3 w-3" />
            {planTitle(full.plan)}
          </Link>
        }
        title="Book my wedding"
        description="Review what will book, check availability, then book everything together. Lines without an agreed price stay on your shortlist."
      />

      {bookableByEvent.length === 0 ? (
        <SectionCard title="Nothing ready to book yet">
          <p className="text-sm text-bridal-text-soft">
            Set an agreed price on the vendors you want to book from the plan builder,
            then come back here.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href={`/user/plan/${planId}`}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to plan
            </Link>
          </Button>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Review list */}
          <div className="lg:col-span-2 space-y-4">
            {bookableByEvent.map(({ event, items }) => {
              const evLabel = event.title?.trim() || eventTypeLabel(event.eventType);
              return (
                <SectionCard
                  key={event.id}
                  title={evLabel}
                  description={`${fmtPlanDate(event.eventDate)}${
                    event.city ? ` · ${event.city}` : ""
                  } — books as one booking`}
                >
                  <div className="space-y-2">
                    {items.map((it) => {
                      const on = selected.has(it.id);
                      const a = avail[it.id];
                      return (
                        <label
                          key={it.id}
                          className={`flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                            on
                              ? "border-bridal-gold/45 bg-bridal-cream"
                              : "border-bridal-beige bg-white opacity-70"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(it.id)}
                              className="h-4 w-4 accent-bridal-gold"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-bridal-charcoal truncate">
                                {it.business?.name || `Vendor #${it.businessId}`}
                              </p>
                              {it.vendorType && (
                                <p className="text-[11px] text-bridal-text-soft">
                                  {it.vendorType}
                                </p>
                              )}
                              {a && <AvailabilityBadge result={a} />}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-bridal-charcoal tabular-nums shrink-0">
                            {fmtPKR(it.agreedAmount)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </SectionCard>
              );
            })}
          </div>

          {/* Summary + actions */}
          <div className="space-y-4">
            <SectionCard title="Order summary">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-bridal-text-soft">Selected lines</span>
                  <span className="font-medium text-bridal-charcoal tabular-nums">
                    {selectedIds.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-bridal-text-soft">Functions</span>
                  <span className="font-medium text-bridal-charcoal tabular-nums">
                    {
                      new Set(selectedIds.map((id) => eventByItem[id]?.id)).size
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-bridal-beige/70 pt-2.5">
                  <span className="text-bridal-text-soft">Subtotal</span>
                  <span className="font-display italic text-[18px] text-bridal-charcoal tabular-nums">
                    {fmtPKR(selectedSubtotal)}
                  </span>
                </div>
                {full.discount.percent > 0 && (
                  <p className="text-[11px] text-bridal-gold-dark leading-relaxed">
                    A whole-wedding discount (up to {full.discount.percent}%) is
                    calculated and applied across every function at checkout.
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={checkAvailability}
                  disabled={checkingAvail || booking || selectedIds.length === 0}
                >
                  {checkingAvail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Check availability
                </Button>
                <Button
                  className="w-full gap-1.5"
                  onClick={book}
                  disabled={booking || selectedIds.length === 0}
                >
                  {booking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                  Book my wedding
                </Button>
              </div>

              <p className="text-[10.5px] text-bridal-text-soft mt-3 italic leading-relaxed">
                Payment uses the same rail as a single booking. If a slot is taken while
                you check out, that function is skipped — the rest still book, and you can
                retry.
              </p>
            </SectionCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function AvailabilityBadge({ result }: { result: AvailabilityResult }) {
  const status = result.status;
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[#3F6B43] mt-1">
        <CheckCircle2 className="h-3 w-3" />
        {result.message || "Available"}
      </span>
    );
  }
  if (status === "unavailable") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-bridal-coral mt-1">
        <AlertTriangle className="h-3 w-3" />
        {result.message || "May be unavailable"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-bridal-text-soft mt-1">
      <HelpCircle className="h-3 w-3" />
      {result.message || "Availability unknown"}
    </span>
  );
}

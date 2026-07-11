"use client";

/**
 * Shaadi Plan — builder (spec §9, the heart).
 *
 * Fetches the full plan (umbrella + functions + vendor lines + budget +
 * discount + tier ladder) and renders each function as an editable section
 * with its own vendor lines, plus a plan-wide budget / bundle-discount bar
 * and a "Book my wedding" CTA that routes into checkout.
 *
 * Flag-gated (mount effect) so the surface never leaks; legacy screens are
 * untouched.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Sparkles,
  CalendarHeart,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { useWeddingPlanFlag } from "@/lib/wedding-plan";
import { WeddingPlansAPI, type PlanFull, type PlanItem } from "@/lib/api/weddingPlans";
import { eventTypeOrder, fmtPlanDate } from "@/lib/wedding-plan-events";
import { AddEventDialog } from "@/components/wedding-plan/add-event-dialog";
import { DiscountBar } from "@/components/wedding-plan/discount-bar";
import { PlanEventSection } from "@/components/wedding-plan/plan-event-section";

/** A line the checkout can attempt to book (spec §6 default set). */
function isBookableItem(it: PlanItem): boolean {
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

export default function PlanBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUser();
  const enabled = useWeddingPlanFlag();
  const [mounted, setMounted] = React.useState(false);
  const planId = Number(params?.id);

  const [full, setFull] = React.useState<PlanFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [addEventOpen, setAddEventOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/user/plan/${planId}`);
    }
  }, [isAuthenticated, isLoading, router, planId]);

  const load = React.useCallback(async () => {
    if (!user || !enabled || !Number.isFinite(planId)) return;
    setLoading(true);
    try {
      const detail = await WeddingPlansAPI.getFull(planId);
      setFull(detail);
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

  const deletePlan = async () => {
    if (!full) return;
    if (
      !confirm(
        "Delete this wedding plan? Functions and shortlisted vendors are removed. Any vendors already booked keep their bookings.",
      )
    )
      return;
    setDeleting(true);
    try {
      await WeddingPlansAPI.remove(planId);
      toast({ title: "Plan deleted" });
      router.push("/user/plan");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't delete the plan";
      toast({ title: "Couldn't delete", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // --- Guard rails: skeleton pre-mount, hidden when flag off --------------
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

  // Sort functions by BE sortOrder, then canonical running order.
  const events = [...full.events].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      eventTypeOrder(a.eventType) - eventTypeOrder(b.eventType),
  );

  const allItems = events.flatMap((e) => e.items ?? []);
  const bookableCount = allItems.filter(isBookableItem).length;
  const activeVendorCount = allItems.filter(
    (it) => it.status !== "removed" && it.status !== "declined",
  ).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Link
            href="/user/plan"
            className="inline-flex items-center gap-1 text-bridal-gold-dark hover:text-bridal-charcoal"
          >
            <ArrowLeft className="h-3 w-3" />
            All plans
          </Link>
        }
        title={planTitle(full.plan)}
        description={
          full.plan.weddingDate
            ? `Wedding ${fmtPlanDate(full.plan.weddingDate)}${
                full.plan.primaryCity ? ` · ${full.plan.primaryCity}` : ""
              }`
            : full.plan.primaryCity || undefined
        }
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setAddEventOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add function
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={bookableCount === 0}
              onClick={() => router.push(`/user/plan/${planId}/checkout`)}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Book my wedding
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-bridal-text-soft hover:text-bridal-coral"
              onClick={deletePlan}
              disabled={deleting}
              aria-label="Delete plan"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Functions */}
        <div className="lg:col-span-2 space-y-4">
          {events.length === 0 ? (
            <SectionCard title="Add your first function">
              <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream/50 p-8 text-center">
                <CalendarHeart className="h-7 w-7 text-bridal-gold mx-auto mb-2" />
                <p className="text-sm font-medium text-bridal-charcoal">
                  No functions yet
                </p>
                <p className="text-xs text-bridal-text-soft mt-1 max-w-sm mx-auto">
                  Add each function of your shaadi — Mayoun, Mehndi, Nikah, Baraat,
                  Walima — then shortlist the vendors for each one.
                </p>
                <Button
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={() => setAddEventOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add a function
                </Button>
              </div>
            </SectionCard>
          ) : (
            events.map((ev) => (
              <PlanEventSection
                key={ev.id}
                planId={planId}
                event={ev}
                onChanged={load}
              />
            ))
          )}
        </div>

        {/* Budget + discount + book */}
        <div className="space-y-4">
          <DiscountBar budget={full.budget} discount={full.discount} tiers={full.tiers} />

          <SectionCard title="Ready to book?">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-bridal-text-soft">Vendors shortlisted</span>
                <span className="font-medium text-bridal-charcoal tabular-nums">
                  {activeVendorCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-bridal-text-soft">Ready to book</span>
                <span className="font-medium text-bridal-charcoal tabular-nums">
                  {bookableCount}
                </span>
              </div>
              {bookableCount === 0 ? (
                <p className="text-[11px] text-bridal-text-soft italic leading-relaxed">
                  Set an agreed price on the vendors you want to book, then this button
                  lights up. Lines without a price stay on your shortlist.
                </p>
              ) : (
                <p className="text-[11px] text-bridal-text-soft leading-relaxed">
                  We&apos;ll check availability, then book each function&apos;s vendors —
                  and show you exactly what got booked.
                </p>
              )}
              <Button
                className="w-full gap-1.5"
                disabled={bookableCount === 0}
                onClick={() => router.push(`/user/plan/${planId}/checkout`)}
              >
                <ShoppingBag className="h-4 w-4" />
                Book my wedding
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="How the Shaadi Plan works">
            <ul className="space-y-2 text-xs text-bridal-text-soft">
              <li className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-bridal-gold" />
                Each function shares one date, city and guest count across its vendors.
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-bridal-gold" />
                Book more functions together to unlock a bigger whole-wedding discount.
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-bridal-gold" />
                Bookings you already confirmed keep their original price.
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <AddEventDialog
        planId={planId}
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        onSaved={() => {
          setAddEventOpen(false);
          load();
        }}
      />
    </PageContainer>
  );
}

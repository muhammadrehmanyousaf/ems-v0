"use client";

/**
 * Shaadi Plan — plan-wide budget bar + live bundle-discount preview.
 *
 * Reuses the umbrella tier-ladder visual language (spec §9): a running
 * budget bar plus the "X more to unlock" tier copy. The discount is the
 * NON-order-dependent one (spec §5) — a single tier % for the *final*
 * count of events that will book, applied uniformly. This block only
 * previews it; the % is actually committed at checkout.
 */

import * as React from "react";
import { Sparkles, TrendingDown, PiggyBank } from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";
import {
  type PlanBudgetSummary,
  type PlanDiscountPreview,
  type BundleTier,
} from "@/lib/api/weddingPlans";
import { fmtPKR, toNum } from "@/lib/wedding-plan-events";

interface DiscountBarProps {
  budget: PlanBudgetSummary;
  discount: PlanDiscountPreview;
  tiers: BundleTier[];
}

export function DiscountBar({ budget, discount, tiers }: DiscountBarProps) {
  const subtotal = toNum(budget.itemsSubtotal);
  const savings = toNum(discount.estimatedSavings || budget.estimatedSavings);
  const projected = toNum(budget.projectedTotal || subtotal - savings);
  const budgetMax = budget.budgetMax != null ? toNum(budget.budgetMax) : null;

  // Budget bar fill — projected spend as a share of the max budget.
  const pct =
    budgetMax && budgetMax > 0
      ? Math.min(100, Math.round((projected / budgetMax) * 100))
      : null;
  const overBudget = budgetMax != null && projected > budgetMax;

  // Sorted tier ladder + the next tier the family can still reach.
  const ladder = [...tiers].sort((a, b) => a.minCount - b.minCount);
  const eligible = discount.eligibleCount || budget.bookableEventCount || 0;
  const nextTier = ladder.find((t) => t.minCount > eligible) || null;

  return (
    <SectionCard
      title="Budget & bundle savings"
      description="Across every function you plan to book."
    >
      {/* Money roll-up */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
            Subtotal
          </p>
          <p className="font-display italic text-[20px] text-bridal-charcoal tabular-nums leading-tight">
            {fmtPKR(subtotal)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
            Bundle savings
          </p>
          <p className="font-display italic text-[20px] text-[#3F6B43] tabular-nums leading-tight inline-flex items-center gap-1">
            {savings > 0 ? `- ${fmtPKR(savings)}` : "Rs. 0"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
            You pay
          </p>
          <p className="font-display italic text-[20px] text-bridal-gold-dark tabular-nums leading-tight">
            {fmtPKR(projected)}
          </p>
        </div>
      </div>

      {/* Budget progress bar (only when a max budget is set) */}
      {pct != null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-bridal-text-soft mb-1">
            <span>{pct}% of your Rs. {budgetMax!.toLocaleString("en-PK")} budget</span>
            {overBudget && (
              <span className="text-bridal-coral font-medium">Over budget</span>
            )}
          </div>
          <div className="h-2.5 w-full rounded-full bg-bridal-cream border border-bridal-beige overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overBudget ? "bg-bridal-coral" : "bg-bridal-gold"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Live discount headline */}
      {discount.percent > 0 ? (
        <div className="rounded-md border border-bridal-gold/45 bg-bridal-cream p-3.5 mb-3">
          <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark mb-1 inline-flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            {discount.percent}% whole-wedding discount
          </p>
          <p className="text-[11px] text-bridal-text-soft leading-relaxed">
            Booking {eligible} function{eligible === 1 ? "" : "s"} together unlocks
            the {discount.tier?.minCount}+ tier. All functions get the same rate —
            no matter the order you book them.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream/50 p-3.5 mb-3">
          <p className="text-[12px] text-bridal-charcoal inline-flex items-center gap-1.5">
            <PiggyBank className="h-4 w-4 text-bridal-gold" />
            Book more functions together to unlock a bundle discount.
          </p>
        </div>
      )}

      {/* Tier ladder — reuses the umbrella "X more to unlock" copy */}
      {ladder.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
            Tier ladder
          </p>
          {ladder.map((t) => {
            const active = discount.tier && t.minCount === discount.tier.minCount;
            const isNext = nextTier && t.minCount === nextTier.minCount;
            return (
              <div
                key={t.minCount}
                className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                  active
                    ? "bg-bridal-gold/15 text-bridal-gold-dark font-medium"
                    : "text-bridal-text-soft"
                }`}
              >
                <span>
                  {t.minCount}+ functions
                  {active && " · current"}
                  {isNext && (
                    <span className="ml-1 text-bridal-gold-dark">
                      · add {t.minCount - eligible} more to unlock
                    </span>
                  )}
                </span>
                <span className="tabular-nums">{t.percent}% off</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10.5px] text-bridal-text-soft mt-3 italic leading-relaxed inline-flex items-start gap-1.5">
        <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-bridal-gold" />
        The discount is locked in when you book. Any bookings you already
        confirmed earlier keep their original price.
      </p>
    </SectionCard>
  );
}

export default DiscountBar;

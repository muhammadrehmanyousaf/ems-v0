"use client";

/**
 * Soft upgrade nudge (§17.1). Renders a small, non-blocking banner
 * inviting the vendor to upgrade when a feature belongs to a higher
 * plan than they're on. It never hides or blocks anything itself: the
 * server is what refuses, and screens that must show a feature as locked
 * use <PlanGuard> / <PlanLockedCard> (components/dashboard/plans).
 *
 * Renders nothing unless the SERVER says this vendor is locked out of the
 * feature (plan enforcement on AND the plan lacks it); while enforcement is
 * off, while loading, or on a failed lookup it renders nothing at all.
 *
 * Usage:
 *   <UpgradeNudge feature="analytics" />
 *   <UpgradeNudge feature="forecasting" compact />
 */

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useEntitlement, type EntitlementFeature } from "@/lib/entitlements";

export default function UpgradeNudge({
  feature,
  compact = false,
  message,
}: {
  feature: EntitlementFeature;
  compact?: boolean;
  message?: string;
}) {
  const { showNudge, requiredLabel } = useEntitlement(feature);
  if (!showNudge) return null;

  const text = message
    || `This is available on ${requiredLabel}.`;

  if (compact) {
    return (
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1 rounded-full border border-bridal-gold-dark/30 bg-bridal-gold-dark/5 px-2 py-0.5 text-[10px] font-medium text-bridal-gold-dark hover:bg-bridal-gold-dark/10"
      >
        <Sparkles className="h-3 w-3" /> {requiredLabel}
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/billing"
      className="flex items-center justify-between gap-3 rounded-md border border-bridal-gold-dark/30 bg-gradient-to-r from-bridal-gold-dark/[0.06] to-transparent px-3 py-2 hover:from-bridal-gold-dark/10 transition-colors group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="h-4 w-4 text-bridal-gold-dark shrink-0" />
        <p className="text-xs text-foreground truncate">
          {text} <span className="text-muted-foreground">See plans to unlock it.</span>
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-bridal-gold-dark shrink-0">
        See plans <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  );
}

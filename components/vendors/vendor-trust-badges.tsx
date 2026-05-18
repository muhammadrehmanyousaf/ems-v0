"use client";

/**
 * BK-100.6 — Vendor trust badges (and optional tier chip).
 *
 * Drop this anywhere a vendor's `reliability` block is available
 * (search-result card, detail page hero, dashboard widget). The
 * server-side scorer (utils/vendorReliabilityScore.js) returns the
 * `badges` array; this component is purely presentational.
 *
 * Badge keys come from the backend and are translated to:
 *   - a short human label
 *   - an accent color
 *   - a lucide icon
 *
 * Unknown keys are ignored (forward-compatible — a future badge ships
 * server-side and existing FE clients gracefully skip rendering it
 * until they upgrade).
 */

import * as React from "react";
import { Crown, ShieldCheck, Award, Sparkles, Zap, Star, Verified } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorTrustBadgesProps {
  badges?: string[];
  tier?: "newcomer" | "rising" | "trusted" | "premium" | "elite";
  /** Show the tier chip alongside badges. Default true. */
  showTier?: boolean;
  /** Compact mode (no labels, icon-only) for tight cards. */
  compact?: boolean;
  /** Max badges to render; rest collapse to "+N". Default 4. */
  max?: number;
  className?: string;
}

interface BadgeMeta {
  label: string;
  Icon: React.ElementType;
  /** Tailwind classes for the badge pill. */
  className: string;
  title: string; // tooltip
}

const BADGE_META: Record<string, BadgeMeta> = {
  top_vendor: {
    label: "Top Vendor",
    Icon: Crown,
    className:
      "border-bridal-gold/55 bg-bridal-gold/15 text-bridal-gold-dark",
    title: "Average rating 4.5+ from 5 or more reviews",
  },
  verified: {
    label: "Verified",
    Icon: Verified,
    className: "border-blue-300 bg-blue-50 text-blue-700",
    title: "Email and phone verified",
  },
  tier3_verified: {
    label: "ID Verified",
    Icon: ShieldCheck,
    className: "border-emerald-400 bg-emerald-50 text-emerald-700",
    title: "CNIC verified by Wedding Wala",
  },
  established: {
    label: "Established",
    Icon: Award,
    className: "border-amber-400 bg-amber-50 text-amber-700",
    title: "3+ years in business with 20+ weddings completed",
  },
  dispute_free: {
    label: "Dispute-free",
    Icon: Sparkles,
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
    title: "5+ reviews with zero disputes filed",
  },
  high_volume: {
    label: "High volume",
    Icon: Star,
    className: "border-purple-300 bg-purple-50 text-purple-700",
    title: "25 or more reviews",
  },
  quick_responder: {
    label: "Quick Responder",
    Icon: Zap,
    className: "border-orange-300 bg-orange-50 text-orange-700",
    title: "Responds to inquiries within 1 hour",
  },
};

const TIER_META: Record<
  NonNullable<VendorTrustBadgesProps["tier"]>,
  { label: string; className: string }
> = {
  newcomer: { label: "New", className: "border-neutral-200 bg-neutral-50 text-neutral-600" },
  rising: { label: "Rising", className: "border-blue-200 bg-blue-50 text-blue-700" },
  trusted: { label: "Trusted", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  premium: { label: "Premium", className: "border-bridal-gold/55 bg-bridal-cream text-bridal-gold-dark" },
  elite: { label: "Elite", className: "border-purple-300 bg-purple-50 text-purple-700" },
};

export function VendorTrustBadges({
  badges,
  tier,
  showTier = true,
  compact = false,
  max = 4,
  className,
}: VendorTrustBadgesProps) {
  if ((!badges || badges.length === 0) && !tier) return null;

  // Hide the "newcomer" tier chip by default — adding "New" next to
  // a vendor card hurts conversion. Tier becomes visible at "rising" +.
  const renderTier = showTier && tier && tier !== "newcomer";

  // Resolve known badges, preserve incoming order (server-side scorer
  // orders by significance), cap at `max`.
  const resolved = (badges || [])
    .map((key) => ({ key, meta: BADGE_META[key] }))
    .filter((b): b is { key: string; meta: BadgeMeta } => !!b.meta)
    .slice(0, max);

  const overflow = Math.max(
    0,
    (badges || []).filter((k) => k in BADGE_META).length - resolved.length,
  );

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      aria-label="Vendor trust badges"
    >
      {renderTier && tier && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
            TIER_META[tier].className,
          )}
          title={`Vendor tier: ${TIER_META[tier].label}`}
        >
          {TIER_META[tier].label}
        </span>
      )}
      {resolved.map(({ key, meta }) => {
        const { Icon } = meta;
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              meta.className,
            )}
            title={meta.title}
            aria-label={meta.label}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {!compact && <span>{meta.label}</span>}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-500"
          title={`${overflow} more badge${overflow === 1 ? "" : "s"}`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default VendorTrustBadges;

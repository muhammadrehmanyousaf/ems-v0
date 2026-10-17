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
import { Crown, ShieldCheck, Award, Sparkles, Zap, Star, BadgeCheck, TrendingUp, Gem, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CHIP } from "@/components/ui/status-tones";

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
  // Brand palette only (WP30). Each badge keeps its own icon and a shade of its own:
  // gold = recognition (Top Vendor, Established), sage = verification and clean
  // record, mauve = volume, stone = speed. Text is >= 4.5:1 on its tint.
  top_vendor: {
    label: "Top Vendor",
    Icon: Crown,
    className:
      "border-bridal-gold/55 bg-bridal-gold/15 text-bridal-gold-dark",
    title: "Average rating 4.5+ from 5 or more reviews",
  },
  verified: {
    label: "Verified",
    Icon: BadgeCheck,
    className: STATUS_CHIP.success,
    title: "Email and phone verified",
  },
  tier3_verified: {
    label: "ID Verified",
    Icon: ShieldCheck,
    // Same family as Verified, one step stronger: a filled sage pill, white label.
    className: "border-status-success-solid bg-status-success-solid text-white",
    title: "CNIC verified by Wedding Wala",
  },
  established: {
    label: "Established",
    Icon: Award,
    className: "border-bridal-gold-dark/40 bg-bridal-sand text-bridal-gold-deep",
    title: "3+ years in business with 20+ weddings completed",
  },
  dispute_free: {
    label: "Dispute-free",
    Icon: Sparkles,
    className: "border-status-success-line bg-bridal-cream text-status-success",
    title: "5+ reviews with zero disputes filed",
  },
  high_volume: {
    label: "High volume",
    Icon: Star,
    className: STATUS_CHIP.info,
    title: "25 or more reviews",
  },
  quick_responder: {
    label: "Quick Responder",
    Icon: Zap,
    className: STATUS_CHIP.neutral,
    title: "Responds to inquiries within 1 hour",
  },
};

const TIER_META: Record<
  NonNullable<VendorTrustBadgesProps["tier"]>,
  { label: string; Icon: React.ElementType; className: string }
> = {
  newcomer: { label: "New", Icon: Sprout, className: STATUS_CHIP.neutral },
  // Tiers climb in strength: stone -> sage -> gold -> filled mauve, each with its own icon.
  rising: { label: "Rising", Icon: TrendingUp, className: "border-bridal-gold-dark/40 bg-bridal-sand text-bridal-gold-deep" },
  trusted: { label: "Trusted", Icon: BadgeCheck, className: STATUS_CHIP.success },
  premium: { label: "Premium", Icon: Gem, className: "border-bridal-gold/55 bg-bridal-cream text-bridal-gold-dark" },
  elite: { label: "Elite", Icon: Crown, className: "border-status-info-solid bg-status-info text-white" },
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
      // `role="group"`, not a bare div: aria-label is prohibited on a generic
      // element, and axe reports it once per card — nine times on /search.
      // group is what this is, and group takes a name.
      role="group"
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
          {React.createElement(TIER_META[tier].Icon, { className: "h-3 w-3", "aria-hidden": true })}
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
          >
            <Icon className="h-3 w-3" aria-hidden />
            {/* Named by its own content rather than by `aria-label`, which is
                prohibited on a generic span. In compact mode the label is
                hidden from sight but still read aloud, which is what the
                aria-label was there for. */}
            {compact ? <span className="sr-only">{meta.label}</span> : <span>{meta.label}</span>}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="inline-flex items-center rounded-full border border-status-neutral-line bg-status-neutral-soft px-2 py-0.5 text-[10px] font-medium text-status-neutral"
          title={`${overflow} more badge${overflow === 1 ? "" : "s"}`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default VendorTrustBadges;

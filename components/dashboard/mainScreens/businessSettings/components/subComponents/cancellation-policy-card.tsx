"use client";

/**
 * BK-100.5 — Vendor-selectable cancellation policy presets.
 *
 * Lets the vendor pick from four curated cancellation tiers
 * (platform_default / flexible / standard / strict). The structured
 * policy is stored on `Business.cancellationPolicyJson` and snapshotted
 * onto each new Booking at creation time (BK-034). In-flight bookings
 * carry their own frozen snapshot — changing the preset here NEVER
 * applies retroactively to confirmed bookings.
 *
 * The legacy free-text `cancelationPolicy` field on the basic-info form
 * is left untouched so admin tools and older code paths keep working.
 */

import * as React from "react";
import { Loader2, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BusinessesAPI,
  type CancellationPolicy,
  type CancellationPolicyPreset,
  type CancellationPresetKey,
} from "@/lib/api/dashboard";

interface CancellationPolicyCardProps {
  businessId: number;
  /** Optional explainer line above the card grid. */
  intro?: React.ReactNode;
}

// Visual + microcopy per preset. Keys must match the backend.
const PRESET_META: Record<
  CancellationPresetKey,
  {
    title: string;
    blurb: string;
    accentClass: string;
    recommended?: string;
  }
> = {
  platform_default: {
    title: "Always 100% refund",
    blurb:
      "Most customer-friendly. Anyone can cancel up to event day with a full refund. Use when you can reliably re-book a date.",
    accentClass: "border-emerald-300 bg-emerald-50/40",
    recommended: "Customers love it; risky for high-deposit dates",
  },
  flexible: {
    title: "Flexible",
    blurb:
      "Full refund 60+ days out, 50% in the 30–59 day window, no refund inside 30 days.",
    accentClass: "border-blue-300 bg-blue-50/40",
    recommended:
      "Best for: henna artists, makeup, photographers (easy to rebook).",
  },
  standard: {
    title: "Standard",
    blurb:
      "Full refund 90+ days out, 50% in the 60–89 day window, no refund inside 60 days.",
    accentClass: "border-amber-300 bg-amber-50/40",
    recommended: "Best for: caterers, mid-tier venues, decorators.",
  },
  strict: {
    title: "Strict",
    blurb:
      "50% refund 120+ days out (deposit non-refundable). Nothing inside 120 days.",
    accentClass: "border-rose-300 bg-rose-50/40",
    recommended:
      "Best for: premium banquets, marquee setups, dates that take months to fill.",
  },
};

function formatTierLine(t: CancellationPolicy["tiers"][number]): string {
  const dep = t.depositRefundable ? "deposit refundable" : "deposit non-refundable";
  if (t.minDaysBefore === 0) {
    return `Less than ${
      // Find next-higher minDaysBefore later — UI just shows "any time inside"
      ""
    }any time inside the window — ${t.refundPercent}% refund (${dep})`;
  }
  return `${t.minDaysBefore}+ days before event — ${t.refundPercent}% refund (${dep})`;
}

/** Render the tier ladder for a policy in human-readable form. */
function TierLadder({ policy }: { policy: CancellationPolicy }) {
  const sorted = [...policy.tiers].sort(
    (a, b) => b.minDaysBefore - a.minDaysBefore,
  );
  return (
    <ul className="space-y-1.5 text-xs text-neutral-600">
      {sorted.map((t, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className={cn(
              "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
              t.refundPercent >= 100
                ? "bg-emerald-100 text-emerald-700"
                : t.refundPercent >= 50
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700",
            )}
          >
            {t.refundPercent}
          </span>
          <span>{formatTierLine(t)}</span>
        </li>
      ))}
      {policy.vendorCancelOverridesToFull && (
        <li className="flex items-start gap-2 text-[11px] text-emerald-700 mt-1">
          <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0" />
          If you cancel the booking, customer always gets 100% back.
        </li>
      )}
      {policy.forceMajeureOverridesToFull && (
        <li className="flex items-start gap-2 text-[11px] text-emerald-700">
          <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0" />
          Force-majeure cancellations (mourning, government bans, weather) override to 100%.
        </li>
      )}
    </ul>
  );
}

export function CancellationPolicyCard({
  businessId,
  intro,
}: CancellationPolicyCardProps) {
  const [presets, setPresets] = React.useState<CancellationPolicyPreset[] | null>(null);
  const [currentKey, setCurrentKey] = React.useState<CancellationPresetKey | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingKey, setSavingKey] = React.useState<CancellationPresetKey | null>(null);
  // Whether the current policy doesn't match any known preset (legacy custom).
  const [isCustomLegacy, setIsCustomLegacy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await BusinessesAPI.getCancellationPolicy(businessId);
      setPresets(res.presets);
      setCurrentKey(res.currentPresetKey);
      // If the vendor has a non-null policy but no preset key match,
      // surface a small "custom" notice so they're not confused.
      setIsCustomLegacy(!!res.currentPolicy && !res.currentPresetKey);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Failed to load cancellation policy";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const choose = async (key: CancellationPresetKey) => {
    if (key === currentKey || savingKey) return;
    setSavingKey(key);
    try {
      await BusinessesAPI.setCancellationPolicy(businessId, key);
      setCurrentKey(key);
      setIsCustomLegacy(false);
      toast.success(`Cancellation policy set to ${PRESET_META[key].title}`, {
        description:
          "In-flight bookings keep their original policy. Only future bookings see this change.",
      });
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Failed to update cancellation policy";
      toast.error("Couldn't update policy", { description: msg });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-bridal-gold" />
              <h3 className="font-medium text-neutral-900">Cancellation policy</h3>
              {currentKey && (
                <Badge variant="secondary" className="text-[10px]">
                  Current: {PRESET_META[currentKey].title}
                </Badge>
              )}
              {isCustomLegacy && (
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                  Custom (legacy)
                </Badge>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Picks how much customers can refund on cancellation. Applies to future bookings only — in-flight bookings keep their own frozen policy.
            </p>
            {intro && <div className="mt-2 text-xs text-neutral-600">{intro}</div>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : !presets ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presets.map((p) => {
              const meta = PRESET_META[p.key];
              const active = p.key === currentKey;
              const saving = savingKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  disabled={!!savingKey}
                  onClick={() => choose(p.key)}
                  className={cn(
                    "relative text-left rounded-lg border-2 p-4 transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/50",
                    active
                      ? cn("ring-2 ring-bridal-gold/40", meta.accentClass)
                      : "border-neutral-200 bg-white hover:border-neutral-300",
                    !!savingKey && !active && "opacity-60",
                    saving && "opacity-90",
                  )}
                  aria-pressed={active}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-neutral-900">
                        {meta.title}
                      </span>
                      {active && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    {saving && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 mb-3">{meta.blurb}</p>
                  <TierLadder policy={p} />
                  {meta.recommended && (
                    <p className="text-[11px] text-neutral-500 mt-3 italic">
                      {meta.recommended}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!loading && !error && currentKey && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
            <span>
              <strong>Live-booking safety:</strong> changing your policy here applies to new bookings only. Any confirmed booking keeps the policy that was in force when it was made — no surprises for your customers.
            </span>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={load} disabled={!!savingKey}>
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CancellationPolicyCard;

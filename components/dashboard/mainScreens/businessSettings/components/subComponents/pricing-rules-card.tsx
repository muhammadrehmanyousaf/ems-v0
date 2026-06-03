"use client";

/**
 * Pricing-rules engine config — vendor sets a weekend premium and an
 * early-bird discount layered on top of seasonal surge. Stored on
 * Business.pricingRulesJson; applied to NEW bookings only and snapshotted
 * per BookingDetails, so past bookings stay grandfathered.
 *
 * The whole engine is gated server-side by env PRICING_RULES_ENGINE. When
 * the engine is off the card still lets the vendor pre-configure rules but
 * shows an honest "saved, not yet live" banner. The card itself only
 * mounts when NEXT_PUBLIC_PRICING_RULES === '1'.
 */

import * as React from "react";
import { Loader2, Sparkles, TrendingUp, CalendarClock, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  BusinessesAPI,
  type PricingRulesConfig,
} from "@/lib/api/dashboard";
// 03-DRAFT-RESILIENCE — persist in-progress edits to pricing rules so a
// refresh mid-thought (vendor tweaking percentages) doesn't blow them away.
import { useFormDraft } from "@/lib/draftStorage/useFormDraft";
import { DraftResumeBanner, relativeTimeAgo } from "@/components/shared/DraftResumeBanner";
import { AutoSaveIndicator } from "@/components/VendorStepForms/AutoSaveIndicator";

interface PricingRulesCardProps {
  businessId: number;
}

const EMPTY: PricingRulesConfig = {
  enabled: false,
  weekendPremium: { enabled: false, percent: 15, weekdayMask: 96 },
  earlyBird: { enabled: false, percent: 10, thresholdDays: 60 },
};

export function PricingRulesCard({ businessId }: PricingRulesCardProps) {
  const [cfg, setCfg] = React.useState<PricingRulesConfig>(EMPTY);
  const [engineEnabled, setEngineEnabled] = React.useState(false);
  const [bounds, setBounds] = React.useState({ premiumMaxPercent: 100, discountMaxPercent: 50 });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // 03-DRAFT-RESILIENCE — pristine snapshot captured after server load
  // so the hook can decide "did the vendor actually change anything?"
  const [pristineCfg, setPristineCfg] = React.useState<PricingRulesConfig | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await BusinessesAPI.getPricingRules(businessId);
      setEngineEnabled(res.engineEnabled);
      setBounds({
        premiumMaxPercent: res.bounds?.premiumMaxPercent ?? 100,
        discountMaxPercent: res.bounds?.discountMaxPercent ?? 50,
      });
      if (res.rules) {
        const loadedCfg: PricingRulesConfig = {
          enabled: !!res.rules.enabled,
          weekendPremium: {
            enabled: !!res.rules.weekendPremium?.enabled,
            percent: Number(res.rules.weekendPremium?.percent) || 0,
            weekdayMask: res.rules.weekendPremium?.weekdayMask ?? 96,
          },
          earlyBird: {
            enabled: !!res.rules.earlyBird?.enabled,
            percent: Number(res.rules.earlyBird?.percent) || 0,
            thresholdDays: Number(res.rules.earlyBird?.thresholdDays) || 0,
          },
        };
        setCfg(loadedCfg);
        setPristineCfg(loadedCfg);
      } else {
        // No saved rules — pristine is the EMPTY default.
        setPristineCfg(EMPTY);
      }
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message ||
          "Failed to load pricing rules",
      );
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    load();
  }, [load]);

  // 03-DRAFT-RESILIENCE — auto-save in-progress edits. Pristine comparison
  // gates meaningfulness so opening the card without changing anything
  // never writes a draft.
  const draft = useFormDraft<PricingRulesConfig>({
    storageKey: `pricing-rules-${businessId}`,
    state: cfg,
    pristineState: pristineCfg ?? undefined,
    enabled: !loading && pristineCfg !== null,
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await BusinessesAPI.setPricingRules(businessId, cfg);
      if (res?.rules) {
        setCfg(res.rules);
        setPristineCfg(res.rules);
      }
      // Server is now the truth — drop the local draft.
      draft.discard();
      toast.success("Pricing rules saved", {
        description: engineEnabled
          ? "Applies to new bookings only — existing bookings keep their price."
          : "Saved. They'll go live once the pricing engine is switched on.",
      });
    } catch (e) {
      toast.error("Couldn't save pricing rules", {
        description:
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message ||
          undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const setWk = (patch: Partial<PricingRulesConfig["weekendPremium"]>) =>
    setCfg((c) => ({ ...c, weekendPremium: { ...c.weekendPremium, ...patch } }));
  const setEb = (patch: Partial<PricingRulesConfig["earlyBird"]>) =>
    setCfg((c) => ({ ...c, earlyBird: { ...c.earlyBird, ...patch } }));

  return (
    <Card className="border-neutral-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-bridal-gold" />
          <h3 className="font-medium text-neutral-900">Pricing rules</h3>
          {cfg.enabled && (
            <Badge variant="secondary" className="text-[10px]">On</Badge>
          )}
          {!engineEnabled && (
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
              Engine off
            </Badge>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Automatic premiums and discounts on top of your seasonal surge.
          Applies to new bookings only — confirmed bookings keep their price.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 03-DRAFT-RESILIENCE — resume banner. Only fires when the
            stored draft differs from the server's pristine cfg (handled
            inside useFormDraft via pristineState). */}
        <DraftResumeBanner
          visible={draft.hasResumableDraft}
          title="Resume your pricing-rule edits"
          meta={draft.storedDraft ? `Last edited ${relativeTimeAgo(draft.storedDraft.updatedAt)}` : undefined}
          onResume={() => {
            if (!draft.storedDraft) return;
            setCfg(draft.storedDraft.state);
            draft.discard();
            toast.success("Restored your unsaved pricing rules");
          }}
          onDiscard={() => draft.discard()}
        />
        {/* Auto-save status */}
        <div className="flex justify-end -mt-2 -mb-2">
          <AutoSaveIndicator lastSavedAt={draft.lastSavedAt} saving={draft.saving} />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {!engineEnabled && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  The pricing engine is currently switched off platform-wide.
                  You can configure your rules now — they&apos;ll start applying
                  automatically once it&apos;s turned on.
                </span>
              </div>
            )}

            {/* Master toggle */}
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-800">Enable pricing rules</div>
                <div className="text-[11px] text-neutral-500">
                  Master switch for the rules below.
                </div>
              </div>
              <Switch
                checked={cfg.enabled}
                onCheckedChange={(v) => setCfg((c) => ({ ...c, enabled: v }))}
              />
            </div>

            {/* Weekend premium */}
            <div className={`rounded-md border p-3 space-y-3 ${!cfg.enabled ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium text-neutral-800">Weekend premium</span>
                </div>
                <Switch
                  checked={cfg.weekendPremium.enabled}
                  disabled={!cfg.enabled}
                  onCheckedChange={(v) => setWk({ enabled: v })}
                />
              </div>
              <p className="text-[11px] text-neutral-500">
                Add a percentage to events that fall on Saturday or Sunday — the
                days Pakistani weddings cluster on.
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-xs w-24">Premium %</Label>
                <Input
                  type="number"
                  min={0}
                  max={bounds.premiumMaxPercent}
                  className="h-9 w-28"
                  value={cfg.weekendPremium.percent}
                  disabled={!cfg.enabled || !cfg.weekendPremium.enabled}
                  onChange={(e) => setWk({ percent: Math.max(0, Math.min(bounds.premiumMaxPercent, Number(e.target.value) || 0)) })}
                />
                <span className="text-[11px] text-neutral-400">max {bounds.premiumMaxPercent}%</span>
              </div>
            </div>

            {/* Early-bird discount */}
            <div className={`rounded-md border p-3 space-y-3 ${!cfg.enabled ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-neutral-800">Early-bird discount</span>
                </div>
                <Switch
                  checked={cfg.earlyBird.enabled}
                  disabled={!cfg.enabled}
                  onCheckedChange={(v) => setEb({ enabled: v })}
                />
              </div>
              <p className="text-[11px] text-neutral-500">
                Reward customers who book well in advance — it locks in the date
                and smooths your calendar.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-24">Discount %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={bounds.discountMaxPercent}
                    className="h-9 w-28"
                    value={cfg.earlyBird.percent}
                    disabled={!cfg.enabled || !cfg.earlyBird.enabled}
                    onChange={(e) => setEb({ percent: Math.max(0, Math.min(bounds.discountMaxPercent, Number(e.target.value) || 0)) })}
                  />
                  <span className="text-[11px] text-neutral-400">max {bounds.discountMaxPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Book at least</Label>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    className="h-9 w-24"
                    value={cfg.earlyBird.thresholdDays}
                    disabled={!cfg.enabled || !cfg.earlyBird.enabled}
                    onChange={(e) => setEb({ thresholdDays: Math.max(0, Math.min(365, parseInt(e.target.value, 10) || 0)) })}
                  />
                  <span className="text-[11px] text-neutral-400">days ahead</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Live-booking safety:</strong> rules apply to new bookings
                only. Every booking locks in the exact rules that were active when
                it was made — no retroactive price changes.
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={load} disabled={saving}>
                Reset
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save rules
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PricingRulesCard;

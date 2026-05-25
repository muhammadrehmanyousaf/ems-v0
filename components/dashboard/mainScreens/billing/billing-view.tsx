"use client";

/**
 * Plan & billing (§17.1, D6). Shows the three tiers (Free "Khata Lite"
 * / Pro "Business" / Premium "Growth"), marks the vendor's current
 * tier, and lets them register an upgrade intent (no payment yet — D7;
 * our team follows up). Prices are indicative.
 *
 * Flag NEXT_PUBLIC_BILLING (default OFF).
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Loader2, Crown, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import {
  SubscriptionAPI,
  type MyPlanData,
  type PlanCatalogEntry,
  type SubscriptionTier,
} from "@/lib/api/subscription";

const TIER_ICON: Record<SubscriptionTier, React.ReactNode> = {
  free: <Sparkles className="h-4 w-4 text-neutral-500" />,
  pro: <Star className="h-4 w-4 text-blue-600" />,
  premium: <Crown className="h-4 w-4 text-bridal-gold-dark" />,
};
const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 };

const fmtPrice = (n: number) =>
  n === 0 ? "Free" : `Rs ${n.toLocaleString("en-PK")}/mo`;

export default function BillingView() {
  const [data, setData] = useState<MyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<SubscriptionTier | null>(null);

  const load = () => {
    setLoading(true);
    SubscriptionAPI.getMyPlan().then(setData).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const upgrade = async (tier: SubscriptionTier) => {
    setBusyTier(tier);
    try {
      await SubscriptionAPI.requestUpgrade(tier);
      toast.success("Upgrade requested — we'll review it and notify you when it's active");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not request upgrade");
    } finally {
      setBusyTier(null);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) {
    return (
      <Card><CardContent className="p-5 text-sm text-muted-foreground">Could not load plans.</CardContent></Card>
    );
  }

  const current = data.currentTier;

  return (
    <div className="space-y-4">
      {data.pendingUpgradeTier && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Upgrade to <strong>{data.pendingUpgradeTier}</strong> requested — we&apos;re reviewing it and will notify you the moment it&apos;s active.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {data.plans.map((p: PlanCatalogEntry) => {
          const isCurrent = p.tier === current;
          const isDowngrade = TIER_RANK[p.tier] < TIER_RANK[current];
          const isPending = data.pendingUpgradeTier === p.tier;
          return (
            <Card
              key={p.tier}
              className={`relative flex flex-col ${
                isCurrent
                  ? "border-bridal-gold-dark ring-1 ring-bridal-gold-dark/30"
                  : p.tier === "pro"
                    ? "border-blue-200"
                    : ""
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-bridal-gold-dark px-2 py-0.5 text-[10px] font-semibold text-white">
                  Your plan
                </span>
              )}
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  {TIER_ICON[p.tier]}
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.tagline}</p>
                  </div>
                </div>

                <p className="mt-3 text-2xl font-bold tabular-nums">
                  {fmtPrice(p.pricePkrMonthly)}
                  {p.pricePkrMonthly > 0 && (
                    <span className="text-[11px] font-normal text-muted-foreground"> indicative</span>
                  )}
                </p>

                <ul className="mt-3 space-y-1.5 flex-1">
                  {p.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                  {p.caps.map((c, i) => (
                    <li key={`c${i}`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <X className="h-3.5 w-3.5 text-neutral-400 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>Current plan</Button>
                  ) : isDowngrade ? (
                    <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                      Included below your plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={busyTier !== null || isPending}
                      onClick={() => upgrade(p.tier)}
                    >
                      {busyTier === p.tier && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                      {isPending ? "Requested" : `Upgrade to ${p.name}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        We never take a cut of your bookings — ever. Revenue is subscriptions + optional
        promotions only, so you can trust us with your real khata numbers. Prices shown are
        indicative and will be confirmed before any charge.
      </p>
    </div>
  );
}

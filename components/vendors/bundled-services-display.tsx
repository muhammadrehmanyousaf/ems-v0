"use client";

/**
 * BK-100.52 Layer 2 — Customer-facing bundled-services display.
 *
 * Renders the vendor's in-house bundled services (catering / decor /
 * DJ / valet / etc.) on the public vendor profile, plus their
 * outside-vendor policy callout. Vendors declare these in the Layer 1
 * admin tab; this component is what customers see.
 *
 * The component is self-contained — it fetches via the public-ish
 * `GET /api/v1/businesses/:id/bundled-services` endpoint (no auth
 * required, returns active rows only for non-owner callers). Renders
 * nothing if the vendor has no declared services AND no outside-vendor
 * policy set, so vendors who haven't adopted the feature see byte-
 * identical profile rendering.
 *
 * Booking-flow integration (customer picks which add-ons to opt into,
 * subtotal updates live, outside-vendor fee auto-applied) ships in a
 * follow-up commit alongside the interactive-quote primitive.
 */

import * as React from "react";
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Info,
  Loader2,
  Utensils,
  Palette,
  Music,
  Volume2,
  Camera,
  Video,
  Car,
  Zap,
  Flower2,
  Wand2,
  Sparkle,
  Radio,
  Cake,
  Tent,
  Sofa,
  Lightbulb,
  Package as PackageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BundledServicesAPI,
  BUNDLED_CATEGORY_LABELS,
  BUNDLED_PRICE_MODEL_LABELS,
  type BundledService,
  type BundledServiceCategory,
} from "@/lib/api/bundledServices";

const CATEGORY_ICON: Record<BundledServiceCategory, React.ElementType> = {
  catering: Utensils,
  decor: Palette,
  dj: Music,
  sound: Volume2,
  photography: Camera,
  videography: Video,
  valet: Car,
  generator: Zap,
  floral: Flower2,
  mehndi_artist: Wand2,
  makeup: Sparkle,
  henna: Wand2,
  live_streaming: Radio,
  cake: Cake,
  mithai: Cake,
  marquee: Tent,
  furniture: Sofa,
  lighting: Lightbulb,
  other: PackageIcon,
};

function formatPriceLabel(s: BundledService): string {
  const amt = typeof s.priceAmount === "string" ? parseFloat(s.priceAmount) : Number(s.priceAmount);
  if (s.priceModel === "free" || !amt || amt === 0) return "Included";
  if (s.priceModel === "per_plate") return `Rs. ${amt.toLocaleString()} / plate`;
  if (s.priceModel === "percentage_of_total") return `+${amt}% of total`;
  return `Rs. ${amt.toLocaleString()}`;
}

interface BundledServicesDisplayProps {
  businessId: number;
  /** Optional className for the wrapper */
  className?: string;
  /** When true, renders a self-contained "In-house services" heading.
      When false (default), the caller wraps the content in their own
      section header. Helpful when this component is dropped into a
      page that conditionally renders titles only when content exists. */
  withHeading?: boolean;
}

export function BundledServicesDisplay({
  businessId,
  className,
  withHeading = false,
}: BundledServicesDisplayProps) {
  const [services, setServices] = React.useState<BundledService[]>([]);
  const [outsideAllowed, setOutsideAllowed] = React.useState<boolean | null>(null);
  const [outsideFee, setOutsideFee] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    BundledServicesAPI.list(businessId, { includeInactive: false })
      .then((res) => {
        if (cancelled) return;
        setServices(res.services || []);
        setOutsideAllowed(
          typeof res.outsideVendorsAllowed === "boolean"
            ? res.outsideVendorsAllowed
            : null,
        );
        setOutsideFee(
          res.outsideVendorFee === null || res.outsideVendorFee === undefined
            ? null
            : Number(res.outsideVendorFee),
        );
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // Hide entirely when the vendor hasn't adopted the feature.
  const hasOutsidePolicy = outsideAllowed !== null;
  const hasContent = services.length > 0 || hasOutsidePolicy;

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-bridal-text-soft py-3",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading bundled services…
      </div>
    );
  }
  if (error || !hasContent) return null;

  // Sort: included first, then mandatory, then displayOrder, then id.
  const sorted = [...services].sort((a, b) => {
    if (a.included !== b.included) return a.included ? -1 : 1;
    if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1;
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.id - b.id;
  });

  return (
    <div className={cn("space-y-4", className)}>
      {withHeading && (
        <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.25em] font-medium text-bridal-text-label flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-bridal-gold" />
          In-house services
        </h4>
      )}
      {/* Outside-vendor policy callout */}
      {hasOutsidePolicy && (
        <div
          className={cn(
            "rounded-md border p-3 flex items-start gap-2.5",
            outsideAllowed
              ? "border-bridal-sage/45 bg-bridal-sage/10"
              : "border-amber-300 bg-amber-50",
          )}
        >
          {outsideAllowed ? (
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-bridal-sage" />
          ) : (
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
          )}
          <div className="text-sm min-w-0">
            {outsideAllowed ? (
              <>
                <p className="font-medium text-bridal-charcoal">
                  Outside vendors are welcome
                </p>
                <p className="text-xs text-bridal-text-soft mt-0.5 leading-relaxed">
                  {outsideFee && outsideFee > 0
                    ? `Bring your own caterer / decorator / DJ if you'd like. A Rs. ${outsideFee.toLocaleString()} ${
                        outsideFee >= 30000 ? "kitchen-use / external-vendor" : "outside-vendor"
                      } fee applies.`
                    : "Bring your own caterer / decorator / DJ at no extra fee."}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-900">
                  Outside vendors not permitted
                </p>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  This venue&apos;s in-house services must be used. See the list below for what&apos;s included.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bundled services list */}
      {sorted.length > 0 && (
        <div className="space-y-2.5">
          {sorted.map((s) => {
            const Icon = CATEGORY_ICON[s.category] || PackageIcon;
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 p-3.5 bg-bridal-ivory rounded-md border border-bridal-beige"
              >
                <div className="w-9 h-9 rounded-full bg-bridal-gold/15 inline-flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-bridal-gold-dark" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bridal text-[14px] font-medium text-bridal-charcoal">
                      {s.name}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      {BUNDLED_CATEGORY_LABELS[s.category] || s.category}
                    </Badge>
                    {s.included && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-bridal-sage/55 bg-bridal-sage/15 text-[#3F6B43]"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Included in price
                      </Badge>
                    )}
                    {s.mandatory && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-amber-400 bg-amber-50 text-amber-800"
                      >
                        Required
                      </Badge>
                    )}
                  </div>
                  {s.description && (
                    <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-1 leading-relaxed">
                      {s.description}
                    </p>
                  )}
                  <p className="font-bridal text-[11px] text-bridal-gold-dark mt-1.5">
                    {formatPriceLabel(s)} · {BUNDLED_PRICE_MODEL_LABELS[s.priceModel]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Layer 2c teaser */}
      <p className="flex items-start gap-1.5 text-[11px] text-bridal-text-soft italic leading-relaxed">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        Pick which add-ons you want during booking — coming soon. For now, message the vendor to confirm your selection.
      </p>
    </div>
  );
}

export default BundledServicesDisplay;

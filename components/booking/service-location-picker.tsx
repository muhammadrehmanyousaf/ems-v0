"use client";

/**
 * BK-100.53 — Service-location picker.
 *
 * Lets the customer specify where the service actually happens. Mounts
 * inside the booking flow (typically on the review step right before
 * payment) as a single self-contained card. Mode selection is optional
 * — leaving it blank yields the legacy "at vendor's address" behaviour
 * that every existing booking already implies.
 *
 * Closes Pakistani edge cases EC-78, EC-89, EC-217, EC-311-325:
 *   - Mehndi at customer's home (separate from venue Baraat)
 *   - Marquee setup on a plot the customer rented
 *   - Nikah at masjid (third-party address)
 *   - Multi-address weddings where each event has a different location
 *
 * Address is required for off-vendor modes; backend re-enforces the
 * minimum-5-character requirement with a clean 400.
 */

import * as React from "react";
import { Building2, Home, Tent, MapPinned, MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ServiceLocationMode =
  | "at_vendor"
  | "at_customer_home"
  | "at_customer_plot"
  | "at_third_party";

interface ServiceLocationPickerProps {
  mode?: ServiceLocationMode;
  address?: string;
  notes?: string;
  onChange: (next: {
    mode?: ServiceLocationMode;
    address?: string;
    notes?: string;
  }) => void;
  /** Optional vendor type — used to nudge which mode is most relevant.
      Marquee/Tent/Furniture rental → suggest at_customer_plot; Henna /
      Makeup → suggest at_customer_home; Nikahkhwan → at_third_party. */
  vendorType?: string;
  /** Hides the entire card. Useful when caller already knows the
      service is single-address at the vendor. */
  hidden?: boolean;
}

interface ModeMeta {
  key: ServiceLocationMode;
  title: string;
  blurb: string;
  Icon: React.ElementType;
  accentClass: string;
  example: string;
  needsAddress: boolean;
}

const MODES: ModeMeta[] = [
  {
    key: "at_vendor",
    title: "At the vendor's place",
    blurb: "We come to the vendor — their studio, hall, or address.",
    Icon: Building2,
    accentClass: "border-blue-300 bg-blue-50/30",
    example: "Banquet hall, makeup studio, photography studio",
    needsAddress: false,
  },
  {
    key: "at_customer_home",
    title: "At our home",
    blurb: "The vendor travels to our house — typical for mehndi, dholki, family-makeup days.",
    Icon: Home,
    accentClass: "border-emerald-300 bg-emerald-50/30",
    example: "Mehndi artist at bride's home, dholki photographer at home",
    needsAddress: true,
  },
  {
    key: "at_customer_plot",
    title: "At our plot / lawn",
    blurb: "Vendor brings a setup to a piece of land we've arranged — marquee tents, home-lawn decor.",
    Icon: Tent,
    accentClass: "border-amber-300 bg-amber-50/30",
    example: "Marquee company on family lawn, lawn decorator for outdoor walima",
    needsAddress: true,
  },
  {
    key: "at_third_party",
    title: "Different venue we picked",
    blurb: "Nikah at a masjid, ceremony at a farmhouse, or any other location we arranged.",
    Icon: MapPinned,
    accentClass: "border-purple-300 bg-purple-50/30",
    example: "Faisal Masjid Nikah, family farmhouse, public lawn",
    needsAddress: true,
  },
];

const ADDRESS_MIN = 5;
const ADDRESS_MAX = 1000;
const NOTES_MAX = 500;

export function ServiceLocationPicker({
  mode,
  address,
  notes,
  onChange,
  vendorType,
  hidden,
}: ServiceLocationPickerProps) {
  if (hidden) return null;

  const selected = MODES.find((m) => m.key === mode);
  const needsAddress = !!selected?.needsAddress;
  const addressTooShort =
    needsAddress && (typeof address !== "string" || address.trim().length < ADDRESS_MIN);

  // Vendor-type-aware nudge: surface the most likely mode at the top.
  const suggestedMode: ServiceLocationMode | null = (() => {
    const t = (vendorType || "").toLowerCase();
    if (
      t.includes("marquee") ||
      t.includes("tent") ||
      t.includes("furniture rental")
    )
      return "at_customer_plot";
    if (t.includes("henna") || t.includes("makeup") || t.includes("dhol"))
      return "at_customer_home";
    if (t.includes("nikahkhwan") || t.includes("officiant"))
      return "at_third_party";
    return null;
  })();

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5 text-bridal-gold" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-neutral-900">
            Where will the service happen?
          </p>
          <p className="text-xs text-neutral-500">
            Optional — leave blank if the service is at the vendor&apos;s usual address.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MODES.map((m) => {
          const active = m.key === mode;
          const suggested = suggestedMode === m.key && !mode;
          const { Icon } = m;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() =>
                onChange({
                  mode: active ? undefined : m.key,
                  address,
                  notes,
                })
              }
              className={cn(
                "relative text-left rounded-md border-2 p-3 transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/50",
                active
                  ? cn("ring-2 ring-bridal-gold/40", m.accentClass)
                  : "border-neutral-200 bg-white hover:border-neutral-300",
              )}
              aria-pressed={active}
            >
              {suggested && (
                <span className="absolute top-1.5 right-1.5 text-[9px] uppercase tracking-[0.15em] font-medium text-bridal-gold-dark">
                  Suggested
                </span>
              )}
              <div className="flex items-start gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    active ? "text-bridal-charcoal" : "text-neutral-500",
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{m.title}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{m.blurb}</p>
                  <p className="text-[10px] text-neutral-400 mt-1 italic">
                    e.g. {m.example}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {needsAddress && (
        <div className="space-y-2 pt-1 border-t border-neutral-100">
          <div className="space-y-1">
            <Label htmlFor="sl-address" className="text-xs">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sl-address"
              placeholder="e.g. House 42, Street 5, F-7/2 Islamabad"
              value={address || ""}
              maxLength={ADDRESS_MAX}
              onChange={(e) =>
                onChange({ mode, address: e.target.value.slice(0, ADDRESS_MAX), notes })
              }
              className="text-sm"
              aria-describedby="sl-address-help"
              aria-invalid={addressTooShort}
            />
            <p id="sl-address-help" className="text-[11px] text-neutral-500">
              Be specific enough for the vendor crew to find you — block, street, landmark.
            </p>
            {addressTooShort && (
              <p className="text-[11px] text-red-600">
                Please enter at least {ADDRESS_MIN} characters.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="sl-notes" className="text-xs">
              Landmark / parking / instructions{" "}
              <span className="text-neutral-400">(optional)</span>
            </Label>
            <Textarea
              id="sl-notes"
              placeholder='e.g. "Black gate, ring buzzer twice. Parking inside compound."'
              value={notes || ""}
              maxLength={NOTES_MAX}
              onChange={(e) =>
                onChange({ mode, address, notes: e.target.value.slice(0, NOTES_MAX) })
              }
              rows={2}
              className="text-sm resize-none"
            />
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Shared with the vendor crew once booking is confirmed.
              </span>
              <span className="tabular-nums">
                {(notes || "").length} / {NOTES_MAX}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceLocationPicker;

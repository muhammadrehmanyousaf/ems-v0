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
  /**
   * "card" (default) — today's self-contained card with its own heading, for
   * any caller that mounts the picker inline.
   * "sheet" — no outer card and no heading (the desk sheet / phone drawer
   * that hosts it carries both); the four modes become 64px rows, active =
   * cream fill + gold-dark border. Ids, aria-pressed, the >=5-char message
   * and the Suggested chip are the same in both frames.
   */
  frame?: "card" | "sheet";
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

/** Short mode names for a one-line summary ("At our home · House 42, F-7/2"). */
export const SERVICE_LOCATION_SHORT_LABELS: Record<ServiceLocationMode, string> = {
  at_vendor: "At the venue",
  at_customer_home: "At our home",
  at_customer_plot: "At our plot",
  at_third_party: "Different venue",
};

/** Whether a mode needs a customer-supplied address (same table the picker uses). */
export function serviceLocationNeedsAddress(mode?: ServiceLocationMode | null): boolean {
  return !!MODES.find((m) => m.key === mode)?.needsAddress;
}

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
  frame = "card",
}: ServiceLocationPickerProps) {
  if (hidden) return null;
  const sheet = frame === "sheet";

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
    <div className={sheet ? "space-y-4" : "rounded-lg border border-bridal-beige bg-white p-4 space-y-4"}>
      {!sheet && (
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-bridal-gold" />
          <div className="space-y-0.5">
            <p className="font-display italic text-[16px] text-bridal-charcoal">
              Where will the service happen?
            </p>
            <p className="font-bridal text-[12px] text-bridal-text-soft">
              Optional — leave blank if the service is at the vendor&apos;s usual address.
            </p>
          </div>
        </div>
      )}

      {/* One per row, not two.
        These sit in the options column beside the calendar, which is about
        490px — so two-up gave each card ~235px and every one wrapped to four
        lines: a heading, two lines of description, then the italic example over
        two more. Full width, each is a heading and one line, and the four read
        as a list you scan rather than a wall you decode. */}
      <div className="grid grid-cols-1 gap-2">
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
                "relative text-left transition-colors duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                sheet
                  ? cn(
                      // 64px row; cream + gold-dark when active, blush on hover.
                      "flex h-16 w-full items-center gap-3 rounded-[4px] border px-4 focus-visible:ring-bridal-gold-dark",
                      active
                        ? "border-bridal-gold-dark bg-bridal-cream"
                        : "border-bridal-beige bg-white hover:bg-bridal-blush/45",
                    )
                  : cn(
                      "rounded-lg border p-4 transition-all hover:-translate-y-px focus-visible:ring-bridal-gold/50",
                      active
                        ? cn("ring-2 ring-bridal-gold/40", m.accentClass)
                        : "border-bridal-beige bg-white hover:border-bridal-beige",
                    ),
              )}
              aria-pressed={active}
            >
              {suggested && (
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-[0.15em] font-medium text-bridal-gold-dark",
                    sheet ? "order-last shrink-0" : "absolute top-1.5 right-1.5",
                  )}
                >
                  Suggested
                </span>
              )}
              {sheet ? (
                <>
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-bridal-gold-dark" : "text-bridal-text-soft")}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bridal text-[14px] leading-5 text-bridal-charcoal">
                      {m.title}
                    </span>
                    <span className="block truncate font-bridal text-[12px] leading-4 text-bridal-text-soft">
                      {m.blurb}
                    </span>
                  </span>
                  {active && (
                    <span className="shrink-0 font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-gold-dark">
                      Selected
                    </span>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2">
                  <Icon
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      active ? "text-bridal-charcoal" : "text-bridal-text-soft",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-bridal-charcoal">{m.title}</p>
                    <p className="text-[11px] text-bridal-text-soft mt-0.5">{m.blurb}</p>
                    <p className="text-[10px] text-bridal-text-soft/75 mt-1 italic">
                      e.g. {m.example}
                    </p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {needsAddress && (
        <div className="space-y-2 pt-1 border-t border-bridal-beige/60">
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
              className={cn(
                "text-sm",
                sheet && "h-12 rounded-[4px] border-bridal-beige bg-white font-bridal focus-visible:ring-bridal-gold-dark",
              )}
              aria-describedby="sl-address-help"
              aria-invalid={addressTooShort}
            />
            <p id="sl-address-help" className="text-[11px] text-bridal-text-soft">
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
              <span className="text-bridal-text-soft/75">(optional)</span>
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
              className={cn(
                "text-sm resize-none",
                sheet && "rounded-[4px] border-bridal-beige bg-white font-bridal focus-visible:ring-bridal-gold-dark",
              )}
            />
            <div className="flex justify-between text-[11px] text-bridal-text-soft/75">
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

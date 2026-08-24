"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Info } from "lucide-react";
import { quoteEstimate, defaultHeadcount } from "@/lib/seo/quote-estimate";

/**
 * WW-TEST-CASES 2.24 — the sticky quote bar (§4.4).
 *
 * ── What a listing could and could not tell you ───────────────────────────
 *
 * The page showed "From PKR 450,000". A Pakistani wedding is priced per head
 * on top of that, so the headline is not a price — it is the beginning of an
 * arithmetic problem the couple has to finish themselves, on a phone, having
 * scrolled past the packages, the menus and the minimum guarantee to find the
 * three numbers they need.
 *
 * This asks the one question that turns those numbers into an answer — how many
 * guests — and does the multiplication in front of them. It follows the page,
 * so the figure is there when they reach the photographs, the menus, or the
 * reviews and start wondering again.
 *
 * ── Why it is an ESTIMATE, and says so ────────────────────────────────────
 *
 * It reduces the venue to its cheapest real combination, which is the answer a
 * couple can act on. It is not a quote and does not pretend to be: the
 * assumptions are on screen, the guest count is part of the claim rather than a
 * footnote, and a venue that cannot be reduced (quote-only, or nothing
 * published) says so instead of showing a number derived from nothing.
 *
 * `quoteEstimate` mirrors the server's `perHeadEquivalent`, and
 * `scripts/quote-estimate-parity.mts` fails if the two ever disagree — a bar
 * that drifts would show one figure here and charge another at checkout.
 */

const pkr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export function StickyQuoteBar({
  raw,
  vendorId,
  ctaLabel = "Check availability",
}: {
  raw: any;
  vendorId: number | string;
  ctaLabel?: string;
}) {
  const [guests, setGuests] = useState<number>(() => defaultHeadcount(raw));
  const [open, setOpen] = useState(false);

  const est = useMemo(
    () =>
      quoteEstimate({
        business: raw,
        packages: Array.isArray(raw?.packages) ? raw.packages : [],
        menus: Array.isArray(raw?.menus) ? raw.menus : [],
        guestCount: guests,
      }),
    [raw, guests],
  );

  // A venue we cannot reduce gets no bar at all. A sticky strip saying "no
  // price" would follow the couple down the page repeating something the hero
  // already told them once.
  if (!est.comparable) return null;

  const cap = Number(raw?.maxCapacity) || 5000;
  const clamp = (n: number) => Math.max(1, Math.min(cap, n));

  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-10 border-t border-bridal-beige bg-bridal-ivory/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3">
        {/* The question that turns three numbers into an answer. */}
        <label className="flex items-center gap-2" htmlFor="ww-quote-guests">
          <Users className="h-4 w-4 shrink-0 text-bridal-gold" aria-hidden />
          <span className="font-bridal text-[11px] uppercase tracking-[0.14em] text-bridal-text-soft">
            Guests
          </span>
          <input
            id="ww-quote-guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={cap}
            value={guests}
            onChange={(e) => setGuests(clamp(parseInt(e.target.value, 10) || 1))}
            className="h-9 w-20 rounded-[4px] border border-bridal-beige bg-white px-2 text-center font-bridal text-[14px] tabular-nums text-bridal-charcoal outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold"
          />
        </label>

        <div className="min-w-0 flex-1">
          <p className="font-bridal text-[15px] leading-tight text-bridal-charcoal tabular-nums">
            <strong>{pkr(est.total!)}</strong>{" "}
            <span className="text-bridal-text-soft">
              · about {pkr(est.perHead!)} per head
            </span>
          </p>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-0.5 inline-flex items-center gap-1 font-bridal text-[11.5px] text-bridal-text-soft underline-offset-2 hover:underline"
            aria-expanded={open}
          >
            <Info className="h-3 w-3" aria-hidden />
            Estimate — what&apos;s in this?
          </button>
        </div>

        <Link
          href={`/${vendorId}/booking`}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-bridal-gold px-5 font-bridal text-[13px] font-medium text-white transition-colors hover:bg-bridal-gold-dark"
        >
          {ctaLabel}
        </Link>
      </div>

      {/*
        The assumptions, in full, one click away. A number a couple cannot
        interrogate is a number they will not trust — and the ones that move it
        most (the cheapest combination, a minimum guarantee, a food floor) are
        exactly the ones a listing usually hides.
      */}
      {open && (
        <div className="mx-auto mt-3 max-w-5xl border-t border-bridal-beige pt-3">
          <ul className="space-y-1">
            {est.assumptions.map((a, i) => (
              <li key={i} className="font-bridal text-[12px] leading-snug text-bridal-text-soft">
                · {a}
              </li>
            ))}
            <li className="font-bridal text-[12px] leading-snug text-bridal-text-soft">
              · Extras, taxes and any security deposit are not included.
            </li>
          </ul>
          <p className="mt-2 font-bridal text-[12px] leading-snug text-bridal-text-soft">
            This is an estimate at {est.guestCount} guests, not a quote. Your final price comes from
            what you actually choose.
          </p>
        </div>
      )}
    </div>
  );
}

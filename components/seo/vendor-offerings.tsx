"use client";

/**
 * WW-OFFERINGS — how a venue's packages and menus look to a couple.
 *
 * Before this, the public detail page rendered a package as a name and a bare
 * number, and menus not at all. Two things were wrong with that:
 *
 *  1. A price with no unit is not a price. "PKR 1,320,000" and "PKR 2,500" were
 *     rendered identically, so a per-head rate read as the whole wedding and a
 *     per-event rate read as the price of one plate. `pricingUnit` has existed
 *     on the row since WW-PKG-UNIT; nothing public ever read it.
 *  2. Menus never appeared. A venue selling Rs 3,900-per-head food showed a
 *     couple no dishes at all, so the one thing shaadi guests actually remember
 *     was invisible until deep inside the booking flow.
 *
 * This renders EVERYTHING the row carries — images, guest band, min guarantee,
 * service style, the bundled menu, add-on extras with their prices, per-look
 * pricing, live counters, per-head supplements — because a couple comparing
 * three marquees is doing it on exactly these details, and anything omitted
 * here is a question the venue has to answer again on WhatsApp.
 *
 * The layout is deliberately pamphlet-shaped: the printed card a marquee hands
 * across the desk is the artefact couples already compare.
 *
 * Server component: pure render off already-fetched data, no hooks, no client JS.
 */
import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { venueSpacesApi } from "@/lib/api/venueSpaces";
import {
  packageIsPerHead,
  packagePriceBasisLabel,
  packageIncludesFood,
  serviceStyleLabel,
} from "@/lib/pricing/package";
import {
  checkOneDish,
  COUNTS_AS_LABELS,
  type CountsAs,
  type MenuDish,
} from "@/lib/compliance/one-dish";
import { oneDishAppliesInCity, type RuleApplies } from "@/lib/compliance/jurisdiction";

const pkr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Packages store features as a flat list or as {group: [items]}. Accept both. */
function featureList(features: unknown): string[] {
  if (Array.isArray(features)) return features.map(String).filter(Boolean);
  if (features && typeof features === "object") {
    return Object.values(features as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v.map(String) : [String(v)]))
      .filter(Boolean);
  }
  return [];
}

function imageList(images: unknown): string[] {
  const out: string[] = [];
  if (Array.isArray(images)) {
    for (const i of images) {
      if (typeof i === "string" && i.trim()) out.push(i);
      else if (i && typeof i === "object" && typeof (i as any).url === "string") out.push((i as any).url);
    }
  } else if (typeof images === "string" && images.trim()) {
    out.push(images);
  }
  return out;
}

/** `Package.extras` — BK-075 add-ons, `{ code, label, price }`. */
function extraList(extras: unknown): { label: string; price: number }[] {
  if (!Array.isArray(extras)) return [];
  return extras
    .map((e: any) => ({ label: String(e?.label ?? e?.code ?? "").trim(), price: num(e?.price) }))
    .filter((e) => e.label);
}

/** `Package.looksJson` — WW-252 per-look pricing, `{ key, label, price, description? }`. */
function lookList(looks: unknown): { label: string; price: number; description?: string }[] {
  if (!Array.isArray(looks)) return [];
  return looks
    .map((l: any) => ({
      label: String(l?.label ?? l?.key ?? "").trim(),
      price: num(l?.price),
      description: l?.description ? String(l.description) : undefined,
    }))
    .filter((l) => l.label);
}

/** Menu sections in the order a Pakistani menu card is actually printed. */
const SECTION_ORDER: CountsAs[] = ["salan", "rice", "bread", "salad", "sweet", "drink", "other"];

function Badge({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "gold" }) {
  const cls =
    tone === "gold"
      ? "border-bridal-gold/45 bg-bridal-cream text-bridal-charcoal"
      : "border-bridal-beige bg-bridal-ivory text-bridal-text-soft";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-[3px] font-bridal text-[11px] leading-none ${cls}`}>
      {children}
    </span>
  );
}

function Rule({ label }: { label: string }) {
  return (
    <p className="mt-3 font-bridal text-[10.5px] uppercase tracking-[0.18em] text-bridal-gold-dark">
      {label}
    </p>
  );
}

/* ── Package pamphlet ──────────────────────────────────────────────────── */

function PackageCard({ pkg, menusById }: { pkg: any; menusById: Map<number, any> }) {
  const price = num(pkg?.price);
  const perHead = packageIsPerHead(pkg);
  const basis = packagePriceBasisLabel(pkg);
  const includesFood = packageIncludesFood(pkg);
  const style = serviceStyleLabel(pkg?.serviceStyle);
  const minGuar = num(pkg?.minGuaranteeCount);
  const cap = num(pkg?.capacity);
  const gMin = num(pkg?.guestRangeMin);
  const gMax = num(pkg?.guestRangeMax);
  const feats = featureList(pkg?.features);
  const imgs = imageList(pkg?.images);
  const extras = extraList(pkg?.extras);
  const looks = lookList(pkg?.looksJson);
  const bundledMenu = pkg?.menuId != null ? menusById.get(Number(pkg.menuId)) : null;

  // A per-head headline means nothing without a worked example — this is the
  // number the couple is trying to compute in their head anyway.
  const example = perHead && price > 0 ? Math.max(minGuar || 0, gMin || 0, 300) : 0;

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-bridal-beige bg-bridal-ivory">
      {imgs.length > 0 && (
        <div className="relative h-44 w-full bg-bridal-cream">
          <Image
            src={imgs[0]}
            alt={`${pkg?.name ?? "Package"} — ${basis}`}
            fill
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-cover"
          />
          {imgs.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-bridal-charcoal/75 px-2 py-0.5 font-bridal text-[11px] text-bridal-ivory">
              +{imgs.length - 1} photo{imgs.length - 1 === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="font-display italic text-[19px] leading-tight text-bridal-charcoal">
            {pkg?.name}
          </p>
          {pkg?.description && (
            <p className="mt-1 font-bridal text-[13px] leading-snug text-bridal-text-soft">
              {pkg.description}
            </p>
          )}
        </div>

        {price > 0 && (
          <div>
            <p className="font-display text-[26px] leading-none text-bridal-charcoal tabular-nums">
              {pkr(price)}
              <span className="ml-1.5 font-bridal text-[13px] italic text-bridal-gold-dark">
                {basis}
              </span>
            </p>
            {example > 0 && (
              <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft tabular-nums">
                {example.toLocaleString("en-PK")} guests = {pkr(price * example)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {includesFood
            ? <Badge tone="gold">Food included</Badge>
            : <Badge>Food charged separately</Badge>}
          {style && <Badge>{style}</Badge>}
          {/* The guest BAND this package is sold for is not the same as the
              hall's capacity, and a couple of 200 needs to know a package is
              written for 400+ before they fall in love with it. */}
          {(gMin > 0 || gMax > 0) && (
            <Badge>
              Best for {gMin > 0 ? gMin.toLocaleString("en-PK") : "any"}
              {gMax > 0 ? `–${gMax.toLocaleString("en-PK")}` : "+"} guests
            </Badge>
          )}
          {minGuar > 0 && <Badge>Billed for at least {minGuar.toLocaleString("en-PK")}</Badge>}
          {cap > 0 && <Badge>Up to {cap.toLocaleString("en-PK")} guests</Badge>}
        </div>

        {bundledMenu && (
          <p className="font-bridal text-[12.5px] text-bridal-charcoal">
            Menu included:{" "}
            <span className="italic">{bundledMenu.title}</span>
            {num(bundledMenu.price) > 0 && (
              <span className="text-bridal-text-soft"> ({pkr(num(bundledMenu.price))} per head value)</span>
            )}
          </p>
        )}

        {feats.length > 0 && (
          <ul className="space-y-1.5">
            {feats.map((f, i) => (
              <li key={i} className="flex items-start gap-2 font-bridal text-[13px] leading-snug text-bridal-charcoal">
                <span aria-hidden className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-bridal-gold" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Per-look pricing (WW-252) — a salon or photographer prices by look,
            not by event, and hiding that makes the headline price a lie. */}
        {looks.length > 0 && (
          <div>
            <Rule label="Priced per look" />
            <ul className="mt-1 space-y-1">
              {looks.map((l, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 font-bridal text-[13px] text-bridal-charcoal">
                  <span>
                    {l.label}
                    {l.description && (
                      <span className="ml-1 text-[12px] text-bridal-text-soft">{l.description}</span>
                    )}
                  </span>
                  <span className="tabular-nums whitespace-nowrap">{pkr(l.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* BK-075 add-ons. Shown with prices because "generator available" and
            "generator, Rs 45,000" are different answers. */}
        {extras.length > 0 && (
          <div>
            <Rule label="Add-ons, charged separately" />
            <ul className="mt-1 space-y-1">
              {extras.map((e, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 font-bridal text-[13px] text-bridal-charcoal">
                  <span>{e.label}</span>
                  <span className="tabular-nums whitespace-nowrap">
                    {e.price > 0 ? `+ ${pkr(e.price)}` : "On request"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}

/* ── Menu pamphlet ─────────────────────────────────────────────────────── */

function MenuCard({ menu, ruleApplies }: { menu: any; ruleApplies: RuleApplies }) {
  const price = num(menu?.price);
  const perHead = String(menu?.pricingUnit || "").toLowerCase() === "per_head";
  const verdict = checkOneDish(menu?.data, { ruleApplies });
  const minGuar = num(menu?.minGuaranteeCount);

  const dishCount = verdict.items.length;

  /**
   * A legacy flat menu — `{ items: ["Chicken Karahi", …] }`, which is what every
   * menu on production still is — carries no classification, so every dish
   * falls to `other`. `other`'s label is "Snack / live counter (not counted)",
   * which meant a venue's Platinum menu (Mutton Raan, Fish Fry, Beef Nihari)
   * rendered to couples under a heading calling it snacks.
   *
   * `checkOneDish` is deliberately honest that it does not know; the display has
   * to be equally honest, and "we can't tell what course this is" is not the
   * same statement as "this is a snack". So an entirely-unclassified menu is
   * listed plainly, with no course headings at all — which is exactly how the
   * venue printed it.
   */
  const allUnclassified =
    dishCount > 0 && verdict.items.every((d: MenuDish) => d.inferred && d.countsAs === "other");

  const grouped = allUnclassified
    ? []
    : SECTION_ORDER
        .map((k) => ({
          key: k,
          // Only call something a snack / live counter when the vendor SAID so.
          dishes: verdict.items.filter(
            (d: MenuDish) => d.countsAs === k && !(k === "other" && d.inferred),
          ),
        }))
        .filter((g) => g.dishes.length > 0);

  // Dishes we could not place, on a menu where some others were classified.
  const unplaced = allUnclassified
    ? verdict.items
    : verdict.items.filter((d: MenuDish) => d.countsAs === "other" && d.inferred);

  return (
    <li className="flex flex-col rounded-lg border border-bridal-beige bg-bridal-ivory p-5">
      <div className="border-b border-dashed border-bridal-beige pb-3 text-center">
        <p className="font-display italic text-[19px] leading-tight text-bridal-charcoal">
          {menu?.title}
        </p>
        {price > 0 && (
          <p className="mt-1 font-display text-[23px] leading-none text-bridal-charcoal tabular-nums">
            {pkr(price)}
            <span className="ml-1.5 font-bridal text-[13px] italic text-bridal-gold-dark">
              {perHead ? "per head" : "per event"}
            </span>
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-bridal text-[11.5px] text-bridal-text-soft">
          {dishCount > 0 && <span>{dishCount} dish{dishCount === 1 ? "" : "es"}</span>}
          {minGuar > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>Billed for at least {minGuar.toLocaleString("en-PK")} guests</span>
            </>
          )}
          {perHead && price > 0 && minGuar > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">from {pkr(price * minGuar)}</span>
            </>
          )}
        </div>
      </div>

      {grouped.length > 0 || unplaced.length > 0 ? (
        <div className="mt-3 space-y-3">
          {grouped.map((g) => (
            <div key={g.key}>
              <p className="font-bridal text-[10.5px] uppercase tracking-[0.18em] text-bridal-gold-dark">
                {COUNTS_AS_LABELS[g.key]}
              </p>
              <ul className="mt-1 space-y-0.5">
                {g.dishes.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-2 font-bridal text-[13px] leading-snug text-bridal-charcoal"
                  >
                    <span>
                      {d.name}
                      {/* A live counter is the thing families ask about by name,
                          and it does not count toward the one-dish limit. */}
                      {d.isLive && (
                        <span className="ml-1.5 rounded-full border border-bridal-gold/45 px-1.5 py-[1px] font-bridal text-[10px] text-bridal-gold-dark">
                          live counter
                        </span>
                      )}
                    </span>
                    {num(d.supplementPerHead) > 0 && (
                      <span className="shrink-0 tabular-nums text-[12px] text-bridal-text-soft">
                        + {pkr(num(d.supplementPerHead))}/head
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Dishes with no course we can vouch for — listed as printed, under
              no heading, rather than under a label that would misdescribe them. */}
          {unplaced.length > 0 && (
            <ul className="space-y-0.5">
              {unplaced.map((d, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-2 font-bridal text-[13px] leading-snug text-bridal-charcoal"
                >
                  <span>
                    {d.name}
                    {d.isLive && (
                      <span className="ml-1.5 rounded-full border border-bridal-gold/45 px-1.5 py-[1px] font-bridal text-[10px] text-bridal-gold-dark">
                        live counter
                      </span>
                    )}
                  </span>
                  {num(d.supplementPerHead) > 0 && (
                    <span className="shrink-0 tabular-nums text-[12px] text-bridal-text-soft">
                      + {pkr(num(d.supplementPerHead))}/head
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-3 font-bridal text-[13px] text-bridal-text-soft">Dishes on request.</p>
      )}

      {/* The one-dish law binds the venue and the caterer, not only the host
          (Punjab Marriage Functions Act 2016 s.5) — so a couple comparing menus
          deserves to see which can be served as printed. `unknown` never renders
          as reassurance: an unclassified menu says nothing at all. */}
      {verdict.status === "violation" && (
        <p className="mt-3 rounded border border-amber-300 bg-amber-50/60 px-2.5 py-2 font-bridal text-[11.5px] leading-snug text-amber-900">
          Where the one-dish rule applies, this menu is served in a reduced form —
          confirm the final list with the venue.
        </p>
      )}
    </li>
  );
}

/* ── Section ───────────────────────────────────────────────────────────── */

export function VendorOfferings({ packages, menus, city, businessId }: { packages: any[]; menus: any[]; city?: string | null; businessId?: number | null }) {
  /**
   * Which hall the couple is reading about.
   *
   * Packages and menus each record the space they belong to (`subVenueId`,
   * NULL = venue-wide). This pamphlet showed the lot regardless, so someone
   * reading about the 120-seat Terrace Lawn saw the Main Hall's 500-guest
   * walima package and the Main Hall kitchen's menu — neither of which the
   * venue can deliver in the room being described.
   *
   * null = the whole venue, and that is its own answer rather than "no
   * filter": it shows the venue-wide offerings the vendor set up for the
   * property, not every hall's private list. Identical rule to package-step
   * and menu-selection-step, so the pamphlet and the booking wizard can never
   * advertise different things.
   */
  const [spaceFilter, setSpaceFilter] = React.useState<number | null>(null);
  const { data: spaceTree } = useQuery({
    queryKey: ["venue-spaces-flat", businessId],
    queryFn: () => venueSpacesApi.publicTree(Number(businessId)),
    enabled: !!businessId,
    staleTime: 60_000,
  });
  const venueSpaces = React.useMemo(() => {
    const flat: { id: number; name: string }[] = [];
    const walk = (ns: any[]) =>
      (ns || []).forEach((n: any) => {
        if (n?.id && n?.name) flat.push({ id: n.id, name: n.name });
        if (n?.children) walk(n.children);
      });
    walk((spaceTree as any)?.tree || []);
    return flat;
  }, [spaceTree]);
  /**
   * One rule for both lists. If narrowing would leave NOTHING, the full list
   * stands — an empty offerings panel reads as "this venue sells nothing" and
   * would cost the vendor the enquiry.
   */
  const inSpace = (rows: any[]): any[] => {
    const scoped = rows.filter(
      (r) => r?.subVenueId == null || (spaceFilter != null && Number(r.subVenueId) === spaceFilter),
    );
    return scoped.length > 0 ? scoped : rows;
  };
  /**
   * WW-JURISDICTION — the one-dish rule is s.5 of the PUNJAB Act, and this
   * pamphlet judged every venue in Pakistan against it. A Karachi marquee got a
   * "served in a reduced form" notice for a law that does not reach Sindh,
   * which is a warning against the venue for no reason.
   */
  const ruleApplies = oneDishAppliesInCity(city);
  const pkgs = Array.isArray(packages) ? packages : [];
  const mns = Array.isArray(menus) ? menus : [];
  if (pkgs.length === 0 && mns.length === 0) return null;

  const menusById = new Map<number, any>(
    mns.filter((m) => m?.id != null).map((m) => [Number(m.id), m]),
  );

  // When every package already covers catering, a separate menu section reads
  // as a second bill. Say once, plainly, that it is the same food.
  const allInclusive = pkgs.length > 0 && pkgs.every((p) => packageIncludesFood(p));

  return (
    <>
      {/* Which hall am I reading about?
          Only shown when the venue actually models more than one space — a
          single-hall vendor is not asked a question with one answer. */}
      {venueSpaces.length > 1 && (
        <div className="mb-6 space-y-2">
          <p className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-text-label">
            Showing prices for
          </p>
          <div className="flex flex-wrap gap-2">
            {[{ id: null as number | null, name: "Whole venue" }, ...venueSpaces].map((sp) => {
              const on = spaceFilter === sp.id;
              return (
                <button
                  key={String(sp.id ?? "all")}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSpaceFilter(sp.id)}
                  className={`rounded-full border px-3 py-1.5 font-bridal text-[12px] transition-colors ${
                    on
                      ? "border-bridal-gold bg-bridal-blush text-bridal-charcoal"
                      : "border-bridal-beige bg-bridal-cream text-bridal-text-soft hover:border-bridal-gold/55"
                  }`}
                >
                  {sp.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {pkgs.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">Packages</h2>
          <ul className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
            {pkgs.map((p: any) => (
              <PackageCard key={p?.id ?? p?.name} pkg={p} menusById={menusById} />
            ))}
          </ul>
        </section>
      )}

      {mns.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-1">Menus</h2>
          <p className="mb-5 font-bridal text-[13px] text-bridal-text-soft">
            {allInclusive
              ? "Included in the packages above — choose your dishes when you book."
              : "Per-head catering, charged on your final guest count."}
          </p>
          <ul className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mns.map((m: any) => (
              <MenuCard key={m?.id ?? m?.title} menu={m} ruleApplies={ruleApplies} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default VendorOfferings;

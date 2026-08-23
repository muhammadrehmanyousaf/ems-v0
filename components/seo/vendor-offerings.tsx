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
 * The layout is deliberately pamphlet-shaped — the printed card a marquee hands
 * across the desk — because that is the artefact couples already compare, and
 * every venue owner asked for their packages and menus to "look like the card".
 *
 * Server component: pure render off already-fetched data, no hooks, no client JS.
 */
import Image from "next/image";
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

const pkr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

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

function firstImage(images: unknown): string | null {
  if (Array.isArray(images) && images.length) {
    const i = images[0];
    return typeof i === "string" ? i : (i as any)?.url ?? null;
  }
  if (typeof images === "string" && images.trim()) return images;
  return null;
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

/* ── Package pamphlet ──────────────────────────────────────────────────── */

function PackageCard({ pkg }: { pkg: any }) {
  const price = Number(pkg?.price) || 0;
  const perHead = packageIsPerHead(pkg);
  const basis = packagePriceBasisLabel(pkg);
  const includesFood = packageIncludesFood(pkg);
  const style = serviceStyleLabel(pkg?.serviceStyle);
  const minGuar = Number(pkg?.minGuaranteeCount) || 0;
  const cap = Number(pkg?.capacity) || 0;
  const feats = featureList(pkg?.features);
  const img = firstImage(pkg?.images);

  // A per-head headline means nothing without a worked example — this is the
  // number the couple is actually trying to compute in their head.
  const example = perHead && price > 0 ? Math.max(minGuar || 0, 300) : 0;

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-bridal-beige bg-bridal-ivory">
      {img && (
        <div className="relative h-40 w-full bg-bridal-cream">
          <Image
            src={img}
            alt={`${pkg?.name ?? "Package"} — ${basis}`}
            fill
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-cover"
          />
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
          {minGuar > 0 && <Badge>Billed for at least {minGuar.toLocaleString("en-PK")}</Badge>}
          {cap > 0 && <Badge>Up to {cap.toLocaleString("en-PK")} guests</Badge>}
        </div>

        {feats.length > 0 && (
          <ul className="mt-1 space-y-1.5">
            {feats.map((f, i) => (
              <li key={i} className="flex items-start gap-2 font-bridal text-[13px] leading-snug text-bridal-charcoal">
                <span aria-hidden className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-bridal-gold" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/* ── Menu pamphlet ─────────────────────────────────────────────────────── */

function MenuCard({ menu }: { menu: any }) {
  const price = Number(menu?.price) || 0;
  const perHead = String(menu?.pricingUnit || "").toLowerCase() === "per_head";
  const verdict = checkOneDish(menu?.data);
  const minGuar = Number(menu?.minGuaranteeCount) || 0;

  const grouped = SECTION_ORDER
    .map((k) => ({ key: k, dishes: verdict.items.filter((d: MenuDish) => d.countsAs === k) }))
    .filter((g) => g.dishes.length > 0);

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
        {minGuar > 0 && (
          <p className="mt-1.5 font-bridal text-[11.5px] text-bridal-text-soft">
            Billed for at least {minGuar.toLocaleString("en-PK")} guests
          </p>
        )}
      </div>

      {grouped.length > 0 ? (
        <div className="mt-3 space-y-3">
          {grouped.map((g) => (
            <div key={g.key}>
              <p className="font-bridal text-[10.5px] uppercase tracking-[0.18em] text-bridal-gold-dark">
                {COUNTS_AS_LABELS[g.key]}
              </p>
              <ul className="mt-1 space-y-0.5">
                {g.dishes.map((d, i) => (
                  <li key={i} className="font-bridal text-[13px] leading-snug text-bridal-charcoal">
                    {d.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 font-bridal text-[13px] text-bridal-text-soft">
          Dishes on request.
        </p>
      )}

      {/* The one-dish law binds the venue and the caterer, not only the host
          (Punjab Marriage Functions Act 2016 s.5) — so a couple comparing menus
          deserves to see which ones can be served as printed. `unknown` never
          renders as reassurance: an unclassified menu says nothing at all. */}
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

export function VendorOfferings({ packages, menus }: { packages: any[]; menus: any[] }) {
  const pkgs = Array.isArray(packages) ? packages : [];
  const mns = Array.isArray(menus) ? menus : [];
  if (pkgs.length === 0 && mns.length === 0) return null;

  // When every package already covers catering, a separate menu section reads
  // as a second bill. Say once, plainly, that it is the same food.
  const allInclusive = pkgs.length > 0 && pkgs.every((p) => packageIncludesFood(p));

  return (
    <>
      {pkgs.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">Packages</h2>
          <ul className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
            {pkgs.map((p: any) => (
              <PackageCard key={p?.id ?? p?.name} pkg={p} />
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
              <MenuCard key={m?.id ?? m?.title} menu={m} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default VendorOfferings;

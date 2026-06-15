# 04 — Programmatic SEO Architecture at Scale

*Purpose: define how weddingwala.pk expands its existing Next.js page-generation engine from ~hundreds of indexable URLs to several thousand — additively, flag-gated, zero-downtime — to architect toward the aggressive 1M visits/mo ceiling without triggering Google's thin-programmatic demotion.*

> Read alongside `SEO-MASTER-PLAN.md` (this extends §4–6, not duplicates) and siblings `03-content-engine.md` (content), this file `04-programmatic-architecture.md` §5 (internal-linking), and `06-technical-geo.md` (indexation). **Honesty:** 1M/mo is a stretch ceiling. The page matrix below is the *capacity* to capture it; the *commercial* subset (bookings) is a small fraction of that volume — most programmatic traffic is low-conversion discovery. Build for the leads, count the visits.

---

## 1. The matrix math: where pages come from

The site already runs three programmatic surfaces, all driven by typed config in `lib/seo/constants.ts` (`CITIES`) and `lib/vendor-types.ts` (`VENDOR_TYPES` / `VENDOR_TYPE_PATHS`):

| Surface | Pattern | Driver | Status |
|---|---|---|---|
| Vendor-type hub | `/{vendor-type}` | `VENDOR_TYPES` | live (11 SEO routes) |
| Type × city | `/{vendor-type}/{city}` | `VENDOR_TYPES × CITIES` | live, inventory-gated |
| Vendor leaf | `/{vendor-type}/{city}/{name}-{id}` | backend `/businesses` feed | live, dynamic |
| "Best of" listicle | `/best/{vendor-type}-in-{city}` | flag `LISTICLE_PAGES_ENABLED` | built, flag-off |

**Current ceiling.** 11 live SEO vendor types × 12 cities = **132** type×city combos (capacity ceiling — inventory-gated; actual indexed ≪ this), but `buildProgrammaticShard()` only sitemaps combos with ≥1 real vendor — so the *indexable* count tracks inventory, not the theoretical grid. Plus 11 hubs, 12 city hubs, 11 compare pages, 26 content pillars, glossary, blog, real-weddings, and N vendor leaves (one per onboarded business). Today N is small; that is the binding constraint, not template count.

**The three multipliers** that take us from 132 to thousands:

1. **Activate the 14 dormant categories.** `VENDOR_TYPE_PATHS` already declares 23 slugs — the original 9 plus 14 BK-100.55 Pakistani-specific categories (`wedding-officiants`/Nikahkhwan, `wedding-choreographers`, `dhol-players`, `event-hosts`, `live-streaming`, `generator-rental`, `marquee-rental`, `furniture-rental`, `florists`, `wedding-cakes`, `mithai`, `live-cooking-stalls`, `sound-system-rental`, `qawwali`). Each needs a `/{slug}/[city]` route scaffolded (Layer 2). Add the explicitly-named expansion types — **groom-wear/sherwani**, **bridal-jewellery**, **qawwali** (live), **choreographers** (live) — and the SEO grid widens to **~25 types × 12 cities = ~300** combos (capacity ceiling — inventory-gated; actual indexed ≪ this) before any city expansion. Sherwani and bridal-jewellery are net-new and should land in `VENDOR_TYPES` + backend ENUM in lock-step (see the header comment in `lib/vendor-types.ts`).

2. **Tier-2/3 city expansion.** `CITIES` holds 12. Pakistan's wedding economy reaches well past the metros: add Gujrat, Sargodha, Sahiwal, Bahawalnagar, Rahim Yar Khan, Sukkur, Larkana, Mardan, Abbottabad, Mirpur (AJK), Wah Cantt, Jhelum, Sheikhupura, Kasur, Okara. At ~28 cities × ~25 types = **~700** type×city combos (capacity ceiling — inventory-gated; actual indexed ≪ this). Each is inventory-gated, so we publish only as vendors arrive — no empty bloat.

3. **The event layer (the big one).** Pakistani weddings are *multi-function*. Layering events onto the grid is where the long tail explodes: `/{vendor-type}/{city}/{event}` (e.g. `/mehndi-artists/lahore/mayun`, `/wedding-decorators/karachi/dholki`). Events to template, **with variant spellings handled by canonicalization, not duplicate URLs**: mehndi, barat (baraat), walima (valima), mayun (mayoun/maiyun), dholki, nikkah (nikah), rukhsati, sangeet, qawwali-night. Even a conservative subset — 6 high-intent events on the categories where event-intent is real (decor, mehndi, makeup, photography, catering, dhol, choreographer, venue) — adds another large multiplier. **Guard rail:** only build an event page where the event meaningfully changes the offering (a Mehndi makeup look ≠ a Barat look; a Walima venue ≠ a Mayun home setup). Do **not** mint `/wedding-cars/quetta/dholki` — cars don't vary by function. Event eligibility is a per-type flag in config, not a blanket cross-product.

**Net capacity.** ~25 types × ~28 cities × ~6 eligible events (applied selectively) + hubs + leaves + content realistically supports **5,000–15,000 URLs over 24 months** (capacity ceiling — inventory-gated; actual indexed ≪ this) — enough surface to architect toward 1M *if* authority (DA ~35+) and per-page uniqueness keep pace. Page count is necessary, never sufficient.

---

## 2. The vendor-profile navigational flywheel (highest-ROI mass page)

The single highest-ROI programmatic page is the **vendor leaf** at `/{vendor-type}/{city}/{name}-{id}`. This is exactly how shadiyana.pk bootstrapped DA 22: they rank **#1 for individual venue *names*** (empire marquee islamabad — vol 5,400, pos 1; monal marquee — 3,600, pos 1; sheesh mahal banquet hall — 2,400, pos 1) via a rich indexed profile per venue. These are **navigational/branded** queries — low difficulty, high intent, almost uncontested.

**The flywheel:** every vendor we onboard is a new branded keyword we can own from DA 1, because the searcher already wants *that* vendor and we host the canonical page. With ~25 categories (not just venues — photographers, makeup artists, mehndi artists, qawwali troupes, dhol players, sherwani houses), the namespace of brandable queries is far larger than a venue-only competitor's. **This is the mass-page strategy: onboarding velocity = indexable-page velocity = branded-keyword capture.** It also feeds the booking funnel directly (a name search is bottom-of-funnel).

The leaf URL is already canonical and stable (`projectToCanonical()` in `sitemap.ts`): slug + numeric id suffix guarantees uniqueness and survives renames (id is the durable key; the slug is cosmetic). Keep it locked.

---

## 3. Uniqueness per page — avoiding the thin-programmatic penalty

Google demotes programmatic pages that are templated shells with only a swapped city name. Every page type must clear a **uniqueness floor** beyond `{type}` + `{city}` substitution:

- **Type × city pages** already inject `getCityEditorial(city.slug)` (per-city peak-season, venue character) and `getVendorTypeGuide(vt.slug)`, plus four FAQs whose answers vary by city peak season and live PKR price range (`formatPriceRange(vendors)`). **Extend** the editorial corpus so no two cities share boilerplate — local landmarks, average barat guest counts, load-shedding/generator norms (why `generator-rental` matters in summer Multan), regional cuisine for catering. This is content work tracked in `lib/seo/city-editorial.ts`, additive per city.
- **Vendor leaves** derive uniqueness from real backend data: actual photos, package PKR, reviews (verified-booking only), service area. A leaf with no photos and no description is *itself* thin — gate it (see §4).
- **Event pages** must carry genuinely event-specific copy (Mayun yellow-theme decor norms, Dholki song/dhol expectations, Walima formal-reception conventions) — never a find-and-replace of the parent. If we can't write 150+ unique words about `{event}` for `{type}` in `{city}`, the page shouldn't exist.

**Rule of thumb:** ship a template only when its *data* makes each instance differ. No data → no page → no thin penalty.

---

## 4. Thin-page noindex guards (the safety valve)

The codebase already implements the correct pattern; we extend, not replace:

- **Type × city:** `components/seo/vendor-type-city-page.tsx` computes `hasListings = vendors.length > 0`; when false it emits `<meta name="robots" content="noindex,follow">` and the combo is excluded from `buildProgrammaticShard()`. The page stays crawlable (links flow) but out of the index — which resolved the GSC *"Crawled – currently not indexed"* warnings from empty combos like `/wedding-djs/quetta`. Pages flip to indexable automatically when the first vendor onboards, **no code change**.
- **Listicles:** gated twice — `LISTICLE_PAGES_ENABLED` flag **and** `MIN_VENDORS_FOR_LISTICLE = 3` (a "best of" with 2 vendors isn't a ranking). The sitemap mirrors the page's own guard so we never sitemap a 404.

**Extensions to add:**

| Page type | Index threshold | Below threshold |
|---|---|---|
| Type × city | ≥1 vendor | `noindex,follow` (existing) |
| Type × city (strong) | ≥3 vendors | full index + eligible for `/best/` |
| Event page | ≥3 event-relevant vendors **and** unique copy present | `noindex,follow` |
| Vendor leaf | has ≥1 photo + description | `noindex,follow` until enriched |
| City × event hub | ≥2 eligible categories populated | `noindex,follow` |

Centralize the threshold in `lib/seo` (e.g. `MIN_VENDORS_FOR_INDEX`) so all surfaces read one constant. This keeps the indexed set *quality-dense* — the lever that lets DA-1 pages rank at all.

---

## 5. Internal-linking architecture

Programmatic pages need programmatic links — orphan pages don't get crawled, and link equity must flow from hubs toward money pages. The component already renders `otherCities` (6) and `otherTypes` (6) cross-links; formalize the full mesh:

```
Home
 └─ Vendor-type hub  /{type}            ──┐ (sibling-type links)
      └─ Type × city  /{type}/{city}     ─┼─ ↔ City hub /cities/{city} (all types in city)
           ├─ Vendor leaf /{type}/{city}/{name}-{id}  (money page)
           └─ Event page /{type}/{city}/{event}  ──→ links up to type×city + sideways to other events
 Gallery / real-weddings / blog  ──────────→ funnel into type×city + leaf (money pages)
```

Principles:
1. **Hub → spoke → leaf, and back.** Every type×city links up to both its type hub and its city hub, sideways to 4–6 sibling types in the same city and the same type in 4–6 nearby cities (region-aware via `CITIES[].region` — Punjab cluster, Sindh cluster), and down to its leaves.
2. **Gallery → money-page funnels.** Real-weddings recaps and Pinterest-bait galleries (mehndi-design pages absorbing the ~673k–1.1M/mo informational demand) must each link to the relevant commercial pages — `/mehndi-artists/{city}`, `/wedding-decorators/{city}`. This converts low-value informational traffic into the commercial subset; without it the 1M number is purely vanity.
3. **Contextual, not just footer.** In-body links inside editorial/FAQ copy carry more weight than boilerplate blocks. Generate them from the same typed config so they stay consistent and never 404.
4. **Breadcrumbs everywhere** (already present, emit `BreadcrumbList` JSON-LD) — they double as crawl paths and SERP enhancements.

---

## 6. URL conventions (respect the locked structure)

The URL grammar is locked (see `docs/seo/03-url-conventions-LOCKED.md`). Non-negotiables for all new programmatic surfaces:

- **No trailing slash; all lowercase; hyphen-delimited.** Slugs via `slugifyName()` only.
- **Stable, additive paths.** Never rename the original 9 type slugs (`photographers`, `venues`, `bridal-wear`, …) or city slugs — they are canonical SEO URLs with (eventual) equity. New types/cities are pure additions to config.
- **Event layer extends the path, not query params:** `/{type}/{city}/{event}` — crawlable, not `?event=`.
- **Spelling variants canonicalize to one URL.** Pick the highest-volume spelling as canonical (e.g. `nikkah` per keyword data, `walima`, `mayun`), 301 the variants, and target the alternates as `<title>`/H-tag/body synonyms — never as separate indexable URLs (that's duplicate-content self-competition).
- **Locale:** en-PK default, ur-PK alternate via existing hreflang; the `/ur` tree expands additively.

---

## 7. Indexation at scale

Crawl budget and indexation become the real constraint past a few thousand URLs:

- **Sitemap.** Currently one combined `/sitemap.xml` with four logical shards (core, programmatic, vendors, images) — correct under the 50k-URL / 50MB ceilings. The `generateSitemaps()` shard helpers are retained as comments; **re-introduce true sharding the moment the vendor set approaches ~40k URLs** (the threshold is already documented in `sitemap.ts`). Image shard keeps feeding Google Images / Pinterest — critical for the mehndi-design visual demand.
- **IndexNow.** Wire the existing `indexnow` capability into vendor onboarding and event-page publish so new leaves/combos are submitted to Bing/Yandex instantly — and ping Google via sitemap `lastModified`. Branded leaf pages index fastest when pushed the moment they go live.
- **Crawl-budget hygiene.** The `noindex,follow` guards (§4) keep Googlebot off thin pages while preserving link flow; `robots.ts` already allowlists AI crawlers. Avoid faceted-filter URL explosions (keep filters in query params that are `noindex` or canonicalized to the clean path). Keep ISR `revalidate: 3600` so `lastModified` stays honest without re-rendering on every request.
- **Sequencing.** Don't dump 5,000 URLs at once from DA 1 — Google will sample and may distrust the burst. Release in inventory-driven waves (city by city, category by category), matching the master plan's phased assault, so indexation tracks demonstrated quality.

---

## 8. Build sequence (all additive, flag-gated, zero-downtime)

1. Scaffold `[city]` routes for the 14 dormant BK-100.55 slugs (reuse `vendor-type-city-page.tsx`; noindex until populated). No risk — empty combos self-suppress.
2. Add `groom-wear`/`sherwani` + `bridal-jewellery` to `VENDOR_TYPES` and backend ENUM in lock-step.
3. Expand `CITIES` with tier-2/3 entries + `city-editorial.ts` copy per new city.
4. Introduce the event layer behind a flag (`EVENT_PAGES_ENABLED`), per-type event eligibility config, ≥3-vendor + unique-copy guard.
5. Wire IndexNow into onboarding; add region-aware cross-link mesh.
6. Flip `LISTICLE_PAGES_ENABLED` once enough combos clear `MIN_VENDORS_FOR_LISTICLE`.

Every step ships dark, gates on real inventory, and degrades to the current site if a flag is off or the backend is unreachable (the sitemap's empty-fallback already proves this discipline). Page capacity is the easy half; the uniqueness floor (§3) and authority build are what convert capacity into the commercial traffic that actually books weddings.

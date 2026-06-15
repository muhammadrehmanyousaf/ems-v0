# 02 — The Keyword Universe & Page-Type Map

*Purpose: map the entire PK wedding keyword space into prioritized clusters, bind each cluster to a page type and difficulty tier, define the workflow that converts free-tier exports into a fully-scored universe, and end with a repeatable "first 200 keywords" selection method.*

> Read alongside `01-traffic-model-to-1M.md` (the 1M scenario math), `04-programmatic-architecture.md` (how these clusters become URLs at scale), and the root `SEO-MASTER-PLAN.md` (the 12-month tiering this file extends). This file is the *demand-side* atlas; the architecture file is the *supply-side* build.

## 1. How to read this file (the honesty frame)

The 1M organic visits/mo target is an **aggressive-scenario ceiling**, and the keyword universe is *why* it is even arithmetically plausible: the PK wedding search space is several million queries/mo. But the universe is brutally lopsided. Roughly **85–90% of the raw volume is informational** (mehndi designs, dress ideas, hairstyles) — low conversion, Pinterest/Google-Images intent, soft RPM. **Bookings and leads come from a thin commercial subset** (`{vendor}×{city}`, cost/packages, vendor-name navigational) that is maybe **5–10% of the volume but ~80% of the revenue.** Plan to *win the informational mass for reach and DA*, but *measure success on the commercial subset.* Every volume/SD below is **Ubersuggest free-tier PK (locId 2586), directional, a FLOOR** until GSC + paid enrichment replace it (see §7).

## 2. The universe at a glance

| Super-cluster | Intent | Rough PK volume/mo (directional) | Page type | Revenue weight |
|---|---|---|---|---|
| Mehndi designs | Informational | 1.1M de-duped head; 1.5–3M long-tail universe | Gallery / blog spoke | Low (DA + reach) |
| Bridal dress / lehenga / gharara | Commercial-info hybrid | 200k–400k+ | Lookbook + commercial bridge | **High (fast ROI)** |
| Hairstyles / makeup looks | Informational | 150k–300k | Gallery / tutorial | Low–med |
| Decor / invitation / jewellery ideas | Informational | 150k–300k | Idea gallery | Low–med |
| `{vendor}×{city}` | Commercial | 80k–150k | Programmatic listing | **Highest** |
| Vendor-name navigational | Navigational | 100k–250k (sum of long tail) | Vendor profile | **Highest (flywheel)** |
| Cost / packages / pricing | Transactional-info | 40k–80k | Cost guide + calculator | **High (link magnet)** |
| Venue / marquee / hall | Commercial | 60k–120k | Listing + venue profile | **High** |

---

## 3. INFORMATIONAL clusters (the volume mass)

### 3A. Mehndi designs — the single largest cluster

The biggest demand pool in PK weddings. `mehndi design` alone is ~**673,000/mo (SD 47)**; the de-duped mehndi head is ~**1.1M/mo**; enriched across body-part × style × occasion × year the universe is plausibly **1.5–3M/mo**. Head term SD is high, but the **long tail is soft** — best low-difficulty win found so far: `back hand design mehndi` **33,100/SD 14**.

| Representative keyword | Vol | SD | Intent | Target page | Tier |
|---|---|---|---|---|---|
| mehndi design | 673,000 | 47 | Info | `/mehndi-designs` pillar hub | C |
| back hand design mehndi | 33,100 | 14 | Info | `/mehndi-designs/back-hand` | **A** |
| (front hand / full hand / feet / arabic / minimal / bridal / kids) | enrich | mix | Info | facet spoke per modifier | A–B |
| mehndi design 2026 / latest | enrich | low–mid | Info | year-freshness spoke | A |
| simple/easy mehndi design | enrich | low | Info | beginner spoke | A |

**Sub-axes to enumerate (each = an indexable facet page):** body-part (front-hand, back-hand, full-hand, feet/paon, finger, wrist) × style (Arabic, Indian, Pakistani, minimal, floral, mandala, bridal/dulhan) × occasion (bridal, mayun, dholki, eid, engagement) × audience (kids, simple/easy, for beginners) × freshness (2026, latest). **Page type:** answer-first **gallery posts** with 20–40 captioned images, alt text per romanization, `ImageObject` + `HowTo`/`Article` schema, Pinterest-ready vertical assets. **Do NOT make these vendor booking pages** — intent is inspiration. Internal-link every mehndi gallery → `/mehndi-artists/[city]` money page (the conversion bridge). This single cluster can carry a large fraction of any 1M.

### 3B. Hairstyles & makeup looks

`bridal hairstyle`, `walima hairstyle`, `mehndi hairstyle`, `front hair style for wedding`, `bridal makeup look`, `nikkah makeup`, `barat makeup`, `soft glam bridal makeup`. Mid-volume, image-intent. **Page type:** gallery/tutorial spoke; bridge to `/bridal-makeup-artists/[city]`. Difficulty mostly **A–B** on long tail.

### 3C. Decor, invitations/cards, jewellery ideas

`mehndi decoration ideas`, `mayun decor`, `nikkah stage decoration`, `wedding invitation card design`, `mehndi card design`, `bridal jewellery sets`, `matha patti design`. Image + light-commercial. **Page type:** idea galleries → bridge to `/wedding-decorators/[city]`, `/wedding-stationery/[city]`, and a future bridal-jewellery category. Difficulty **A–B** on the modifier long tail.

---

## 4. BRIDAL DRESS cluster — the fastest commercial ROI

This is the **strategic wedge**: high commercial-ish intent yet **LOW difficulty** — roughly **52% of scored bridal-dress volume is SD ≤ 20.** These convert better than mehndi (purchase/shortlist intent) and rank faster than `{vendor}×{city}`. Attack early and hard.

| Keyword | Vol | SD | Intent | Target page | Tier |
|---|---|---|---|---|---|
| bridal gown dress | 14,800 | 20 | Commercial-info | `/bridal-wear/gowns` lookbook | **A** |
| pakistani wedding dress for bride | 8,100 | 12 | Commercial-info | `/bridal-wear/wedding-dresses` | **A** |
| pakistani bridal dresses | 8,100 | 20 | Commercial-info | `/bridal-wear` hub | **A** |
| walima dress for bride | 6,600 | 7 | Occasion | `/bridal-wear/walima` | **A** |
| gharara designs | 6,600 | 20 | Style | `/bridal-wear/gharara` | **A** |
| nikkah dresses | 6,600 | 21 | Occasion | `/bridal-wear/nikkah` | **A/B** |
| bridal dresses for barat | 4,400 | 8 | Occasion | `/bridal-wear/barat` | **A** |
| barat dress for bride | 4,400 | 8 | Occasion | `/bridal-wear/barat` | **A** |
| mehndi dress for bride | 4,400 | 9 | Occasion | `/bridal-wear/mehndi-dress` | **A** |
| nikkah dresses for bride | 3,600 | 8 | Occasion | `/bridal-wear/nikkah` | **A** |

**Sub-axes to enumerate:** occasion (barat, walima, mehndi, nikkah, mayun, engagement) × silhouette/style (lehenga, gharara, sharara, maxi, gown, frock, angrakha, peplum) × colour (red, maroon, gold, pastel, white, ivory, green) × designer (HSY, Maria B, Sana Safinaz, Élan, Nomi Ansari — navigational) × price (under 50k, affordable, budget bridal). **Page type:** **lookbook galleries** with `Article`/`ImageObject` schema + a soft commercial CTA bridging to `/bridal-wear/[city]` and bridal-wear vendor profiles. Designer-name pages double as navigational catches. This cluster is the **single best Phase-1 reach+revenue blend** in the universe.

---

## 5. COMMERCIAL clusters (the bookings engine)

### 5A. `{vendor-type} × {city}` matrix

The core money grid — already built programmatically (11 vendor types × 12 cities, auto-filtering empty combos; see `04-programmatic-architecture.md`). Individual cells are low-volume but there are hundreds; aggregate intent is the highest-converting demand in the universe.

| Keyword pattern | Example | Vol | SD | Page | Tier |
|---|---|---|---|---|---|
| {vendor} {city} | wedding photographer lahore | 390 | (pos ~43 today) | `/wedding-photographers/lahore` | B |
| {vendor} near me | wed photographer near me | 170 | 8 | city pages (geo) | **A** |
| photographer for wedding | (hub) | 1,000 | 14–18 | `/wedding-photographers` | B |
| makeup artists | (hub/city) | 880 | 24 | `/bridal-makeup-artists/[city]` | B/C |

**Enumeration:** 17 vendor types (11 live + 6 expansion: groom-wear/sherwani, bridal-jewellery, singers/bands, choreographers/dholki, qawwali, wedding-cakes) × 18 cities (Tier-1 metros → Tier-3 long-tail) × modifiers (best, top, near me, affordable, professional). **Page type:** programmatic listing with ≥6 real vendor cards, unique per-city intro, PKR ranges, FAQ + `ItemList` schema. **Thin-page guard:** <3 vendors → `noindex`.

### 5B. Vendor-name navigational — the replicable flywheel

The highest-ROI page type in the plan. Shadiyana bootstrapped its 66k traffic largely by ranking **#1 for individual venue names** via rich profile pages: `empire marquee islamabad` 5,400/#1, `monal marquee` 3,600/#1, `sheesh mahal banquet hall` 2,400/#1, plus `blessings marquee` 2,400, `tulip banquet hall` 4,400 (all volumes directional, Ubersuggest free-tier). Each query is **navigational, near-uncontested, low-difficulty.** Summed across every venue/photographer/makeup-artist/caterer this is **100k–250k/mo of catchable long tail.**

| Keyword | Vol | Intent | Page | Tier |
|---|---|---|---|---|
| blessings marquee | 2,400 | Navigational | `/wedding-venues/blessings-marquee` | **A** |
| sheesh mahal banquet | 2,400 | Navigational | venue profile | **A** |
| tulip banquet hall | 4,400 | Navigational | venue profile | **A** |
| {any listed vendor name} | long tail | Navigational | per-vendor profile | **A** |

**Page type:** rich vendor profile (portfolio, reviews, PKR price, map) with `LocalBusiness` + `AggregateRating` schema. **Mass-produce these** — one profile per inventory vendor = one near-guaranteed #1.

### 5C. Cost / packages / pricing — transactional + link magnet

Thin competition, high intent, most-linkable format. `{vendor} cost {city}`, `{vendor} packages price in pakistan`, `catering rates per head {city}`, `how much does a wedding cost in pakistan`, `wedding photography packages lahore`. **Page type:** cost-guide articles + the existing `/planning-tools/budget` calculator (a link magnet competitors lack because theirs is app-locked). FAQ schema, PKR tables, annual freshness. Tier **A–B**; the head `wedding cost in pakistan` is **C** but a top link-bait target.

### 5D. Venues / marquees / halls

`marriage hall near me` 4,400, `marriage hall` 2,900, plus the navigational marquee names in 5B. Venue is shadiyana's fortress — contest it via **profile flywheel + tier-2 cities** rather than head-on for `wedding venues`. **Page type:** `/wedding-venues/[city]` listing + per-venue profiles. Mixed **A (near-me/navigational) → C (head)**.

---

## 6. Difficulty-tier definitions

| Tier | Free-tier SD | Meaning | When to attack |
|---|---|---|---|
| **A** | SD ≤ 15 *or* navigational/near-me | Rankable from low DA in weeks | Phase 1 (Mo 1–4) |
| **B** | SD 16–26 | Needs some on-page depth + a few links | Phase 1–2 (Mo 3–9) |
| **C** | SD 27+ / head terms | Needs DA ~35+ and topical authority | Phase 3+ (Mo 9–24) |

Mehndi/bridal-dress *heads* are C; their *modifier long tails* are A/B — **always go after the long tail first, let it feed authority up to the head.**

---

## 7. Data-enrichment workflow (turn ~19-enriched exports into a scored universe)

Free-tier `keyword_suggestions` returns large lists but enriches only ~19 rows with volume/SD; everything else is a bare string. Convert the floor into a full scored universe:

1. **STEP ZERO — own data first.** Connect GSC (`gsc`/`search-console-unified`) + GA4 (`ga4`) + Bing Webmaster. Pull Search Analytics queries/pages — these are *real Google* impressions/clicks/position and instantly outrank any Ubersuggest estimate. See `GSC-GA4-SETUP.md`. Seed the universe from every query already earning impressions.
2. **Harvest the long tail.** For each cluster head run `mcp__ubersuggest__keyword_suggestions` + `google_suggestions` (autocomplete) + `mcp__ubersuggest__content_ideas`; dedupe; this is the raw string pool (thousands of rows).
3. **Enrich in batches.** Feed the bare strings through `mcp__ubersuggest__keyword_metrics` and `match_keywords` (PK locId 2586) to attach volume + SD beyond the free 19. Budget the 3-domain/day cap by enriching highest-priority clusters first (bridal-dress, vendor×city, cost).
4. **Validate intent + winnability on the live SERP.** For any keyword you're about to commit a page to, run `serper` (or `mcp__ubersuggest__serp_analysis`) to read the *actual* PK SERP: Is it Pinterest/Images-walled (→ gallery, not money page)? Do DA<25 sites rank (→ winnable)? Is there an AI Overview / People-Also-Ask (→ answer-first + FAQ schema)? This SERP read overrides the SD number.
5. **Score & cluster.** Compute a priority score per keyword: `Opportunity = (Volume × IntentWeight × CTRtier) / max(SD,1)`, where IntentWeight = 1.0 commercial/navigational, 0.5 transactional-info (dress/cost), 0.2 pure-informational. Tag each row with super-cluster + target page type + A/B/C tier. Store as a typed dataset feeding `lib/content/` and the programmatic engine.
6. **Refresh quarterly.** GSC reveals new queries you rank for on page 2 (striking-distance) — feed those back as the next enrichment batch. The universe is a living file, not a one-time export.

---

## 8. The "first 200 target keywords" methodology

Do not hand-pick 200; **derive them by formula** so the list is defensible and reproducible.

**Selection rules (apply in order against the §7-scored dataset):**

1. **Pin the proven anchor.** Include the ~1 keyword already indexed (`wedding photographer lahore`, pos ~43) + every GSC query already earning impressions — these are striking-distance freebies.
2. **Quota by cluster** (balances reach vs revenue):
   - 60 — **vendor-name navigational** (top-volume venues/photographers in inventory): fastest #1s, builds the flywheel.
   - 45 — **bridal-dress** SD ≤ 20 (occasion × style × colour): fastest commercial ROI.
   - 40 — **`{vendor}×{city}`** Tier-A/B for the core-6 vendors × 4 metros + near-me variants: the bookings engine.
   - 25 — **mehndi long-tail** SD ≤ 20 (body-part/style/2026): reach + DA, e.g. `back hand design mehndi`.
   - 20 — **cost/packages** (`{vendor} cost {city}`, `wedding cost in pakistan`): link magnets + high intent.
   - 10 — **other informational bridges** (hairstyles, decor, jewellery) feeding money pages.
3. **Filter every candidate** through: SERP-validated intent matches the page type (rule §7.4); SD ≤ 20 *or* navigational/near-me; a target page exists or is cheap to generate; not Pinterest-walled unless the page is intentionally a gallery.
4. **Sequence into sprints.** First-200 ≈ first ~6 months: Sprint 1 = all navigational + bridal-dress SD ≤ 12 (rankable in weeks); Sprint 2 = vendor×city near-me + cost; Sprint 3 = mehndi/bridal-dress SD 13–20.
5. **Map 1:1 to a page** and an owner; if a keyword has no page, it's not in the 200 — it's a backlog item for `04-programmatic-architecture.md`.

**KPI on the 200:** track in GSC monthly — impressions → clicks → top-3 count, segmented commercial vs informational. The commercial subset's lead/booking volume — not the informational vanity reach — is the real scoreboard, even as the informational mass does the heavy lifting toward any 1M ceiling.

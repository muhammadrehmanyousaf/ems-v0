# 11 — Whole-Pakistan Coverage: The Exact Page-Count & City-Tier Model

*Purpose: replace hand-waved "150–300 cities × vendors = 1M pages" guesses with a **real-geography, inventory-gated** page-count model for weddingwala.pk. This file sizes the **supply side** (how many pages can exist and should be indexed) against verified Pakistan geography; `01-traffic-model-to-1M.md` sizes the **demand side**; `04-programmatic-architecture.md` defines the **engine** that mints these URLs. Read all three together.*

> **Honesty banner (non-negotiable).** Pakistan has ~127 cities over 100k people, but we do **not** target 127 — most have **no biddable wedding-vendor inventory** and would produce thin doorway pages (Google's "scaled content abuse"). The number that matters is not *cities* or *generated URLs* — it is **inventory-gated, genuinely-useful, indexed pages**. Every count below is split into **theoretical capacity** (the template grid) vs **indexable** (combos that pass the ≥1-vendor + uniqueness floor in `04-programmatic-architecture.md` §3–4). We never mass-publish empty city pages. Authority/links remain the #1 ranking lever (one honest sentence — see `05-authority-linkbuilding.md`); page supply is necessary, never sufficient.

---

## 1. Real Pakistan geography (verified, sourced)

Pakistan's first digital census (the **2023 Census**, reference date 1 March 2023, Pakistan Bureau of Statistics) is the authoritative baseline. The headline numbers that bound any "whole Pakistan" claim:

| Administrative unit | Count | Notes |
|---|---|---|
| Provinces + territories | **7** | Punjab, Sindh, KP, Balochistan, Gilgit-Baltistan (GB), Azad Jammu & Kashmir (AJK), Islamabad Capital Territory (ICT) |
| Divisions | ~37 | Intermediate tier between province and district |
| **Districts** | **~169–171** | Punjab 41, Sindh 30, KP ~40, Balochistan ~36, GB 14, AJK 10 (+ ICT) |
| **Tehsils** | **~600+** (directional) | Punjab ~162, Sindh 138; KP/Balochistan add ~130/~90; no single clean national 2023 figure published |
| **Cities/towns over 100k** | **127** | The realistic upper bound of "cities" worth discussing for any consumer marketplace |
| Megacities (>10M) | 2 | Karachi, Lahore |

### 1.1 The 127 cities-over-100k, by province (the only "cities" figure that matters)

| Province / territory | Cities > 100k | Share |
|---|---|---|
| **Punjab** | **81** | 64% |
| **Sindh** | **22** | 17% |
| **Khyber Pakhtunkhwa** | **13** | 10% |
| **Balochistan** | **8** | 6% |
| **Azad Kashmir (AJK)** | **2** | 2% |
| **Islamabad Capital Territory** | **1** | 1% |
| Gilgit-Baltistan | 0 (none > 100k) | — |
| **Total** | **127** | 100% |

> **Strategic read:** Pakistan's urban wedding economy is overwhelmingly **Punjab-weighted (64% of all 100k+ cities)**, then a Sindh corridor (Karachi → Hyderabad → Sukkur/Larkana), with KP (Peshawar/Mardan/Mingora) and one node in Balochistan (Quetta). GB has zero cities over 100k — there is **no programmatic case** for GB beyond a single token hub. The friend's "150–300 cities" is geographically impossible at any meaningful population threshold: even counting *every* town over 100k you reach **127**, and most of those 127 have a wedding-services economy too informal to populate a marketplace.

### 1.2 The demand-relevant city ladder (2023 populations)

The top ~24 cities capture essentially all of the addressable urban wedding-services market:

| Rank | City | 2023 pop | Province | In `CITIES` today? |
|---|---|---|---|---|
| 1 | Karachi | ~18.9M | Sindh | ✅ |
| 2 | Lahore | ~13.0M | Punjab | ✅ |
| 3 | Faisalabad | 3.69M | Punjab | ✅ |
| 4 | Rawalpindi | 3.36M | Punjab | ✅ |
| 5 | Gujranwala | 2.51M | Punjab | ✅ |
| 6 | Multan | 2.22M | Punjab | ✅ |
| 7 | Hyderabad | 1.92M | Sindh | ✅ |
| 8 | Peshawar | 1.91M | KP | ✅ |
| 9 | Quetta | 1.57M | Balochistan | ✅ |
| 10 | Islamabad | 1.11M | ICT | ✅ |
| 11 | Sargodha | 0.98M | Punjab | ⬜ |
| 12 | Sialkot | 0.91M | Punjab | ✅ |
| 13 | Bahawalpur | 0.90M | Punjab | ✅ |
| 14 | Jhang | 0.61M | Punjab | ⬜ |
| 15 | Sheikhupura | 0.59M | Punjab | ⬜ |
| 16 | Gujrat | 0.57M | Punjab | ⬜ |
| 17 | Sukkur | 0.56M | Sindh | ⬜ |
| 18 | Larkana | 0.55M | Sindh | ⬜ |
| 19 | Sahiwal | 0.54M | Punjab | ⬜ |
| 20 | Okara | 0.53M | Punjab | ⬜ |
| 21 | Rahim Yar Khan | 0.52M | Punjab | ⬜ |
| 22 | Kasur | 0.51M | Punjab | ⬜ |
| 23 | Dera Ghazi Khan | 0.49M | Punjab | ⬜ |
| 24 | Wah Cantt | 0.40M | Punjab | ⬜ |

**Sources:** [2023 Pakistani census](https://en.wikipedia.org/wiki/2023_Pakistani_census) · [List of cities in Pakistan by population](https://en.wikipedia.org/wiki/List_of_cities_in_Pakistan_by_population) · [Districts of Pakistan](https://en.wikipedia.org/wiki/Districts_of_Pakistan) · [List of districts in Punjab](https://en.wikipedia.org/wiki/List_of_districts_in_Punjab,_Pakistan) · [List of tehsils of Punjab](https://en.wikipedia.org/wiki/List_of_tehsils_of_Punjab,_Pakistan) · [List of districts in Sindh](https://en.wikipedia.org/wiki/List_of_districts_in_Sindh) · [List of tehsils of Sindh](https://en.wikipedia.org/wiki/List_of_tehsils_of_Sindh) · [List of districts in KP](https://en.wikipedia.org/wiki/List_of_districts_in_Khyber_Pakhtunkhwa) · [List of districts in Balochistan](https://en.wikipedia.org/wiki/List_of_districts_in_Balochistan) · [PBS](https://www.pbs.gov.pk/).

---

## 2. The tiered city model (exact counts — demand × inventory, not all 127)

We target **~32 cities at full build-out**, not 127. The cut line is **demand AND realistic vendor inventory**, not population alone (a 250k city with zero biddable photographers earns one `noindex` shell, not a published page).

| Tier | Definition | Cities | Count | Cumulative |
|---|---|---|---|---|
| **Tier 1 — Metros** | >2.5M, dense vendor supply, where bookings concentrate | Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Gujranwala | **6** | 6 |
| **Tier 2 — Major secondary** | 0.5M–2.5M, real but thinner supply (today's `CITIES` rounded out) | Multan, Hyderabad, Peshawar, Sialkot, Bahawalpur, Quetta | **6** | 12 |
| **Tier 3 — Demand-credible** | 0.4M–1M, add **only as vendors onboard** | Sargodha, Gujrat, Sheikhupura, Sukkur, Larkana, Sahiwal, Okara, Rahim Yar Khan, Kasur, Jhang, Dera Ghazi Khan, Wah Cantt, Mardan, Nawabshah, Mingora, Jhelum, Mirpur (AJK), Abbottabad, Rawalpindi-region towns | **~20** | **~32** |
| **Long-tail — Watchlist** | Remaining ~95 of the 127, plus tehsil-level | Sadiqabad, Khanewal, Hafizabad, Chiniot, Kamoke, Burewala, Mirpur Khas, Turbat, Kohat, … | ~95 (mostly never published) | (watchlist) |

> **The hard line:** Tiers 1–2 (**12 cities**) are our current live set and the proven-demand core. Tier 3 (**~20 cities**) is the realistic *expansion frontier* over 24 months, gated city-by-city on inventory. The **~95 long-tail cities are NOT a build target** — they exist as `noindex,follow` shells that auto-flip to indexable *if and when* a real vendor ever onboards there. This is the structural difference from the friend's plan: he counts all cities as pages-to-publish; we count cities as **capacity that only converts to a page when inventory exists.**

---

## 3. Exact page-count math by page TYPE

Two numbers per row: **Theoretical (T)** = the full template cross-product (capacity ceiling), and **Indexable (I)** = what actually passes the ≥1-vendor + uniqueness gate and gets sitemapped. **I ≪ T by design.** All event/listicle/strong-city gates per `04-programmatic-architecture.md` §4.

### 3.1 Static / hub surfaces (always indexable — editorial, not gated)

| Page type | URL pattern | Count | Notes |
|---|---|---|---|
| Vendor-type hubs | `/{vendor-type}` | 11 → ~17 (with expansion) | One per live type |
| City hubs | `/cities/{city}` | 12 → ~32 | One per live city |
| Province hubs | `/{province}` (new) | 7 | Punjab, Sindh, KP, Balochistan, GB, AJK, ICT |
| Compare / glossary / blog index / real-weddings | misc | ~15 | Existing |
| **Hub subtotal** | | **~45 → ~70** | High-equity internal-link spine |

### 3.2 The programmatic grid (the volume — inventory-gated)

| Page type | Pattern | Theoretical (capacity) | Indexable @ M24 (realistic) | Gate |
|---|---|---|---|---|
| **{service}×{city} category** | `/{type}/{city}` | 17 types × 32 cities = **544** | **~300–360** | ≥1 vendor; ≥3 → "strong" |
| **"Best {service} in {city}" listicle** | `/best/{type}-in-{city}` | same 544 | **~120–180** | `MIN_VENDORS_FOR_LISTICLE = 3` |
| **{service}×{city}×{event}** | `/{type}/{city}/{event}` | ~8 event-eligible types × 12–20 cities × 6 events ≈ **600–960** | **~250–500** | event-eligible type only + ≥3 vendors + unique copy |
| **Vendor PROFILE leaves** ⭐ | `/{type}/{city}/{name}-{id}` | = # onboarded businesses (unbounded) | **~3,000–6,000+** | has ≥1 photo + description |
| **Programmatic subtotal** | | T ≈ 1,700 + N leaves | **I ≈ 3,700–7,000** | |

> ⭐ **The vendor-profile leaf is the real indexed-volume driver** — not the {service}×{city} grid. The grid tops out at a few hundred genuinely-strong combos; **leaves scale with onboarding velocity and have no thin-content risk** (each carries unique first-party data: real photos, PKR packages, verified reviews, service area). This is exactly how shadiyana.pk bootstrapped DA 22 — ranking #1 for individual venue *names* (`04-programmatic-architecture.md` §2). **Onboarding velocity = indexable-page velocity.** Our ~17-category namespace (vs a venue-only competitor) makes the brandable-query surface several times larger.

### 3.3 Informational / blog (volume + authority, lightly gated by quality only)

| Page type | Examples | Count @ M24 (Base → Aggressive) |
|---|---|---|
| Content pillars / cost guides | "Wedding Cost in Pakistan 2026", "{vendor} cost in {city}" | ~40 → ~80 |
| Informational galleries | mehndi designs, bridal looks, decor ideas (the ~673k–1.1M/mo demand) | ~150 → ~300 |
| Real-weddings recaps | per-wedding, vendor-credited (link manufacturing) | ~60 → ~200 |
| **Informational subtotal** | | **~250 → ~580** |

### 3.4 Total indexable ladder (the number that matters)

| Bucket | M6 | M12 | M24 (Base) | M24 (Aggressive) |
|---|---|---|---|---|
| Hubs (static) | ~45 | ~55 | ~65 | ~70 |
| {service}×{city} category | ~110 | ~200 | ~300 | ~360 |
| "Best of" listicles | ~30 | ~80 | ~130 | ~180 |
| {service}×{city}×{event} | 0 (flag-off) | ~80 | ~250 | ~500 |
| Vendor profile leaves ⭐ | ~550 | ~1,500 | **~3,000** | **~6,000** |
| Informational / blog | ~120 | ~250 | ~400 | ~580 |
| **Total INDEXABLE** | **~855** | **~2,165** | **~4,145** | **~7,690** |
| *Theoretical URLs generated* | *~2k* | *~5k* | *~9k* | *~15k* |

> The **theoretical-vs-indexable gap is the whole strategy**: at M24 Aggressive we *generate* ~15k URLs but *index* ~7.7k — the other ~7k are `noindex,follow` thin/empty combos that protect crawl budget and keep the indexed set quality-dense. The friend's model has no such gap; he would publish all ~15k, ~half of them thin → demotion risk for the whole domain.

---

## 4. Reconciliation to the traffic model (and why we beat the friend's approach)

The indexable ladder in §3.4 lands **exactly on the demand-side targets** in `01-traffic-model-to-1M.md` §2 — by construction, not coincidence:

| Scenario | `01` target (quality-indexed pages @ M24) | This file's §3.4 supply | Maps toward |
|---|---|---|---|
| Conservative | ~1,500 | (sub-Base ramp; leaves slow) | ~160k/mo |
| **Base (plan of record)** | **~4,000** | **~4,145** ✅ | **~500k/mo** |
| Aggressive (ceiling) | ~8,000 | ~7,690 ✅ | ~1,000,000/mo |

> **How ~4k–8k pages map toward ~1M/mo (honest caveat):** per `01` §2.4, the arithmetic is *pages × blended avg visits/page*. ~8k indexable pages × ~125 blended visits/mo ≈ 1.0M **only if** a few hundred informational galleries average 1k–5k each AND we reach ~22% category capture AND DA ~35+/~600 referring domains. **All three must hold simultaneously** — that is what makes 1M a *ceiling we architect toward, not a promise*. Plan and budget against **Base (~4,145 pages → ~500k/mo, ~200k of it commercial)**; build the engine capable of Aggressive so the upside is captured if links + velocity + image-SERP capture all break our way. North star stays **leads, not visits** (`01` §4.3).

### 4.1 Explicit contrast with the friend's "mass-publish" model

| Dimension | Friend's playbook | Wedding Wala (this plan) |
|---|---|---|
| City target | "150–300 cities" | **127 exist >100k; we publish ~12 now → ~32 max, inventory-gated** |
| Page premise | "2,273 pages" / publish all cities × vendors | **Theoretical ~9k–15k; INDEXABLE ~4k–8k (gated)** |
| Empty combos | Published (e.g. `/wedding-djs/quetta` with 0 DJs) | **`noindex,follow`, auto-flip when first vendor onboards** |
| Primary volume driver | {vendor}×{city} grid | **Vendor PROFILE leaves (unique first-party data, no thin risk)** |
| Thin-content exposure | **High** — half the grid is shells → "scaled content abuse" / sitewide demotion | **Low** — uniqueness floor + ≥1-vendor gate per `04` §3–4 |
| Ranking claim | "12 months = #1" | **Compete for #1; never guaranteed; leads = north star** |

> **The thin-content penalty risk, stated plainly:** Google's March-2024 "scaled content abuse" policy demotes domains that publish large volumes of low-value, templated pages. Mass-publishing all 127 cities × 17 vendor types = **2,159 URLs**, of which the overwhelming majority would have **zero real vendors** — i.e. thin doorways. That is not "1M coverage"; it is a sitewide-demotion trap from DA 1. **Inventory-gating + vendor-profile-led growth is the only correct path**: the indexed set grows *with proven supply*, every page differs by *data not just city name*, and crawl budget is spent on pages that can actually rank and convert.

---

## 5. What to build first (sequence tied to 11 vendor types + 12 cities, expanding outward)

Strictly additive, flag-gated, zero-downtime (mirrors `04` §8 and `TODO.md` §D). **Depth before breadth.**

| Wave | Window | Build | Indexable add |
|---|---|---|---|
| **W1 — Deepen the live core** | M0–M3 | Make all 11 types × 12 cities = **132** combos *strong*: unique per-city editorial, PKR ranges, ≥3 vendor cards, FAQ, internal mesh. Onboard hard in Tier-1 (KHI/LHR/ISB/RWP) to push leaves past the ≥3 gate. | +category strong, +leaves |
| **W2 — Profile flywheel + listicles** | M3–M6 | Wire **IndexNow** into onboarding; flip `LISTICLE_PAGES_ENABLED` for combos clearing `MIN_VENDORS_FOR_LISTICLE=3`; ship first "Best {service} in {city} 2026" set + flagship cost pillars. | +leaves (mass), +listicles |
| **W3 — Category expansion** | M6–M12 | Add **groom-wear/sherwani + bridal-jewellery** to `VENDOR_TYPES`+ENUM; activate dormant BK-100.55 slugs (qawwali, dhol, choreographers, cakes, florists…). Grid widens 11→~17 types. | +category, +leaves |
| **W4 — City expansion (Tier 3)** | M9–M18 | Add `CITIES` + `city-editorial.ts` for Sargodha, Gujrat, Sukkur, Larkana, Sheikhupura, Sahiwal, Okara, RYK, Kasur, Mardan, Mingora, Jhelum, Mirpur — **one city flips live only when its first vendors onboard**. ~12→~32 cities. | +category, +leaves |
| **W5 — Event layer + province hubs** | M12–M24 | `EVENT_PAGES_ENABLED` for event-eligible types (mehndi/decor/makeup/photography/catering/venue × mehndi/barat/walima/mayun/dholki/nikkah); ship 7 province hubs; scale informational galleries → funnel to money pages. | +event, +informational |

> **Sequencing rule:** never open a new city or category until the current one has real inventory and strong (≥3-vendor) pages — otherwise the expansion mints `noindex` shells and dilutes nothing useful. Geography is *capacity*; **onboarding is the throttle.** Punjab-first (64% of cities + densest supply), then the Sindh corridor, then KP/Balochistan single nodes; GB stays a token hub only.

---

_Created 2026-06-15. Cross-refs: `01-traffic-model-to-1M.md` (demand sizing), `04-programmatic-architecture.md` (the engine + gates), `TODO.md` §D (execution). Geography per the 2023 Pakistani census (PBS). All page counts are capacity-vs-indexable; we never mass-publish empty city pages._

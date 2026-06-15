# 08 — The 24-Month Month-by-Month Execution Roadmap

*Purpose: a calendarised, KPI-gated execution plan that extends `SEO-MASTER-PLAN.md` (its 3 phases stop at M12) to a full 24 months, mapping every month to a focus, concrete deliverables, the MCP servers that drive the work, and an exit-gate KPI tied to the Base scenario in `01-traffic-model-to-1M.md`.*

> **How to read this.** Traffic milestones below track the **Base scenario** (`01` §2.3): the defensible plan-of-record landing at ~500k/mo by M24. The Aggressive (1M ceiling) line is noted only as the upside we architect toward — never as a forecast. All page counts are cumulative *quality-indexed* pages (empty `{vendor}×{city}` combos stay `noindex`; see `04-programmatic-architecture.md`). Every number is **directional until GSC is connected at M0** and re-forecast each quarter. Keyword data references `02-keyword-universe.md`; link targets reference `05-authority-linkbuilding.md`. Decemberistan = the Oct–Feb PK wedding peak that bends every seasonal lever.

---

## 1. Phase map (extends the master plan's 3 phases to 6)

| Phase | Months | Theme | Base exit-traffic |
|---|---|---|---|
| **P0 Foundation** | M1 | Data truth + technical baseline | impressions live in GSC |
| **P1 Quick-wins + flywheel** | M2–M3 | Tier-A bridal-dress wins + vendor-name navigational engine | **~4,000/mo** |
| **P2 Category + geo depth** | M4–M6 | Tier-2 cities, under-served categories, Urdu, event pages | **~25,000/mo** |
| **P3 Authority + content scale** | M7–M12 | Decemberistan report, listicle scale, link velocity, head-term entry | **~150,000/mo** |
| **P4 Head-terms + moat + informational scale** | M13–M18 | Mehndi/dress gallery mass, comparison moat, DA-30 push | **~320,000/mo** |
| **P5 Category leadership + 1M push** | M19–M24 | Full universe coverage, brand demand, refresh/defend | **~500,000/mo (1M ceiling architected)** |

---

## 2. P0 — Foundation (M1)

**Primary focus:** replace directional Ubersuggest data with Google truth; lock the technical floor before scaling pages.

| Item | Detail |
|---|---|
| Deliverables | Connect **GSC + GA4 + Bing Webmaster** (`GSC-GA4-SETUP.md`); submit all 4 sitemap shards; baseline indexation + impressions; full schema audit; `noindex` sweep on thin/empty programmatic combos; CWV baseline; IndexNow wired. ~0 net-new pages — fix, don't add. |
| MCPs | **gsc / ga4 / bing-webmaster** (step zero), **siteaudit / seo-audit / lighthouse / pagespeed / crux** (technical baseline), **schema-org** (validate JSON-LD), **indexnow** (submit), **ubersuggest** (`site_audit`, `validate_site`). |
| **Exit gate** | GSC verified + receiving impressions; ≥90% of existing money pages indexed; CWV green on templates; baseline KPI snapshot recorded. **If GSC not connected by end-M1 → halt all content spend until it is** (you are flying blind otherwise). |

---

## 3. P1 — Quick-wins + flywheel (M2–M3) → Base ~4,000/mo

The fastest ROI lives in the bridal-dress *occasion* cluster (~52% of scored volume at SD ≤ 20) and the vendor-name navigational flywheel that shadiyana proves works.

### M2 — Bridal-dress quick wins + GBP
- **Deliverables:** publish ~12 bridal-dress occasion pages targeting the SD≤12 set — "walima dress for bride" (6,600/SD7), "bridal dresses for barat" (4,400/SD8), "nikkah dresses for bride" (3,600/SD8), "mehndi dress for bride" (4,400/SD9), "pakistani wedding dress for bride" (8,100/SD12); deepen ~150 vendor profile pages (unique data, photos, PKR ranges); Google Business Profile live + first 10 citations (`05` §3). Links target: **+10 referring domains**.
- **MCPs:** **ubersuggest** (`keyword_metrics`/`match_keywords` to enrich the long tail beyond the ~19-row floor), **serper** (live SERP for each target), **schema-org** (Product/FAQ), **firecrawl** (competitor profile teardown), **indexnow**.
- **Exit gate:** first Tier-A keywords entering page 2–3; first GSC clicks; ~25 referring domains cumulative.

### M3 — "Best {vendor} in {city}" listicle sprint
- **Deliverables:** publish the **24 "Best {vendor} in {city} 2026"** listicles (6 core vendors × 4 Tier-1 cities) — **only city×vendor cells with ≥3 vendors (per `04` thresholds); backfill the rest as inventory grows** — answer-first, ItemList + FAQPage schema, PKR ranges, comparison tables (the GEO/AI-citation weapon); ship the cost pillar + budget calculator push. Cumulative ~**400 indexed pages**.
- **MCPs:** **serper / exa** (SERP + entity research), **schema-org**, **g-search**, **ubersuggest** (`serp_analysis`, `content_ideas`), **indexnow**.
- **Exit gate (quarter):** **~4,000 visitors/mo**, ~25 referring domains, first page-1 rankings on Tier-A bridal-dress terms, DA ~6. **If <2,000/mo by M3 → audit indexation (crawl budget) before adding pages.**

---

## 4. P2 — Category + geo depth (M4–M6) → Base ~25,000/mo

Attack shadiyana's weak surface: non-venue categories, Tier-2 cities, Urdu, and PK event pages.

### M4 — Tier-2 city rollout
- **Deliverables:** activate Tier-2 cities (Faisalabad, Multan, Sialkot, Gujranwala, Peshawar) across the 11 vendor types where inventory exists; ~120 new `{vendor}×{city}` + profile pages; expand bridal-dress cluster (gharara 6,600/SD20, nikkah dresses 6,600/SD21). Links: **+15 RDs**.
- **MCPs:** **ubersuggest** (`keyword_suggestions` + enrichment per city), **serper**, **gsc** (mine Search Analytics for emerging queries to prioritise), **indexnow**.
- **Exit gate:** Tier-2 pages indexed and impressing; ~60 RDs cumulative.

### M5 — Under-served categories + event pages
- **Deliverables:** deepen photographers/makeup/catering/mehndi/decor (where shadiyana is thin); publish PK event pages (mayun, dholki, barat, walima, nikkah, rukhsati) as informational→money internal-link hubs; launch venue navigational pages (marquee/banquet names, e.g. "marriage hall near me" 4,400). ~150 new pages.
- **MCPs:** **reddit / tavily** (real PK couple language for event pages), **serper**, **schema-org** (Event/LocalBusiness), **firecrawl**.
- **Exit gate:** multiple #1–3 on Tier-A/B; event pages feeding internal link equity.

### M6 — Urdu layer + real-wedding PR start
- **Deliverables:** expand **ur-PK** hreflang coverage on top money pages (already scaffolded); first real-wedding features that credit vendors (link-bait, `05` §5b); cumulative ~**900 indexed pages**. Links: **+20 RDs → ~60 total**.
- **MCPs:** **gsc** (quarterly re-forecast vs model), **ahrefs/semrush** optional RD check, **ubersuggest** (`backlinks_overview`), **schema-org**, **bing-webmaster**.
- **Exit gate (quarter):** **~25,000 visitors/mo**, ~60 RDs, DA ~11 (secondary, directional), multiple top-3 commercial terms. **If <12,000/mo by M6 → pivot budget from new pages to link-building (RD growth is the gate, per `01` §4.2; DA is a secondary directional signal); if informational CTR is far below model, down-revise the Aggressive line, not the plan.**

---

## 5. P3 — Authority + content scale (M7–M12) → Base ~150,000/mo

This is where DA must climb from ~11 to ~20 and content velocity ramps toward the 8k-page trajectory. Decemberistan (Oct–Feb) is the seasonal demand spike to ride.

### M7 — Listicle scale-out
- **Deliverables:** extend "Best {vendor} in {city}" to all 12 cities × core vendors (~80+ listicles total); begin systematic mehndi gallery pilot (10 posts, e.g. "back hand design mehndi" 33,100/SD14 — the best low-diff informational win). ~250 new pages.
- **MCPs:** **serper / exa**, **schema-org**, **ubersuggest** (`estimate_serp_clicks`), **firecrawl**, **indexnow**.
- **Exit gate:** listicles ranking + AI-cited; mehndi pilot indexed.

### M8 — Cost/budget pillar expansion + HARO
- **Deliverables:** city-level cost variants ("{vendor} cost {city}", "wedding cost in pakistan") — the most-linkable, snippet-prone format; start HARO/journalist reactive outreach (`05` §7). ~150 pages. Links: **+25 RDs**.
- **MCPs:** **tavily / exa** (journalist queries), **serper**, **schema-org** (FAQ/HowTo), **gsc**.
- **Exit gate:** featured snippets captured on cost terms; ~120 RDs cumulative.

### M9 — Mehndi/informational scale begins
- **Deliverables:** scale mehndi cluster (by body-part/style/occasion/year) to ~60 galleries with image-SEO discipline (alt text, image sitemap already shipped); guest content + photographer partnerships (`05` §6). Cumulative ~**1,600 pages**.
- **MCPs:** **ubersuggest** (enrich mehndi long-tail — it's a FLOOR until enriched), **serper**, **firecrawl**, **schema-org** (ImageObject), **indexnow**.
- **Exit gate (quarter):** **~70,000 visitors/mo**, ~120 RDs, DA ~16 (secondary, directional). **If informational galleries aren't earning blue-link clicks (Pinterest/Images dominance, `01` §4.2), treat them as assist-only and reweight effort to commercial pages.**

### M10–M11 — Decemberistan report + peak season
- **Deliverables:** publish the annual **"Pakistan Wedding Season Report"** (hero link-magnet, `05` §5a) — original PK data for PR pickup; ride Decemberistan demand with seasonal landing pages and refreshed listicles; comparison pages (`/compare`) begin. ~300 pages over the two months. Links: **+50 RDs across the report push**.
- **MCPs:** **ga4 / ga** (own booking data for the report), **tavily / exa / reddit** (PR targets), **serper**, **schema-org** (Dataset/Article), **firecrawl**.
- **Exit gate:** report earns 20+ RDs; peak-season traffic spike captured.

### M12 — Head-term entry + Year-1 audit
- **Deliverables:** begin contested head terms now that DA supports it ("pakistani bridal dresses" 8,100/SD20, "bridal gown dress" 14,800/SD20); full Year-1 technical re-audit; cumulative ~**2,300 pages**. Links: **~180 RDs total**.
- **MCPs:** **gsc / ga4** (annual re-forecast), **siteaudit / lighthouse / crux**, **ubersuggest** (`domain_overview`), **schema-org**, **bing-webmaster**.
- **Exit gate (quarter):** **~150,000 visitors/mo** (surpasses shadiyana's ~66k by ~2.3×), ~180 RDs, DA ~20 (secondary, directional). **If RD growth stalls <150 → links become the #1 priority for H2; the model caps near Base-low otherwise (DA <15 is a corroborating signal, not the gate).**

---

## 6. P4 — Head-terms + moat + informational scale (M13–M18) → Base ~320,000/mo

### M13–M14 — Informational gallery mass
- **Deliverables:** scale mehndi + dress-idea + decor-idea + hairstyle galleries toward several hundred (the volume mass that makes 1M arithmetically conceivable); systematic internal-link from galleries → money pages. ~600 pages. Links: **+40 RDs**.
- **MCPs:** **ubersuggest** (`keyword_metrics` mass-enrichment), **serper**, **firecrawl**, **schema-org**, **indexnow**.
- **Exit gate:** gallery cluster indexed at scale; index bloat controlled (noindex thin).

### M15–M16 — Comparison moat + vendor reciprocity engine
- **Deliverables:** build out comparison/alternatives pages as a defensible moat; formalise the vendor-reciprocity link engine (`05` §4) as a permanent function (scalable RDs); refresh all M1–M6 pages. ~500 pages. Links: **+60 RDs**.
- **MCPs:** **serper / exa**, **gsc** (decay detection), **schema-org**, **ahrefs/semrush** optional gap check.
- **Exit gate:** ~280 RDs cumulative; refreshed pages regaining/holding position.

### M17–M18 — DA-30 push + Decemberistan #2
- **Deliverables:** second annual Wedding Season Report (now with a year of authority behind it → bigger pickup); styled-shoot/trend pitches to wedding media (`05` §5c); cumulative ~**3,200 pages**. Links: **~280 → on track for 450**.
- **MCPs:** **ga4** (report data), **tavily / exa / reddit**, **serper**, **schema-org**, **indexnow**.
- **Exit gate (quarter):** **~320,000 visitors/mo**, ~280 RDs, DA ~25 (secondary, directional), avg commercial position 8–12. **If RD growth plateaus <250 → escalate digital PR; referring-domain growth is the single hardest variable and the binding gate (`01` §4.1); DA tracks it only directionally.**

---

## 7. P5 — Category leadership + 1M push (M19–M24) → Base ~500,000/mo

Final phase: complete universe coverage, convert authority into head-term dominance, and build brand/direct-nav demand. The 1M ceiling is *architected* here — captured only if links, velocity, and image-SERP capture all break our way (`01` §4).

### M19–M20 — Full universe coverage
- **Deliverables:** close remaining `{vendor}×{city}` + long-tail gaps; complete mehndi/dress/decor informational universe; full Urdu parity on commercial pages. ~700 pages. Links: **+50 RDs**.
- **MCPs:** **ubersuggest** (final long-tail enrichment), **gsc** (query-gap mining), **serper**, **schema-org**, **indexnow**.
- **Exit gate:** ~480 RDs; category breadth matching/exceeding shadiyana across all verticals.

### M21–M22 — Head-term dominance + brand demand
- **Deliverables:** push contested head terms to top-3 on the strength of DA ~30+; brand campaigns to grow "weddingwala" direct-nav (the ~5% high-value slice, `01` §3); systematic content refresh of all pillars. ~500 pages. Links: **+60 RDs**.
- **MCPs:** **gsc / ga4** (brand-query tracking), **google-trends** (brand demand), **serper**, **schema-org**.
- **Exit gate:** brand search rising; head terms in top-3; ~540 RDs.

### M23 — Decemberistan #3 + defend
- **Deliverables:** third Wedding Season Report; defend/refresh every winning page ahead of peak; squeeze conversion on the ~400k commercial slice (listicles + money + cost + brand) — leads are the north star. ~300 pages.
- **MCPs:** **ga4** (lead funnel), **gsc** (decay), **tavily/exa** (PR), **lighthouse/crux** (CWV defense), **schema-org**.
- **Exit gate:** peak captured; commercial-slice leads up QoQ.

### M24 — Year-2 close + re-forecast
- **Deliverables:** cumulative ~**4,000 quality-indexed pages**; full technical + content audit; Year-3 plan seeded; honest model re-forecast vs actuals. Links: **~350 RDs total**.
- **MCPs:** **gsc / ga4 / bing-webmaster** (final truth), **siteaudit / lighthouse / crux**, **ubersuggest** (`domain_overview`), **schema-org**.
- **Exit gate (quarter / endgame):** **Base ~500,000 visitors/mo** (~200k of it commercially valuable), ~350 RDs, DA ~28, avg commercial position 7–11. **Aggressive ceiling = 1M @ ~8,000 pages / DA 35+ / 600+ RDs** — report it only beside the lead number, never alone.

---

## 8. Quarterly milestone summary (Base scenario, plan-of-record — directional, re-forecast quarterly once GSC connected)

> Visitor figures below are **modeled milestones, not commitments** — they are directional until GSC is connected (M0) and must be re-forecast each quarter against real GA4/GSC data.

| Quarter | Month | Pages | Ref. domains | DA (secondary) | **Visitors/mo (modeled, directional)** | Headline gate |
|---|---|---|---|---|---|---|
| Q1 | M3 | ~400 | ~25 | ~6 | **4,000** | Tier-A page-1; GSC live |
| Q2 | M6 | ~900 | ~60 | ~11 | **25,000** | Multiple top-3; pivot to links if <12k |
| Q3 | M9 | ~1,600 | ~120 | ~16 | **70,000** | Mehndi scale; informational CTR validated |
| Q4 | M12 | ~2,300 | ~180 | ~20 | **150,000** | Beat shadiyana; RD gate at 150 (DA ~15 directional) |
| Q6 | M18 | ~3,200 | ~280 | ~25 | **320,000** | Comparison moat; PR escalation if RDs <250 |
| Q8 | M24 | ~4,000 | ~350 | ~28 | **500,000** | Category leadership; 1M only as architected ceiling |

---

## 9. Standing decision-gates (apply every quarter)

1. **No GSC, no scale** — if real Google data isn't flowing, stop adding pages and fix that first (`01` §4.1).
2. **RD gating** — if referring-domain growth falls behind the curve in `05` §2, reallocate from new pages to link-building; commercial positions don't materialise without authority. (DA is a secondary, directional check on the same trend — never the trigger.)
3. **Informational reality check** — if mehndi/dress gallery blue-link CTR is far below the 1–4% model assumption (Pinterest/Images carousels), down-revise the Aggressive line and treat galleries as assist-only — do **not** defend the 1M number against contrary GSC data.
4. **Leads over vanity** — if forced to choose, fund the ~400k commercial slice (listicles + money + cost + brand) over raw informational volume. Re-forecast the whole model against actuals every quarter.

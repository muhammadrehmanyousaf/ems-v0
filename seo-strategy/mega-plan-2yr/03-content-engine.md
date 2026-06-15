# 03 — The Content Production Engine

> Purpose: define the content system — types, velocity, quality bar, and ops workflow — that produces the page volume and depth Wedding Wala needs to architect toward 1M organic visitors/mo over 24 months, without tipping into thin-content penalties.

This file is the production layer. It assumes the keyword universe and page targets from `02-keyword-universe.md` and the programmatic templates in `04-programmatic-architecture.md`, and it deepens §6 of the existing `../SEO-MASTER-PLAN.md` rather than restating it.

## 1. The honest framing of "content for 1M"

1M/mo is a stretch ceiling, not a forecast. The PK wedding search universe is realistically several million searches/mo, so 1M would mean capturing ~20–30% of it — which requires category leadership, DA ~35+, and thousands of indexed pages. The engine below is built to make that *possible* under the aggressive scenario; the base and conservative scenarios (in `01-traffic-model-to-1M.md`) land far lower and are equally valid.

Critically, most of any 1M is **low-value informational traffic** — "mehndi design" alone is ~673,000/mo (de-duped mehndi head ~1.1M/mo, broad universe plausibly 1.5–3M when enriched). That traffic builds DA, internal-link equity, and AI-citation surface, but it does **not** book weddings. Bookings come from a smaller commercial subset (bridal-dress occasion terms, venue names, {vendor}×{city}). The engine therefore deliberately runs two tracks at different quality/cost tiers and links the cheap-volume track *into* the expensive-conversion track.

## 2. Content types and their role

| Type | Funnel role | Primary KPI | Cost/page | Scale method |
|---|---|---|---|---|
| Informational image galleries | Top-of-funnel volume (Pinterest/Images intent) | Sessions, image impressions | Low | Programmatic + curation |
| "Best {vendor} in {city} 2026" listicles | GEO / AI-citation + mid-funnel conversion | AI citations, CTR to profiles | Medium | Templated + editorial intro |
| Cost / budget pillars | Link magnets (build the DA we lack) | Referring domains, featured snippets | High | Hand-written, data-backed |
| Money pages ({vendor}×{city}, detail) | Bookings / leads | Lead form submits, calls | Medium | Programmatic + inventory |
| Vendor profiles | Navigational flywheel (rank for vendor NAMES) | Branded impressions, profile views | Low | Programmatic from backend |

### 2A. Informational image galleries — the volume floor
All keyword volumes and SD scores cited in this section are illustrative; `02-keyword-universe.md` is the canonical source for figures — defer to it on any discrepancy.

The mehndi universe is the single biggest reservoir. Build gallery pages sliced by the dimensions the long tail actually searches: body-part ("back hand design mehndi" 33,100/SD14 — our best low-diff win), style (arabic, indian, minimal, full-hand), occasion (bridal, mayun, dholki, eid), and year ("mehndi design 2026"). Each gallery is a real page with curated, captioned, alt-texted images, a 150–250-word intro, a short "how to choose / how it's done" block, and FAQ schema — never a bare image grid (see §6 thin-content guard). These are the cheapest pages to produce and the most defensible against zero-click loss because they win Google Images. Mirror the model for bridal-dress galleries (gharara, barat, walima, nikkah looks), which double as feeders into commercial dress pages.

### 2B. "Best {vendor} in {city} 2026" listicles — the GEO weapon
This is the highest-priority *new* format (it extends §6B of the master plan). "Best wedding photographers in Lahore 2026" style pages are what AI Overviews, ChatGPT search, and Perplexity quote when users ask "who are the best X in Y" — they are citation-shaped: ranked, named, with rationale. They also outconvert raw {vendor}×{city} grids because they pre-qualify. Each pulls real ranked inventory from the backend, adds a human-written selection methodology, per-vendor blurbs, price-band signals (PKR), and is refreshed annually (2026 → 2027 in the slug/title). Gate behind the existing listicle feature flag and roll out city-by-city as inventory depth justifies it.

### 2C. Cost / budget pillars — the link magnets
We have DA 1 and 0 referring domains; nothing earns links like proprietary cost data. Build deep, citeable pillars — "How much does a wedding cost in Pakistan 2026", "Marquee vs banquet hall cost", "Bridal makeup price in Lahore/Karachi", "Catering per-head cost & the one-dish law" — each with a real (directional, clearly labelled) price range table, a calculator deep-link to `/planning-tools`, and an annual data refresh. These feed the backlink program in `05-authority-linkbuilding.md` (journalists and bloggers cite cost numbers). Several already exist as pillars (`who-pays-for-what`, `how-to-save-money-on-a-wedding`); the job is to *deepen* with PKR data and visuals, not multiply.

### 2D. Money pages — the booking layer
{vendor}×{city} (11 vendor types × 12 cities, auto-filtering empty combos), per-vendor detail pages, and the bridal-dress occasion pages (fastest ROI: "walima dress for bride" 6,600/SD7, "bridal dresses for barat" 4,400/SD8, "pakistani wedding dress for bride" 8,100/SD12 — ~52% of scored bridal-dress volume is SD≤20). Content work here is depth: unique city intros, real vendor counts, price bands, neighbourhood notes (DHA/Bahria/Gulberg), and seasonal copy (Decemberistan demand).

### 2E. Vendor profiles — the navigational flywheel
Shadiyana ranks #1 for individual venue *names* via rich profile pages; that flywheel is replicable and largely free (it rides our backend inventory). Every vendor gets a deep, unique profile (gallery, packages, reviews, AggregateRating + LocalBusiness JSON-LD, map, FAQ). As inventory grows, branded/navigational demand ("blessings marquee" 2,400, "tulip banquet hall" 4,400) becomes thousands of low-competition pages we win by *being the canonical listing*.

## 3. Publishing velocity — 24-month ramp

Velocity is governed by quality gates, not raw output: thin pages get pruned (see §6), so "pages published" only counts pages that clear the bar. Targets are aggressive-scenario; halve them for the base case.

| Phase | Months | Editorial (hand-written) | Programmatic (template) | Cumulative generated/crawlable URLs (incl. noindex) |
|---|---|---|---|---|
| 0 — Foundation | 1–3 | 8–12/mo | activate existing {vendor}×{city} + profiles | ~800–1,500 |
| 1 — Quick wins | 4–9 | 15–20/mo | mehndi/dress galleries + Best-of listicles | ~4,000–8,000 |
| 2 — Scale | 10–18 | 25–35/mo | full gallery matrix + tier-2 cities + Urdu | ~15,000–30,000 |
| 3 — Authority | 19–24 | 30–40/mo | long-tail enrichment + refresh cycle | ~40,000–60,000+ |

> Note: the figures above are GENERATED/CRAWLABLE URL capacity (incl. noindex), not an indexed-page target. The QUALITY-INDEXED ceiling is ~4,000 (Base) / ~8,000 (Aggressive) per `01-traffic-model-to-1M.md`.

**What makes this volume safe rather than spammy:**
- **AI-assisted drafting, human-finished.** AI produces briefs and first drafts; a human edits every page that targets a commercial or YMYL-ish term (cost, legal: nikahnama, court marriage, NADRA). Galleries and profiles are template-generated but every template field is real data, not spun text.
- **The typed-TS / blog pipeline as the staging layer.** `lib/blog/posts.ts` and the 26 typed pillars in `lib/content/pillars/` let us ship structured, schema-ready content with zero CMS overhead today. The `BlogPost`/`BlogBlock` interfaces enforce structure (typed `h2`/`h3`/`ul`/`p` blocks, author, dates, reading time) so quality is structural, not optional.
- **The MDX/CMS migration is the throughput unlock.** The pipeline's own header documents the path: MDX files (`content/blog/<cluster>/<slug>.mdx` via next-mdx-remote) → optional headless CMS (Sanity/Strapi) → backend Posts model. Trigger the MDX migration when editorial output exceeds ~20 hand-written posts/mo (≈ Phase 1→2), because hand-editing a TS array stops scaling around there. CMS migration only if a multi-person editorial team materialises; do it additively (keep typed pillars rendering) per the live-system rule.

## 4. Editorial quality bar & E-E-A-T

Wedding Wala is YMYL-adjacent (people spend lakhs on our recommendations; some content is legal — nikahnama clauses, haq mehr, court marriage, NADRA certificates). The bar:

- **Real author bylines, not just "Editorial".** Today `posts.ts` ships a single `wedding-wala-editorial` author. Expand to named humans with photos, real bios, and `/about/<author>` profile pages (the `BlogAuthor.url` field already exists for `Article.author` JSON-LD). Legal/finance pillars need a credited reviewer ("reviewed by") — ideally a real wedding planner or lawyer for E-E-A-T.
- **First-person experience signals.** "We visited", "vendors told us", real photos from real Pakistani weddings, named venues/cities. This is the *experience* leg of E-E-A-T that AI-spun competitors can't fake.
- **Replace Pexels with real, licensed photography.** Stock dilutes E-E-A-T and looks non-PK. Source real shaadi imagery via vendor partnerships (vendors supply portfolio shots in exchange for profile placement), real-weddings submissions, and commissioned shoots in key cities. Generic stock acceptable only as a temporary placeholder, flagged for replacement. (The `mcp__plugin_remotion-superpowers_Pexels__*` tools are for staging placeholders only — never the final state.)
- **Fact-checking & citations.** Every cost figure labelled directional with a date; legal content cites the statute/NADRA source; "best" claims tied to a stated methodology. Annual `updatedAt` refresh on every evergreen page (the field exists; use it — freshness is a ranking and citation signal).

## 5. Urdu / Roman-Urdu content layer

The site is already en-PK default with ur-PK alt + hreflang. A huge slice of PK search is Roman-Urdu and Urdu-script, and competitors are thin here. Plan:
- **Roman-Urdu first** (highest volume, lowest effort): titles/H1s and key body phrasing that match how people actually type ("shadi hall near me", "mehndi design naya", "barat dress"). Layer onto existing pages as alternate phrasings and FAQs, not duplicate URLs.
- **Urdu-script** for top informational + high-intent pages via the ur-PK locale, with correct `hreflang` pairing (validate with `seo-hreflang`). Translate, don't machine-dump — a native editor reviews. Start with the mehndi galleries and the cost pillars (broadest reach), then top {vendor}×{city} pages. Keep Urdu additive and flag-gated so an untranslated page never ships a broken alt.

## 6. Thin-content & duplicate guard (programmatic)

Programmatic scale is where penalties happen. Hard rules, enforced in template code and CI:
- **Minimum unique substance per page:** the substance thresholds (page-specific word counts + required unique data elements) are owned by `04-programmatic-architecture.md` — apply those numbers as canonical rather than a separate figure here. Empty {vendor}×{city} combos already auto-filter — extend that to *noindex (or don't generate)* any gallery/listicle below the canonical substance threshold.
- **No boilerplate cloning.** City/vendor intros vary by real attributes (neighbourhoods, vendor density, season); never the same paragraph with a token swap. A duplicate-detection check (shingle/cosine over rendered body) in the content-ops pipeline blocks near-duplicates before publish.
- **Index discipline.** Thin tag/filter permutations stay `noindex`; canonical the year-variants (2025→2026) carefully; keep the sitemap shards reflecting only index-worthy URLs. Monitor index bloat in GSC (Pages report) monthly — see `06-technical-geo.md`.
- **Prune, don't hoard.** Pages with zero impressions after ~6 months get improved, merged, or removed. "40,000+ indexed pages" is only an asset if they each earn impressions.

## 7. Content-ops workflow (MCP-driven)

A repeatable loop per content batch, using the connected MCP stack. **Step zero is real data:** wire GSC/GA4/Bing so we draft against actual queries, not just directional Ubersuggest.

1. **Trends & demand** → `google-trends` + `mcp__ubersuggest__keyword_suggestions` then enrich the long tail with `keyword_metrics`/`match_keywords` (free tier only enriches ~19/cluster, so enrichment is mandatory); validate live intent with `serper`/`serp_analysis`.
2. **Gap & SERP shape** → `serper` + `seo-cluster` (SERP-overlap clustering) to confirm page type (gallery vs listicle vs pillar) and what Google rewards; check competitor pages with `firecrawl`.
3. **Brief** → `seo-content-brief` produces per-section word counts, entities, and the schema target. Brief specifies funnel role, internal-link targets (which money pages this feeds), and Urdu/Roman-Urdu variants.
4. **Draft** → AI first draft against the brief → human edit (mandatory for commercial/legal). Real images sourced per §4.
5. **Schema** → `schema-org`/`seo-schema` to generate + validate JSON-LD (Article, FAQPage, ItemList for listicles, ImageObject for galleries, LocalBusiness/AggregateRating for profiles). Must validate clean before publish.
6. **Publish** → add to typed pipeline (`posts.ts`/pillars) today, MDX post-migration; deploy via the existing additive, flag-gated path (zero-downtime).
7. **Index** → `indexnow` for instant submission (+ Bing for Copilot citations); confirm with GSC URL Inspection.
8. **Monitor** → GSC/GA4 for impressions, position, leads; `crux`/`pagespeed` for CWV on new templates; AI-citation tracking (seo-geo / SE Ranking) for the Best-of and pillar layer. Feed losers back into step 4 (refresh) or §6 (prune).

This loop is the recurring heartbeat; the velocity table in §3 is just how many times per month we run it across the two tracks. See `09-measurement-cadence.md` for the dashboards that close it.

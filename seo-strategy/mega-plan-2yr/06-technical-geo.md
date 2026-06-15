# 06 — Technical SEO, Core Web Vitals & GEO (AI Search)

> Purpose: keep tens of thousands of weddingwala.pk pages crawlable, fast on PK mobile, correctly marked up, bilingually annotated, and quotable by AI engines — the infrastructure layer beneath the content and link plays in the sibling files (see `04-programmatic-architecture.md`, `03-content-engine.md`, `05-authority-linkbuilding.md`).

This file is the **machine-trust layer** of the 24-month plan. Content gets us into the index; technical correctness decides whether thousands of programmatic pages actually *rank* — and whether AI Overviews, ChatGPT, Perplexity and Copilot *cite* us. Everything here is **additive, flag-gated, zero-downtime**: we already ship `app/sitemap.ts` (4 logical shards + image sitemap, ISR-hourly), `app/robots.ts` (AI-crawler allowlist), `lib/seo/jsonld.ts` (12 typed JSON-LD builders), and `lib/seo/hreflang.ts` (en-PK / ur-PK / x-default). The work below **hardens and monitors** that surface; it does not rebuild it.

Honest framing: a 1M-visits/mo ceiling implies an index of tens of thousands of useful URLs. At that scale the silent killers are **index bloat, crawl waste, and CWV decay on a 3G-ish PK mobile median** — not content gaps. This file exists so growth doesn't strangle itself.

---

## 1. Indexation at scale — get every *useful* page in, keep junk out

At DA 1 with a fresh domain, Google will crawl conservatively. Our job is to make every crawl count and never waste budget on thin or empty URLs.

### 1.1 The empty-combo discipline (already shipped — protect it)
`buildProgrammaticShard()` already fetches live inventory and **only sitemaps (city × vendor-type) combos with ≥1 real vendor**; zero-vendor combos stay reachable but emit `noindex,follow`. This is the single most important index-bloat guard we have — 12 cities × 11 vendor types = 132 combos, but in tier-2 cities (Quetta, Bahawalpur, Hyderabad) most start empty. **Never** weaken this to "sitemap everything." The same gate guards `/best/[slug]` listicles via `MIN_VENDORS_FOR_LISTICLE`.

### 1.2 Coverage monitoring (which MCP)
- **`gsc` / `gsc-advanced` / `search-console-unified`** — weekly pull of the Index Coverage / Page Indexing report. Watch three buckets and act:
  - *Crawled – currently not indexed* → thin/duplicate; deepen content or consolidate (the empty-combo fix above was built specifically to kill this signal).
  - *Discovered – currently not indexed* → crawl-budget starvation; improve internal links + sitemap freshness.
  - *Duplicate, Google chose different canonical* → check our self-canonical and hreflang reciprocity (§4).
- **`gsc` URL Inspection API** — spot-check 10–20 representative URLs per type after each deploy (one vendor leaf, one city hub, one listicle, one pillar, one blog post, one Urdu page) to confirm indexable + correct canonical.
- **`bing-webmaster`** — parallel coverage report; Bing's index feeds **Microsoft Copilot** citations, so Bing indexation is a GEO dependency, not an afterthought.
- **`siteaudit` / `seo-audit` / `firecrawl`** — monthly full crawl to catch orphan pages, redirect chains, and `noindex` leaks before Google does.

### 1.3 Sitemap shard health
We serve a single `/sitemap.xml` (Next 14.2 caveat noted in the file header) but `robots.ts` advertises the logical shards (`/sitemap/0–3.xml`). Monitoring tasks:
- Confirm each shard stays **< 50k URLs / < 50MB**; the header comment flags re-introducing `generateSitemaps()` when the vendor set approaches the ceiling. At 1M-traffic scale we *will* cross this — pre-build the split now, ship it behind a flag, flip when GSC shows the vendor shard > ~40k.
- **`lastModified` must be real**, not `new Date()` on every build for static rows — vendor/blog/real-wedding rows already use `updatedAt`. Honest freshness signals are a ranking and a GEO input (§5.4). Audit that static hub rows don't falsely claim daily change.
- Validate XML well-formedness post-deploy via **`fetch`/`fetcher`** + **`siteaudit`**; alert if image-sitemap (`buildImagesShard`) drops to zero rows (backend outage symptom).

### 1.4 IndexNow — instant discovery
Use the **`indexnow`** MCP to ping Bing/Yandex (and downstream IndexNow consumers) the moment a page is created or materially updated: new vendor onboarded, new listicle qualifies, new pillar/blog post, price/availability change. Wire a post-revalidate hook so onboarding a Lahore caterer submits its leaf URL within seconds rather than waiting for the hourly ISR + organic crawl. This disproportionately helps a DA-1 site where natural crawl frequency is low.

### 1.5 Crawl-budget hygiene
`robots.ts` already disallows `/api/`, dashboards, auth, and parameterized noise (`?sort=`, `?page=`, `?utm_*`, `?fbclid=`, `?gclid=`). Additional levers as the grid grows:
- Keep faceted/sort URLs `noindex` + canonical-to-base; never let filter permutations become crawlable URLs.
- Internal-link depth ≤ 3 clicks from home to any money page (city hub → vendor-type×city → leaf). Shallow trees spend budget on pages that convert.
- Monitor **crawl stats in `gsc`** (requests/day, avg response time); a rising response time throttles Google's crawl rate — ties directly to §2.

---

## 2. Core Web Vitals & INP — built for the PK mobile median

PK organic is overwhelmingly Android-on-mobile-data. Optimize for a mid-range phone on a congested network, not a desktop on fibre. **INP (Interaction to Next Paint)** is the 2026 pass/fail most at risk on JS-heavy, image-dense vendor galleries.

### 2.1 Field-data monitoring (which MCP)
- **`crux` / `pagespeed-crux`** — the source of truth (real Chrome users). Track the **75th-percentile LCP / INP / CLS** monthly per page *type* (origin-level first, then top URLs once they have field data). Targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 — at p75 on **mobile**.
- **`pagespeed`** (PSI) + **`lighthouse`** — lab diagnostics for pages without field data yet (most of our new programmatic URLs). Run after each template change; lab regressions predict field regressions.
- **`gsc`** Core Web Vitals report — groups URLs by status; our north-star "good URLs" count.
- **`chrome-devtools`** — INP attribution / long-task tracing on the worst offenders (vendor detail galleries, search/filter).

### 2.2 Concrete Next.js 14 levers (additive)
| Lever | Implementation | Vital it moves |
|---|---|---|
| Image optimization | `next/image` everywhere; serve AVIF/WebP; explicit `width`/`height` or `fill` + aspect-ratio box; `sizes` tuned for mobile | LCP, CLS |
| Above-the-fold priority | `priority` on the LCP image only (hero / first gallery shot); lazy-load the rest | LCP |
| ISR | Programmatic + vendor pages already ISR (`revalidate: 3600`) → served from cache, fast TTFB without per-request backend hits | LCP, TTFB |
| Lazy-load below-fold | `next/dynamic` (`ssr:false` where safe) for maps, carousels, review widgets, related-vendor rails | INP, TBT |
| Font discipline | `next/font` (self-host, `display: swap`, subset Latin + Arabic for Urdu) | LCP, CLS |
| JS diet | Audit client bundles; keep interactive islands small; defer third-party (analytics, chat) | INP |
| Reserve space | Fixed dimensions for ad/embed/image slots; skeletons that match final layout | CLS |

### 2.3 Image weight is the PK-specific battleground
Vendor and real-wedding galleries (mehndi, barat, walima shoots) are gorgeous and *heavy*. Enforce a per-image budget, generate responsive `srcset` variants, and keep the image sitemap (`buildImagesShard`) populated so the same assets earn Google Images / Pinterest traffic — a real channel for "mehndi design"-class informational demand (head ~1.1M/mo, broad universe plausibly 1.5–3M/mo). Monitor regressions with **`lighthouse`** (Largest Contentful Paint element = image checks) and **`siteaudit`** (oversized-image flags).

---

## 3. Schema coverage per page type (validate via `schema-org` MCP)

We already emit 12 typed JSON-LD builders from `lib/seo/jsonld.ts` (Organization, WebSite, BreadcrumbList, Article, FAQPage, HowTo, vendor/venue LocalBusiness, Review, Service, CollectionPage, plus `combineGraph()` to nest them). The mandate is **per-type coverage + continuous validation**, not new schema for its own sake.

| Page type | Required schema | Builder |
|---|---|---|
| Vendor detail (leaf) | LocalBusiness + AggregateRating + Review + Breadcrumb | `vendorLD` / `venueLD` + `reviewLD` |
| Vendor-type × city | CollectionPage/ItemList + Breadcrumb | `collectionPageLD` |
| `/best/[slug]` listicle | **ItemList** (ranked) + Breadcrumb | extend `collectionPageLD` → ranked `ItemList` |
| Pillars / cost guides | Article + FAQPage + (HowTo where stepwise) | `articleLD` + `faqLD` + `howToLD` |
| Blog post | Article + Breadcrumb (+ FAQ if Q&A present) | `articleLD` + `faqLD` |
| Glossary term | DefinedTerm / Article + Breadcrumb | extend `articleLD` |
| Every page | Organization + WebSite (sitewide) + Breadcrumb | `organizationLD` + `webSiteLD` |

Rules:
- **AggregateRating must reflect real review counts** — never synthesize ratings. Honesty rule applies to markup, not just copy; fabricated `reviewCount` is a manual-action risk.
- **FAQPage only where visible FAQ content exists** on the page (Google's policy) — and FAQ schema is our single biggest GEO lever (§5).
- Validate **every template** with the **`schema-org` MCP (14 tools)** on each change, and spot-check live URLs in **`gsc`** Rich Results / Enhancement reports. CI step: generate → validate → fail build on schema error.
- ItemList for listicles is the highest-ROI *new* schema work — it's what wins ranked "best X in Lahore" rich results and feeds AI list answers.

---

## 4. Hreflang & Urdu (en-PK / ur-PK) correctness

`lib/seo/hreflang.ts` already emits `en-PK`, `ur-PK`, and `x-default` (→ English). Today Urdu is a scaffold (`/ur` single landing in the sitemap; full `/ur/` tree pending translations — see `03-url-conventions-LOCKED.md §L7`). Correctness rules as the tree fills out:

- **Reciprocity**: every `en-PK` URL that declares a `ur-PK` alternate must have the Urdu URL declare the English back. One-way hreflang is silently ignored.
- **x-default → English** (already the convention) for the international/ambiguous bucket; PK-region targeting stays via the `-PK` locale, not geo-folders.
- **Self-reference**: each page lists *itself* among its alternates.
- **Only sitemap Urdu URLs that actually exist and are translated** — don't emit `ur-PK` alternates pointing at untranslated/auto-translated pages (thin-content + duplicate risk). Gate the Urdu sitemap rows behind a "translation complete" flag.
- Validate with the **`seo-hreflang` skill** and **`gsc`** International Targeting; crawl reciprocity with **`siteaudit`/`firecrawl`**. Urdu is a genuine moat vs shadiyana (English-only) — but only if implemented cleanly; broken hreflang is worse than none.

---

## 5. GEO — getting cited by AI Overviews, ChatGPT, Perplexity, Copilot

AI engines increasingly intermediate wedding research ("best wedding photographer in Lahore under 1 lakh", "walima vs barat dress difference"). Being the *cited source* compounds brand demand the way shadiyana's venue-name navigational flywheel does. We already lead on the access layer (`robots.ts` allowlists GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, Bingbot/Copilot, Applebot, CCBot, Meta, Cohere, etc.). The content/structure layer:

### 5.1 Answer-first copy
Lead each money/info page with a 40–60 word **direct answer** (the question restated + the answer + a number/PKR figure), then expand. AI extractors and AI Overviews quote the first self-contained passage. Example: "A wedding photographer in Lahore costs roughly PKR 80,000–350,000 depending on coverage (barat-only vs full mehndi-barat-walima) and whether cinematography is included." This also wins featured snippets in classic search.

### 5.2 Comparison tables & FAQ schema
Structured, scannable blocks (vendor-vs-vendor, package tables, "barat vs walima vs mehndi dress" tables) are over-represented in AI citations. Pair every key page with a **visible FAQ + FAQPage schema** (`faqLD`) answering the real long-tail (mehndi/dholki/mayun/nikkah/rukhsati specifics, PKR ranges, Decemberistan-season booking lead times). FAQ schema is the cheapest, highest-yield GEO + rich-result lever we have.

### 5.3 `llms.txt`
Ship a root `/llms.txt` (additive static route) — a curated map of our highest-value, most-quotable pages (cost guides, vendor-type hubs, city hubs, glossary) with one-line descriptions, so LLMs can find and prefer our canonical answers. Complements (does not replace) the existing AI allowlist in `robots.ts`.

### 5.4 Freshness
AI engines and Google both privilege recency for commercial wedding queries (prices, trends, season). Keep `dateModified` honest in Article schema and `lastModified` in the sitemap; refresh cost figures and "for 2026/2027" framing on a schedule. Stale prices get dropped from AI answers.

### 5.5 Third-party brand mentions
LLM citation likelihood rises with corroborating off-site mentions (the link/PR program in `05-authority-linkbuilding.md`): reviews, listicles, local press, Reddit/forum threads. Even unlinked brand mentions feed AI association. Coordinate this with PR.

### 5.6 GEO monitoring (which MCP)
- **`serper` / `g-search`** — query target prompts, log whether an AI Overview appears and whether we're cited.
- **`reddit` / `tavily` / `exa`** — track brand mentions and where AI engines source PK-wedding answers.
- **`bing-webmaster`** — Bing index health = Copilot citation eligibility.
- **`fetcher`/`playwright`** — periodically test live AI surfaces for "weddingwala" presence on our priority prompts; record share-of-citation as a KPI alongside organic traffic.

---

## 6. Cadence & ownership

| Frequency | Task | Primary MCP |
|---|---|---|
| Per deploy | Schema validate (CI), URL-inspect samples, Lighthouse on changed templates, IndexNow ping new/changed URLs | `schema-org`, `gsc`, `lighthouse`, `indexnow` |
| Weekly | GSC + Bing coverage triage, sitemap freshness/size check, CWV field glance | `gsc`, `bing-webmaster`, `crux` |
| Monthly | Full crawl (orphans, redirects, noindex leaks, oversized images), CWV p75 by type, hreflang reciprocity, AI-citation share | `firecrawl`/`siteaudit`, `crux`/`pagespeed`, `seo-hreflang`, `serper` |
| Quarterly | Sitemap-shard split readiness, crawl-budget audit, schema-coverage gap review vs new page types | `gsc`, `siteaudit`, `schema-org` |

**Guardrail recap:** every item is additive, backward-compatible, flag-gated, and verified before flip. The fastest way to lose the traffic we build is a technical regression that quietly de-indexes a shard or tanks INP across the grid — which is exactly why monitoring, not just shipping, is half of this file.

# 07 — The MCP Operating Manual

*Purpose: the day-to-day playbook for running this entire 24-month plan on the 35-server MCP stack — which server does which job, the credential boot sequence, the daily/weekly/monthly/quarterly cadences as runnable checklists, and the quota discipline that keeps a free-tier toolchain honest.*

> The strategy lives in `01-traffic-model-to-1M.md` (the scenario math), `02-keyword-universe.md` (demand atlas), `04-programmatic-architecture.md` (supply at scale), and `05-authority-linkbuilding.md` (the moat). **This file is the engine room** — how the operator (available 24/7) and the assistant actually *execute* those plans with tools. The mandate from the operator was blunt: "use them 100%." Below is how.

---

## 1. Tool-to-Job Map (the master routing table)

Every recurring job in this plan routes to a primary MCP plus a fallback. Use the primary first; fall back only on quota exhaustion, auth failure, or to cross-check a suspicious number. **Rule of one source of truth:** once GSC/GA4 are connected, *they* are truth for our own site — Ubersuggest/serper become directional context only.

| Job to be done | Primary MCP → tool(s) | Fallback / cross-check |
|---|---|---|
| **Own search performance** (clicks, impressions, CTR, position, query mining) | `gsc` / `search-console-unified` → search-analytics; `gsc-advanced` for page×query | `ga4` (organic sessions, conversions), `bing-webmaster` |
| **Own indexation status** | `gsc` → URL inspection; sitemap status | `bing-webmaster` index coverage |
| **Demand research** (volume, difficulty, SERP features) | `ubersuggest` → `keyword_overview`, `keyword_metrics`, `keyword_suggestions`, `match_keywords` | `google-trends` (seasonality/Decemberistan), `serper` (live SERP truth) |
| **Long-tail enrichment** (turning the floor into the universe) | `ubersuggest` → `match_keywords` + `keyword_metrics` (batch the leaked-out long tail); `gsc` query export | `google_suggestions`, `serper` autocomplete |
| **Live rank / SERP position checks** | `serper` (Google PK, locId 2586) | `g-search`, `one-search`, `duckduckgo` |
| **SERP-feature & intent classification** | `ubersuggest` → `serp_analysis`; `serper` raw SERP | `seo-sxo` skill (page-type mismatch) |
| **Competitor profiling** (shadiyana.pk et al.) | `ubersuggest` → `domain_overview`, `domain_keywords`, `domain_top_pages`, `competitors` | `serper`, `exa` (find similar) |
| **Competitor page crawling** (steal venue-profile structure) | `firecrawl` (JS-rendered, site map) | `fetcher`, `fetch`, `playwright`/`puppeteer` for hard JS |
| **Backlink / authority research** | `ubersuggest` → `backlinks`, `backlinks_overview`, `linking_domains`, `anchor_texts`, `backlink_opportunity` | `bing-webmaster` inbound links; ahrefs/semrush if licensed |
| **Technical health / Core Web Vitals (lab)** | `lighthouse`, `pagespeed` | `ubersuggest` → `pagespeed_audit` |
| **Core Web Vitals (field data, real INP/LCP/CLS)** | `crux`, `pagespeed-crux` | `gsc` CWV report |
| **Full-site crawl / broken links / index bloat** | `siteaudit`, `seo-audit`; `ubersuggest` → `site_audit` | `firecrawl` map + `seo-firecrawl` skill |
| **Schema / JSON-LD validate + generate** | `schema-org` (14 tools) | `seo-schema` skill |
| **Instant indexing on publish** | `indexnow` (submit URL set) | `gsc` Indexing API; `bing-webmaster` submit |
| **Content / topic research** | `tavily`, `exa` (semantic), `reddit` (PK bride pain points), `wikipedia` (entity grounding) | `serper` "People Also Ask", `ubersuggest` → `content_ideas` |
| **Visual QA of shipped pages** | `playwright` / `puppeteer` (headless CDP, device emulation) | `chrome-devtools` |
| **Trend / seasonality calendar** | `google-trends` | `reddit`, `serper` News |

Cross-reference the skill layer too: `seo-google` wraps GSC/PSI/CrUX/Indexing API; `seo-bing` wraps Bing + IndexNow; `seo-backlinks`/`seo-ahrefs` for link gap; `seo-cluster` for SERP-overlap clustering feeding `02-keyword-universe.md`; `seo-programmatic` for the `04` page engine; `seo-drift` to baseline on-page SEO before/after each deploy (critical on a live site — see `feedback_live_system_safety`).

---

## 2. STEP ZERO — Credential Boot Sequence (do this before anything else)

We are flying blind until our own data is wired. Ubersuggest's PK free tier leaks US data and undercounts the long tail; every number in `01`/`02` is labelled *directional* for exactly this reason. The single highest-ROI action this week is connecting Google's truth. Follow `GSC-GA4-SETUP.md` and execute in this order:

| Order | Connect | Why it's the priority it is | Unlocks |
|---|---|---|---|
| **0a** | **GSC** (service-account JSON; verify property `https://www.weddingwala.pk`) | The only source of *our* real queries, positions, impressions, CTR — replaces directional Ubersuggest data and powers weekly rank tracking & monthly query mining | Real keyword universe, indexation truth, CWV report |
| **0b** | **GA4** (property + Measurement/API access) | Ties traffic to *behaviour* — which of the 1M is bookings/leads vs vanity informational (the honesty rule in `01`) | Conversion attribution, landing-page value, engaged sessions |
| **0c** | **Bing Webmaster** | Bing index feeds **Microsoft Copilot citations**; also a second free backlink dataset and second IndexNow channel | Copilot/AI visibility, free inbound-link data, redundancy |

Verify each with a single read before trusting it: `gsc` list-sites, `ga4` run a 7-day organic-sessions report, `bing-webmaster` site list. **Do not begin weekly cadences until 0a and 0b return live data.** Until then, mark every KPI in reports as "(directional — pre-GSC)".

---

## 3. Operating Cadences (runnable checklists)

The operator is 24/7; the assistant drives the tools. These are checklists, not prose — run them top to bottom and log results into the monthly KPI sheet.

### DAILY — index & rank pulse (~10 min, low quota)
- [ ] **New URLs published yesterday?** → `indexnow` submit the URL set; mirror via `gsc` Indexing API and `bing-webmaster` submit.
- [ ] **Index check** on the 3–5 newest priority URLs → `gsc` URL inspection (indexed? canonical correct? mobile usable?).
- [ ] **Money-keyword pulse** — spot-check 5 rotating commercial terms live → `serper` (PK, locId 2586): e.g. `walima dress for bride`, `marriage hall near me`, `pakistani bridal dresses`, plus one `{vendor}×{city}` and one venue-name navigational term.
- [ ] **Deploy guard** — if a deploy shipped, run `seo-drift` diff on touched templates to confirm titles/canonicals/hreflang/JSON-LD didn't regress (live-prod safety, `05` depends on these pages ranking).
- [ ] Log anomalies (sudden position drop, deindex) → escalate to weekly technical scan.

### WEEKLY — rank, mining, technical, competitor (~60–90 min)
- [ ] **Rank tracking** → `gsc` Search Analytics, last 7d vs prior 7d: top movers up/down by query and by page. Annotate causes.
- [ ] **New-keyword mining** → pull `gsc` queries at positions 5–20 with impressions but low CTR (these are "almost there" — the fastest wins). Feed candidates into `ubersuggest` `keyword_metrics` to score, route to `02-keyword-universe.md` backlog.
- [ ] **Long-tail enrichment batch** → take one cluster (e.g. mehndi-by-body-part, bridal-dress-by-occasion) → `ubersuggest` `match_keywords` + `keyword_metrics` to convert the ~19-enriched floor into a fuller list. (Respect the 3-report/day cap — see §4.)
- [ ] **Technical scan** → `lighthouse` + `pagespeed-crux` on the 5 highest-traffic templates (home, one `{vendor}×{city}`, one venue profile, one mehndi pillar, one bridal-dress page). Flag INP/LCP/CLS regressions.
- [ ] **Competitor watch** → `ubersuggest` `domain_top_pages` on shadiyana.pk (their non-venue gaps are our opening); `firecrawl` one new competitor profile page to study structure; `serper` check who's newly ranking on 3 contested terms.
- [ ] **Content research feed** → `reddit` + `tavily` scan for fresh PK bride questions (dholki, mayun logistics, barat budgets) → content-engine backlog.

### MONTHLY — full audit, gaps, links, KPI report (~half day)
- [ ] **Full site audit** → `siteaudit` / `seo-audit` (or `ubersuggest` `site_audit` → `site_audit_status` → `site_audit_pages`): crawl errors, broken links, duplicate titles, thin/orphan pages, **index-bloat** check on programmatic combos (auto-filtered empties must stay noindexed — see `04`).
- [ ] **Content-gap analysis** → `ubersuggest` `competitors` + `domain_keywords` (shadiyana & 2 others) minus our ranked set = gap list; cluster via `seo-cluster`; prioritize SD≤20 commercial first (bridal-dress occasion wins remain fastest ROI).
- [ ] **Backlink review** → `ubersuggest` `backlinks_overview`, `linking_domains`, `anchor_texts`, `backlink_opportunity`; cross-check `bing-webmaster` inbound. Track RD count vs the DA-35 trajectory in `05`. Watch for toxic/spam anchors.
- [ ] **Schema sweep** → `schema-org` validate JSON-LD on each page type (Organization, LocalBusiness, AggregateRating, Article, FAQPage, BreadcrumbList) — additive only.
- [ ] **AI-visibility check** → does Copilot (`bing-webmaster` index) / `serper` AI Overview cite us for any term? Note GEO progress (`seo-geo`).
- [ ] **KPI REPORT** (truth from `gsc`+`ga4`, never Ubersuggest): organic clicks, impressions, indexed pages, avg position on the priority basket, organic sessions, **leads/bookings conversions**, RD count. Plot against Conservative/Base/Aggressive curves in `01`. Call out honestly how much growth is low-value informational vs commercial.

### QUARTERLY — strategy review & content refresh (~1–2 days)
- [ ] **Scenario re-forecast** → update `01` model with 3 months of real GSC data; is the curve tracking Base or slipping below Conservative? Adjust page-build pace and link targets accordingly.
- [ ] **Content refresh / pruning** → `gsc` find decaying pages (lost clicks QoQ) → refresh, re-date, re-submit via `indexnow`. Identify dead-weight thin pages to consolidate (protects crawl budget; `seo-programmatic`).
- [ ] **Seasonality prep** → `google-trends` map the next quarter (Decemberistan wedding-season surge for venues/photographers/bridal-wear) → pre-build & pre-index inventory 8–10 weeks ahead.
- [ ] **Link campaign reset** → review `05` tactics against actual RD growth; reallocate outreach to what's converting.
- [ ] **Tooling/quota review** → has volume outgrown free Ubersuggest? Decide on a paid upgrade (§4).

---

## 4. Quota Discipline & Paid-Upgrade Triggers

Ubersuggest free tier = **3 domain reports/day** and only ~19 enriched keywords per suggestion call. This is the binding constraint, so spend it deliberately:

- **Budget the 3 daily domain reports** like cash: typically 1 on us, 1 on shadiyana.pk, 1 rotating among tier-2 competitors. Don't burn them on idle curiosity.
- **Enrichment ≠ domain reports** — `keyword_metrics` / `match_keywords` enrich keyword lists and are the workhorses for converting the directional floor into the universe; batch them and cache every result into `02-keyword-universe.md` so you never re-query the same term.
- **GSC has no such cap** — once connected (§2), prefer GSC query/page exports over Ubersuggest for anything about our own site. This alone removes most quota pressure.
- **serper/firecrawl/apify** have validated keys — watch credit burn; cache SERP and crawl snapshots; don't re-crawl unchanged competitor pages weekly (monthly is enough).
- **Cache everything.** Every enriched keyword, SERP snapshot, and competitor crawl is written once to the strategy docs / a data file and reused. Re-querying is the most common quota waste.

**When to pay (and what it unlocks):**

| Trigger | Upgrade | Unlocks |
|---|---|---|
| Long-tail enrichment is bottlenecking the page engine (need thousands of scored kw fast) | **DataForSEO** (`seo-dataforseo`) | Live volume/difficulty/intent at scale, image SERP, programmatic SERP pulls, AI-visibility scraping — best $/keyword for `04` |
| Backlink moat (`05`) needs a real RD/anchor dataset beyond Ubersuggest+Bing | **Ahrefs** (`seo-ahrefs`) or **Semrush** | Full referring-domain history, link-gap vs shadiyana, content explorer |
| AI Share-of-Voice across ChatGPT/Gemini/Perplexity/AI Overviews/AI Mode becomes a KPI | **SE Ranking** (`seo-seranking`) / **Profound** (`seo-profound`) | Multi-engine AI citation tracking in one call |

Until a trigger fires, the free stack (GSC + GA4 + Bing + Ubersuggest free + serper/firecrawl + the technical/schema servers) is **sufficient to run this plan** — paid tools accelerate, they don't gate.

---

## 5. The 24/7 Operating Loop (how operator + assistant split the work)

The operator authenticates servers, approves deploys/outreach, and supplies judgment on PK nuance; the assistant runs the checklists, queries the MCPs, scores keywords, drafts schema, and writes findings back into these strategy files. The contract: **assistant proposes from data, operator disposes; every site change stays additive, flag-gated, and zero-downtime** (`feedback_live_system_safety`). Run DAILY autonomously, surface WEEKLY for review, present MONTHLY/QUARTERLY as decisions. That cadence — real Google data in, prioritized SD≤20 commercial pages out, indexed instantly, measured honestly against `01`'s scenarios — is how the 35-server stack gets used 100%.

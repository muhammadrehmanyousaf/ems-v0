# 12 — The Definitive {service}×{city} Page Blueprint (the "1000× better" money-page & listicle spec)

> **Purpose:** the canonical, copy-this-every-time spec for the commercial money page (`/{vendor-type}/{city}`) and its `/best/{vendor-type}-in-{city}` listicle sibling. Every programmatic money page and every "Best of" listicle MUST conform to the block order, keyword-placement map, and schema graph below. This file supersedes ad-hoc page structures and is the *page-level* companion to the *system-level* siblings.
>
> **Read alongside:** [`04-programmatic-architecture.md`](04-programmatic-architecture.md) (where these pages sit in the URL matrix + thin-page guards + internal-link mesh), [`02-keyword-universe.md`](02-keyword-universe.md) §5A/§5C (the demand + the money-vs-cost split that prevents cannibalization), [`06-technical-geo.md`](06-technical-geo.md) §3/§5 (schema builders in `lib/seo/jsonld.ts` + GEO), [`03-content-engine.md`](03-content-engine.md) §2B/§2D (content tiers), and the worked example [`briefs/wedding-photographers-lahore-brief.md`](briefs/wedding-photographers-lahore-brief.md). Conventions resolve to [`00-README.md`](00-README.md).
>
> **Honesty (non-negotiable, per [00-README.md](00-README.md) rules 1–5):** this blueprint engineers a page to *compete for #1* — it does **not** guarantee #1. Ranking also needs authority/links (the single biggest off-page lever — see [05](05-authority-linkbuilding.md)), a verified **Google Business Profile** (positions 1–3 on `{vendor} {city}` are the local pack), and time. All PKR figures are **indicative/directional** market bands, not Wedding Wala quotes; all ratings/review counts in schema are **real** backend data only — never synthesized (fabricated `reviewCount` is a manual-action risk). Pages stay **inventory-gated**: combos below the vendor threshold render `noindex,follow` and are excluded from the sitemap — we never mass-publish empty city pages (that is scaled-content-abuse / thin-content penalty territory).

---

## 1. Critique of the friend's 11-H2 structure (keep / fix / missing) → our superior order

His doc proposes: H1 "Best [Vendor] in [City] Pakistan"; H2s = Top services · Why hire · What to look for · Average price · How to book · Popular wedding areas · Packages · Reviews & ratings · FAQ · Related vendors.

| His block | Verdict | Why / what we do instead |
|---|---|---|
| H1 "Best [Vendor] in [City] **Pakistan**" | **Fix** | Trailing "Pakistan" is keyword-stuffy and rarely matches real PK queries (`wedding photographers in lahore`, not `…lahore pakistan`). Our H1 = the exact primary phrase, natural. Reserve "best" for the **listicle** sibling (`/best/…`), not the grid money page — that is the cannibalization split (§6). |
| Top services | **Keep, merge** | Useful, but as a thin standalone H2 it's filler. We fold it into the **answer-first lead** + the vendor cards (each card lists specialties). |
| Why hire | **Cut as H2** | Generic "why hire a photographer" is zero-intent fluff that bloats word count without earning a keyword. We replace it with **unique city editorial** (real neighborhoods, season, venue character) — the actual uniqueness signal that beats a token-swap competitor. |
| What to look for | **Keep, upgrade** | Good instinct. We make it a concrete **"X things to check before you book"** checklist (scannable, snippet-shaped) — not prose. |
| Average price | **Keep, transform** | A single "average price" is misleading and un-citable. We ship an **indicative PKR price-TIER table** (Budget / Mid / Premium / Luxury, with what each includes) — already built into our template. Tables are over-represented in AI citations. |
| How to book | **Keep, shrink** | One short block; we make it the path to the **lead-capture CTA**, not a tutorial. |
| Popular wedding areas | **Keep** | Genuinely local + good for GBP/near-me relevance. We weave areas into the **city editorial** and image alts (DHA, Gulberg, Johar Town for Lahore). |
| Packages | **Merge into price-tier table** | Redundant with "average price" as two blocks. One tier table does both. |
| Reviews & ratings | **Keep, make real** | Critical — but only with **real reviews + AggregateRating schema** from verified bookings. His generic doc risks fake reviews (penalty). Ours are backend-sourced or omitted. |
| FAQ | **Keep, expand + schema** | Keep, but tie every Q to real PAA/long-tail and mark up with **FAQPage schema** (our single biggest GEO lever). |
| Related vendors | **Keep, formalize** | Good for internal equity. We turn it into the **internal-link bridge mesh** (sibling types in-city, same type nearby cities, up to hubs, *and* the cost/how-to guide). |

**What his structure is entirely MISSING (our net-new blocks):**
1. **Answer-first lead (40–60 words)** for AI Overviews / ChatGPT / Perplexity / Copilot citation + featured snippets — the first self-contained passage with the PKR figure. (His hero is 150–200 generic words; ours leads with the *answer*.)
2. **Real vendor list with per-vendor ratings, PKR price band, specialties, areas served** (ItemList schema) — beats the top PK competitor (`shadiyana.pk` directory list with *no pricing*, thin copy).
3. **"Questions to ask before booking"** (maps to PAA) — distinct from the "things to check" checklist.
4. **Event-by-event notes** (mehndi / barat / walima / mayun / nikkah) — the multi-function Pakistani-wedding reality his generic (part-Indian, part-AI) doc ignores.
5. **Internal-link bridge to the cost/how-to pillar** — the intent split that captures transactional research without cannibalizing the money page (§6).
6. **E-E-A-T trust strip** (verified-vendor badges, real bookings/enquiry count, last-updated date, author/editor byline) — invisible in his doc.
7. **Honest indicative-pricing callout** — labels PKR as directional market bands, not quotes (his "average price" implies false precision).

He also ships flaws we explicitly avoid: a **"12 months = #1" guarantee** (we never promise rank), **Indian competitors** (Shaadidukaan/Shaadiabaat) and **leftover Chinese text** from a generic AI doc, and a **"mass-publish 150–300 cities"** premise that is exactly the thin-content/scaled-abuse trap our inventory-gating prevents.

---

## 2. THE BLUEPRINT — exact content blocks, in order (money page `/{vendor-type}/{city}`)

Block order top-to-bottom. "1000× better" column states the specific edge over the friend's doc and the live PK SERP.

| # | Block | Purpose | What makes ours 1000× better |
|---|---|---|---|
| **B0** | **E-E-A-T trust strip** (above/at fold): "Updated June 2026 · Verified Wedding Wala vendors · N enquiries this month" + breadcrumb | Trust + freshness signal to users, Google, and AI extractors | Competitors show none. Real verified-badge + honest bookings/enquiry count + honest `dateModified` = experience/trust leg of E-E-A-T that AI-spun competitors can't fake. |
| **B1** | **H1** = exact primary keyword (`Wedding Photographers in Lahore`) | One clean topical anchor | Natural phrasing that matches real PK queries; "best/Pakistan" stuffing removed (his H1 fix). One H1, primary only. |
| **B2** | **Answer-first lead (40–60 words)** — restate query + direct answer + PKR figure + the 2–3 price drivers | Win AI Overviews / ChatGPT / Perplexity / Copilot citation **and** featured snippet | The decisive GEO upgrade. "Wedding photographers in Lahore typically charge **PKR 80,000–350,000**, depending on coverage (barat-only vs full mehndi–barat–walima) and whether cinematography is included…" Self-contained first passage = the quotable block. His 150-word hero is not extractable. |
| **B3** | **Unique city editorial (120–180 words)** — neighborhoods (DHA, Gulberg, Johar Town), local venues, peak season (Decemberistan Nov–Feb), guest-count norms, load-shedding/generator note where relevant | Per-page uniqueness floor (kills thin-programmatic penalty) + local relevance + GBP/near-me signal | Generated from `lib/seo/city-editorial.ts` — **no two cities share boilerplate** ([04](04-programmatic-architecture.md) §3). Replaces his zero-intent "why hire" fluff with the actual ranking moat. |
| **B4** | **Vendor list — real cards (≥6)**: name (→ leaf), rating + review count, PKR price band, specialties (traditional/candid/cinematic), areas served, "Get quote" CTA | The commercial core + the ItemList that wins ranked rich results / AI list answers | Top PK competitor's list has **no pricing**; ours has PKR band + rating + specialties per card → ItemList schema → "best X in city" list answers. Each card links to the vendor leaf (the navigational flywheel, [04](04-programmatic-architecture.md) §2). |
| **B5** | **Indicative PKR price-TIER table** — Budget / Mid / Premium / Luxury × what each includes (days, edited photos, cinematic film, album, drone) | Transactional intent + AI/snippet table citation | Already in our template (`formatPriceRange()`). A *tiered* table (not his single "average") with inclusions = citable + honest. **Honesty callout:** "Indicative market bands, not Wedding Wala quotes." |
| **B6** | **"X things to check before you book"** checklist (5–7 items) | Buyer-confidence + scannable snippet bait | Concrete checklist (portfolio consistency, style match, written contract, backup gear, team size, advance %, delivery timeline) vs his vague "what to look for" prose. |
| **B7** | **Questions to ask before booking** (bulleted) | Captures People-Also-Ask; pre-qualifies the lead | Distinct from B6; mirrors real PAA phrasing → improves PAA + voice/AI capture. |
| **B8** | **Photography/service by event** (mehndi · barat · walima · mayun · nikkah) — what changes per function | The multi-function Pakistani-wedding reality | Net-new vs his generic doc; also the long-tail bridge to `/{type}/{city}/{event}` event pages ([04](04-programmatic-architecture.md) §1). 100% PK-specific (no Indian/Chinese leftovers). |
| **B9** | **How to book on Wedding Wala** (3 steps) → primary CTA | Converts to lead/booking | Short path to lead capture, not a tutorial. |
| **B10** | **Real reviews block** + visible aggregate rating | Social proof + AggregateRating eligibility | Real verified-booking reviews only → schema below. Never synthesized. |
| **B11** | **FAQ (8–10 Q&As)** — real PAA/long-tail (how much, advance booking, photo vs cinematography, drone allowed, how many photos, peak season) | GEO + rich result + long-tail capture | Visible FAQ + **FAQPage schema** = cheapest, highest-yield GEO lever ([06](06-technical-geo.md) §5.2). |
| **B12** | **Internal-link bridges** — (a) → cost/how-to pillar (`/wedding-photography-cost-in-lahore`); (b) sibling types in-city (`/wedding-venues/lahore`, `/bridal-makeup-artists/lahore`); (c) same type, nearby cities; (d) up to type-hub + city-hub; (e) from feeding galleries | Equity flow + intent routing + the informational→commercial conversion bridge | Formalized mesh ([04](04-programmatic-architecture.md) §5), contextual in-body (weighs more than footer). The pillar link is the cannibalization-safe handoff (§6). |
| **B13** | **Strong CTA / lead-capture** (sticky on mobile): "Get free quotes from Lahore wedding photographers" → enquiry form / WhatsApp | The north-star action (leads, not vanity rank) | Fires the GA4 conversion events (contact reveal / enquiry / WhatsApp — [10](10-resourcing-conversion-risk.md) §2.1). North star = leads ([00-README.md](00-README.md) rule 5). |

**Listicle sibling (`/best/{vendor-type}-in-{city}`)** uses the same blocks but: H1 = "Best Wedding Photographers in Lahore (2026)"; B4 becomes a **ranked** list with a stated human selection methodology + per-vendor blurb; year in slug/title; gated by `MIN_VENDORS_FOR_LISTICLE` (≥3) and the `LISTICLE_PAGES_ENABLED` flag; ItemList becomes **ranked** ([06](06-technical-geo.md) §3, [03](03-content-engine.md) §2B). It targets `best wedding photographers in lahore` so it does not compete with the grid page's `wedding photographers in lahore`.

---

## 3. KEYWORD-PLACEMENT MAP (the operator's explicit ask)

**Worked example: `wedding photographers in lahore`** (primary). Secondaries/long-tails from [`briefs/…`](briefs/wedding-photographers-lahore-brief.md) §1 + [02](02-keyword-universe.md) §5A. Each keyword maps to its **exact on-page location** — one secondary per H2, no stuffing.

| On-page location | Exact element / value | Keyword placed | Role |
|---|---|---|---|
| **URL slug** | `/wedding-photographers/lahore` (locked, no trailing slash, lowercase, hyphen) | `wedding photographers` + `lahore` | Primary (split across path) |
| **`<title>`** | `Wedding Photographers in Lahore — Prices, Packages & Top Studios (2026) \| Wedding Wala` | Primary verbatim + "prices/packages" secondary cues | Primary + 2 secondaries |
| **Meta description** | "Compare verified wedding photographers in Lahore. Indicative PKR packages & prices, ratings, specialties, FAQs & how to choose (2026)." (~150 chars) | Primary + `packages` + `price` + `how to choose` | Primary + secondaries (CTR) |
| **H1** | `Wedding Photographers in Lahore` | Primary, verbatim, exact-match | Primary |
| **First 100 words (B2 answer-first lead)** | "**Wedding photographers in Lahore** typically charge PKR 80k–350k…" | Primary in first sentence + a price long-tail | Primary + snippet/GEO |
| **H2 (B3 city editorial)** | "Wedding photography in Lahore: areas, venues & season" | `wedding photography` + `lahore` areas | Secondary (local) |
| **H2 (B4 vendor list)** | "Top wedding photographers & studios in Lahore" | `best wedding photographer in lahore` / `wedding photographers in lahore` | Secondary |
| **H2 (B5 price tier table)** | "Wedding photography packages & prices in Lahore" | `wedding photography packages lahore` + `wedding photography price in lahore` | 2 transactional secondaries |
| **H2 (B6 checklist)** | "How to choose a wedding photographer in Lahore: 6 things to check" | `how to choose a wedding photographer in lahore` | Secondary (info-cue) |
| **H2 (B8 by event)** | "Mehndi, barat & walima photography in Lahore" | `barat photographer lahore`, `pre wedding shoot photographer lahore` | Long-tail (event) |
| **H2 (B11 FAQ)** | "Wedding photographer in Lahore — FAQs" | `wedding photographer lahore cost` (Q1) | Long-tail in Q text |
| **Image alt** | `wedding photographer in Lahore — {event} {detail}` e.g. "wedding photographer in Lahore — barat candid shot, Gulberg" | Primary + event/area long-tail | Image SEO / Google Images |
| **FAQ questions (B11)** | "How much does a wedding photographer cost in Lahore?" · "How far in advance should I book in Lahore?" · "Photography vs cinematography — what's the difference?" · "Is drone photography allowed?" · "How many edited photos do I get?" | PAA / long-tail one per Q | Long-tail + GEO |
| **Internal anchor text (B12)** | → pillar: "wedding photography cost in Lahore"; → sibling: "wedding venues in Lahore", "bridal makeup artists in Lahore" | Pillar primary + sibling primaries | Equity + intent routing |
| **Breadcrumb** | Home › Wedding Photographers › Lahore | Primary (split) | Crawl path + SERP |

**Placement discipline:** primary appears in URL, `<title>`, H1, first 100 words, meta, **and exactly one H2** — then stop (over-repetition is stuffing). Secondaries are **one per H2**. Long-tails live in FAQ question text, image alts, and event H2s. Spelling variants (baraat/barat, walima/valima, nikah/nikkah) appear as **body/H-tag synonyms only — never as separate URLs** ([04](04-programmatic-architecture.md) §6).

### Reusable `{service}/{city}` pattern (swap the two tokens)

| Slot | Pattern |
|---|---|
| URL slug | `/{vendor-type}/{city}` |
| `<title>` | `{Plural Service} in {City} — Prices, Packages & Top {Providers} ({year}) \| Wedding Wala` |
| Meta description | `Compare verified {service} in {City}. Indicative PKR {packages/rates}, ratings, FAQs & how to choose ({year}).` |
| H1 | `{Plural Service} in {City}` |
| First 100 words | `{Plural service} in {City} typically cost PKR {low}–{high}, depending on {2 drivers}.` |
| H2-1 (editorial) | `{Service} in {City}: areas, venues & season` |
| H2-2 (list) | `Top {service} & {providers} in {City}` |
| H2-3 (price) | `{Service} packages & prices in {City}` → carries `{service} packages {city}` + `{service} price in {city}` |
| H2-4 (checklist) | `How to choose a {service-singular} in {City}: {N} things to check` |
| H2-5 (by event) | `{Service} for mehndi, barat & walima in {City}` (only where event-eligible — [04](04-programmatic-architecture.md) §1) |
| H2-6 (FAQ) | `{Service-singular} in {City} — FAQs` |
| Image alt | `{service-singular} in {City} — {event} {detail}` |
| Bridge anchors | → `/{service-cost-slug}` pillar; → `/{sibling-type}/{city}`; → `/{vendor-type}/{nearby-city}` |

(Volumes/SD are **directional** Ubersuggest free-tier, a floor — re-validate against GSC once data accrues. [02](02-keyword-universe.md) is the canonical owner of all keyword numbers; this file quotes, never redefines.)

---

## 4. The full SCHEMA graph (and why each)

Emitted via the existing typed builders in `lib/seo/jsonld.ts` and nested with `combineGraph()` — **additive, validated in CI via the `schema-org` MCP before flip** ([06](06-technical-geo.md) §3). Money page and listicle differ only in CollectionPage vs ranked ItemList.

| Schema type | Where | Builder | Why |
|---|---|---|---|
| **CollectionPage / ItemList** | Page-level wrapper around the vendor list (B4) | `collectionPageLD` (listicle → ranked `ItemList`) | Tells Google the page is a curated set of vendors; ranked ItemList wins "best X in {city}" rich results + AI list answers — the highest-ROI *new* schema work. |
| **Service** | The vendor-type service in the city | `serviceLD` | Disambiguates the offering ("Wedding Photography" service area = Lahore) for entity understanding + service rich results. |
| **LocalBusiness** | Per vendor card (B4) + each leaf | `vendorLD` / `venueLD` | Each vendor is a real local business (name, area, geo) → local relevance + leaf flywheel ([04](04-programmatic-architecture.md) §2). |
| **AggregateRating** | Per vendor (and page-level where genuine) | nested in `vendorLD` | Star ratings in SERP/AI. **Real review counts only** — fabricated `reviewCount` is a manual-action risk ([06](06-technical-geo.md) §3). |
| **Review** | Real verified-booking reviews (B10) | `reviewLD` | Individual review markup → review snippets + E-E-A-T corroboration. Omit if none — never synthesize. |
| **FAQPage** | The visible FAQ (B11) only | `faqLD` | Rich result + the single biggest GEO lever; FAQ schema only where visible FAQ content exists (Google policy). |
| **BreadcrumbList** | Sitewide (B0) | `breadcrumbLD` | Crawl path + breadcrumb SERP enhancement; emitted everywhere already. |
| **Organization + WebSite** | Sitewide | `organizationLD` + `webSiteLD` | Brand entity + sitelinks search box; corroborates "Wedding Wala" for AI brand association. |

Listicle adds the **ranked** ItemList (position-indexed); cost/how-to **pillar** sibling uses `articleLD` + `faqLD` (+ `howToLD` where stepwise) — a different schema profile that reinforces the intent split (§6).

---

## 5. GEO / AI-search optimization & E-E-A-T signals

**GEO (get cited by AI Overviews / ChatGPT / Perplexity / Copilot) — maps to [06](06-technical-geo.md) §5:**
- **Answer-first (B2):** the 40–60-word lead = the self-contained passage AI extractors quote; restated question + answer + a PKR number.
- **Tables (B5) + comparison blocks:** structured, scannable price-tier and vendor tables are over-represented in AI citations.
- **FAQ → AI answers (B11):** visible FAQ + FAQPage schema feeds AI Q&A and PAA; questions mirror real long-tail.
- **Freshness:** honest `dateModified` (Article/schema) + sitemap `lastModified`; "(2026)" framing refreshed annually — stale prices get dropped from AI answers.
- **Access + discoverability:** `robots.ts` already allowlists GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot/Google-Extended/Bingbot-Copilot etc.; the page is listed in root `/llms.txt`; **Bing indexation = Copilot citation eligibility** (push via IndexNow on publish).
- **Corroboration:** off-site brand mentions raise citation likelihood ([05](05-authority-linkbuilding.md)) — coordinate, but that section is out of scope here.

**E-E-A-T signals on the page (B0 + B10 + bylines):**
- **Verified-vendor badges** + honest **N enquiries/bookings this month** (real backend count — the *experience* leg).
- **Real reviews + AggregateRating** from verified bookings only.
- **Author/editor byline** with a real bio + `/about/{author}` profile (the `BlogAuthor.url` field already feeds `author` JSON-LD); legal/finance-adjacent copy gets a credited "reviewed by".
- **Honest, dated, directional pricing** callout (no false precision; no rank guarantees).
- **Real PK photography** (not generic stock) sourced via vendor partnerships ([03](03-content-engine.md) §4).

---

## 6. Keyword-splitting discipline (money page vs cost/how-to pillar — anti-cannibalization)

We deliberately run two coordinated assets at **different intents** so they don't compete for the same SERP (we already do this — [02](02-keyword-universe.md) §5A vs §5C, [03](03-content-engine.md) §2B/§2C, and the live pillar `/wedding-photography-cost-in-lahore`):

| Axis | Money page `/wedding-photographers/lahore` | Cost/how-to pillar `/wedding-photography-cost-in-lahore` |
|---|---|---|
| **Primary intent** | Commercial — *find & contact* a photographer now | Transactional-info — *research cost / how to choose* before contacting |
| **Primary keyword** | `wedding photographers in lahore` | `wedding photography cost in lahore` / `wedding photography price` |
| **Dominant block** | Vendor list (B4) + lead capture (B13) | Deep PKR cost tables + how-to, no vendor grid |
| **Schema** | CollectionPage/ItemList + LocalBusiness + Review | Article + FAQPage (+ HowTo) |
| **KPI** | Leads / enquiries / WhatsApp clicks | Referring domains (link magnet) + featured snippets + assisted leads |
| **Link role** | Receives bridge links from pillar & galleries | Sends a "compare & contact" bridge link → money page (B12a) |

**Why it works:** the two pages answer *different questions*, target *different head terms*, and **cross-link** (pillar → money page CTA; money page B12 → pillar). Google has no reason to pick one over the other, and the informational pillar (a link magnet + AI-citation surface) funnels its research traffic into the commercial page — the informational→commercial bridge that makes informational volume worth chasing ([00-README.md](00-README.md) rule 5, [10](10-resourcing-conversion-risk.md) §2.3). The listicle (`/best/…`) is a *third* intent ("best/ranked") with its own head term, again non-overlapping.

---

## 7. Implementation note (live-system safety)

Every block above is **additive, backward-compatible, flag-gated, zero-downtime**. The money-page template (`components/seo/vendor-type-city-page.tsx`) already emits B0/B3/B5/B11 and the inventory `noindex,follow` guard; this blueprint's deltas (richer `<title>` per §3, answer-first B2, "things to check" B6, "questions to ask" B7, event notes B8, formalized bridges B12) deepen the existing template — they do not rebuild it. Keep the locked URL grammar ([04](04-programmatic-architecture.md) §6), keep the thin-page guards ([04](04-programmatic-architecture.md) §4), and validate schema in CI before any flip.

---

_Created 2026-06-15. Canonical page-level spec; system-level rules defer to [00-README.md](00-README.md). Worked example sourced from live Ubersuggest PK SERP ([briefs/wedding-photographers-lahore-brief.md](briefs/wedding-photographers-lahore-brief.md)). Directional pricing/volumes — re-validate via GSC. Compete for #1; never guarantee it._

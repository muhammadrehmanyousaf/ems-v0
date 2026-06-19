# Wedding Wala — SEO/GEO Analysis (the ANALYZE file)

**Date:** 2026-06-19 · **Status:** Research compiled (codebase audit done; keyword/competitor research running).

## Headline finding
**This is NOT a greenfield SEO job.** weddingwala.pk already has a mature, expert-level SEO system AND a written 2-year strategy. The bottleneck is **execution + deployment + authority**, not structure. (Confirmed by `seo-strategy/SEO-MASTER-PLAN.md` + `mega-plan-2yr/` + `TODO.md`.)

## What ALREADY exists (do not rebuild)
| Area | State | Evidence |
|---|---|---|
| **Sitemap** | ✅ Excellent — 4 shards (core, programmatic city×type *inventory-gated*, dynamic vendors, images) | `app/sitemap.ts` |
| **Robots / AI access** | ✅ Full AI-crawler allowlist (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, Bingbot, CCBot…) | `app/robots.ts` |
| **Schema** | ✅ Org, WebSite+SearchAction, Breadcrumb, LocalBusiness(+geo), EventVenue, Review, **AggregateRating only when a real rating exists (honest)**, FAQPage, Article, Service, CollectionPage/ItemList | `lib/seo/jsonld.ts` |
| **llms.txt** | ✅ Present | `public/llms.txt` |
| **Metadata** | ✅ Per-page-type title/desc/canonical/OG | `lib/seo/metadata.ts`, generateMetadata in routes |
| **Content engine** | ✅ Blog (clusters+posts), glossary, compare pages, real-weddings, content pillars, pricing guides, **per-city editorial**, planning tools (budget/checklist/timeline), per-type guidance/FAQ | `lib/seo/*`, `lib/blog`, `lib/content` |
| **Hreflang** | ✅ en-PK / ur-PK scaffold | `lib/seo/hreflang.ts` |
| **Strategy** | ✅ Master plan + 2-yr mega-plan + execution TODO with competitor teardown | `seo-strategy/` |

## The real gaps / levers (what actually moves rankings now)
**Tier 1 — biggest impact, code or deploy:**
1. **DEPLOY the session's work.** 3,266 real vendors + images + guidance/FAQ + claim flow are on DEV, unpushed → **nothing ranks until live + indexed.** This is the #1 action. (Master plan calls vendor-profile pages the highest-ROI page type; we just 30×'d the count.)
2. **Vendor-profile leaf pages = the navigational flywheel** (rank #1 for each vendor's name). Now ~3,266 of them. Ensure each is fully optimised (schema ✅, but the rich per-type guidance/FAQ currently renders on the APP detail page, **not** the indexed SEO-leaf page — gap to fix).
3. **"Best {service} in {city} 2026" listicles** — the GEO/AI-citation weapon (flag `LISTICLE_PAGES_ENABLED` + `lib/seo/listicle.ts` exist; pages/flag need finishing + enabling). Listicles = ~63% of AI citations.
4. **Deepen {service}×{city} money pages** — unique per-city intro (city-editorial.ts exists), PKR ranges, ≥6 vendor cards, FAQ, internal links. Protect the thin-content `noindex` guard.

**Tier 2 — on-page / technical:**
5. Per-type guidance/FAQ → mirror onto the **SEO leaf page** + city hubs (currently app-page only).
6. On-page keyword placement audit (title/H1/first-100-words/meta) across page types.
7. CWV/INP audit (mobile-first) — pending live measurement.
8. Image alt-text keyword-awareness + WebP (next/image handles format; alt text needs auditing).
9. Deprecated `HowTo` schema present in `jsonld.ts` (minor cleanup — deprecated Sept 2023).
10. Possible duplicate-content: app detail `/{type}/{id}` (client, no canonical) vs SEO leaf `/{type}/{city}/{slug}-{id}` — verify canonical.

**Tier 3 — USER / real-world (the #1 lever, NOT codable):**
11. **Authority/backlinks** (DA 1, 0 referring domains) — citations, GBP + Bing Places + NAP, vendor reciprocity, digital PR ("Decemberistan report"), real-wedding features. *No one can code DA.*
12. **Connect GSC + GA4 + Bing** (service account) — unblocks real keyword/index data. *(TODO marks some ✅; verify in-session MCP.)*
13. **Vercel apex→www: change 307 → 301/308.** (Dashboard, user.)
14. **Request Indexing** for top money pages in GSC.
15. **First-party photography** to replace stock (E-E-A-T) — real shoots.
16. **Real reviews** accrue via real bookings (claim flow) → AggregateRating lights up. *No fake reviews.*

## SEO Health Score (codebase/on-page only): **~82/100** — strong foundation.
Held back by: not-yet-deployed (indexation = 0 of the new work), authority (DA1), and the leaf-page content gap. The ceiling on *rankings* is authority + time, not on-page quality.

## Honest verdict
On-page/technical SEO is already top-decile. **Rankings are gated by (a) shipping the work, (b) earning authority over months, (c) executing the content/listicle backlog.** I will execute every code-level item; the authority + GSC + Vercel + photography levers need you.

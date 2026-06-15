# Wedding Wala — Master SEO TODO (the execution checklist toward 1M/mo)

> The single running checklist for the whole program. Detail lives in the mega-plan files [00–10](00-README.md); this file is *what to do, in what order, with which tool*.
> **Honesty banner:** the goal is pages engineered to **compete for #1** on their primary + secondary keywords. We **maximize** ranking with best-in-class content, on-page, schema, links and speed — but #1 is never *guaranteed* (it depends on authority + time + Google). North star = **organic leads/bookings**, not vanity rank. "Whole Pakistan" = a **tiered, inventory-gated** rollout, never mass thin pages.

**Legend:** ✅ done · 🔄 in progress · ⬜ to do — **P0** = do first/blocking · **P1** = high · **P2** = medium · **P3** = later
**MCP/skill** column = which tool drives it.

---

## A. Foundation & measurement (Step Zero)
| ✓ | P | Task | Tool |
|---|---|------|------|
| ✅ | P0 | Connect GSC + GA4 + Bing via service account (verified live) | gsc / ga4 / bing-webmaster |
| ✅ | P0 | Submit sitemap.xml + confirm indexation baseline | gsc |
| ✅ | P0 | Diagnose canonical "Alternate page" issue (root cause: legacy apex canonical, already fixed; recrawl pending) | gsc |
| ⬜ | P0 | **Vercel: change apex→www redirect from 307 (temporary) to 301/308 (permanent)** | _user (Vercel dashboard)_ |
| ⬜ | P0 | Request Indexing in GSC for top money pages (the ~56 stale-canonical pages) | gsc (UI) |
| ⬜ | P1 | Switch GA4 property to Asia/Karachi timezone + PKR currency | _user (GA4 admin)_ |
| ⬜ | P1 | Reconnect Claude Code so gsc/ga4 MCP tools load in-session | _user_ |
| ⬜ | P1 | Define GA4 conversion events (contact reveal / enquiry / WhatsApp click) | ga4 |
| ⬜ | P2 | Stand up the weekly KPI scorecard + monthly deep-dive ([09](09-measurement-cadence.md)) | gsc / ga4 / bing |
| ⬜ | P2 | Build Looker Studio dashboard (GA4 + GSC native connectors) | _Looker Studio (no MCP needed)_ |

## B. Keyword planning & research (the demand map)
| ✓ | P | Task | Tool |
|---|---|------|------|
| 🔄 | P0 | Enrich the keyword universe (free-tier only scores ~19/cluster) — pull volume/SD for the full long tail | ubersuggest (keyword_metrics) + GSC |
| ⬜ | P0 | Build the **{service}×{city} keyword matrix** with primary + secondary per page (every vendor type × every target city) | ubersuggest / serper / GSC |
| ⬜ | P0 | Classify intent (informational vs commercial vs navigational) per cluster; tier by difficulty (A/B/C) | seo-cluster skill |
| ⬜ | P1 | Vendor-name navigational keyword list (rank #1 for each vendor's name — the flywheel) | ubersuggest / serper |
| ⬜ | P1 | Informational cluster maps (mehndi designs, bridal dress, hairstyles, decor, cards) for the blog | ubersuggest / google-trends |
| ⬜ | P1 | Validate top keyword volumes against **real GSC impressions** once data accrues | gsc |
| ⬜ | P2 | Seasonal calendar (Decemberistan peak; Eid; 14 August) for content timing | google-trends |

## C. Competitor analysis ("pick top 3 → make ours 100× better")
| ✓ | P | Task | Tool |
|---|---|------|------|
| ⬜ | P0 | For each priority keyword, pull the **live top-3 ranking pages** | serper / g-search |
| ⬜ | P0 | Scrape + teardown each top-3 page (word count, headings, schema, tables, media, FAQs, internal links, freshness) | firecrawl / fetcher |
| ⬜ | P0 | Define the **"100× better" spec** per page type (depth + structure + media + schema + E-E-A-T that beats all 3) | seo-content-brief skill |
| ⬜ | P1 | Full competitor domain teardown: shadiyana.pk, shehnai.pk, others ([10](10-resourcing-conversion-risk.md) §4) | ubersuggest / firecrawl |
| ⬜ | P1 | Backlink gap analysis — what links competitors have that we don't | seo-backlinks skill / bing-webmaster |
| ⬜ | P2 | Content-gap map — keywords competitors rank for that we don't cover | ubersuggest / GSC |

## D. Programmatic coverage — "whole Pakistan" (tiered, inventory-gated)
> Geography model: **Provinces/territories** → Punjab, Sindh, KP, Balochistan, Gilgit-Baltistan, AJK, Islamabad (ICT). **Cities tiered**, NOT all-at-once.
| ✓ | P | Task | Tool |
|---|---|------|------|
| ⬜ | P0 | **City tier list:** Tier-1 metros (KHI, LHR, ISB, RWP) → Tier-2 (Faisalabad, Multan, Sialkot, Gujranwala, Peshawar, Hyderabad, Quetta, Bahawalpur) → Tier-3 long-tail (only with demand + inventory) | constants.ts |
| ⬜ | P0 | Service catalog: confirm 11 live vendor types + expansion (groom-wear/sherwani, bridal-jewellery, qawwali, choreographers, cakes, salons) | constants.ts |
| ⬜ | P0 | Province landing pages (`/cities` hub already exists — add province-level hubs linking to their cities) | code (additive) |
| ⬜ | P1 | Deepen existing {service}×{city} money pages: unique intro per city, PKR ranges, ≥6 vendor cards, FAQ, internal links ([04](04-programmatic-architecture.md) §3) | code |
| ⬜ | P1 | Vendor profile pages at scale (the navigational flywheel — rank #1 for each vendor name) | code |
| ⬜ | P0 | **Thin-content guardrail:** keep combos with <3 vendors `noindex,follow` until populated (already enforced — protect it) | code |
| ⬜ | P2 | Event × city pages (mehndi/barat/walima/mayun/dholki/nikkah × city), variant spellings | code |
| ⬜ | P2 | Tier-2/Tier-3 city rollout as vendor inventory grows | code + backend |

## E. Blog & content engine (comprehensive, Pakistani audience)
| ✓ | P | Task | Tool |
|---|---|------|------|
| ✅ | P1 | Bridal-dress silo: hub + 4 occasion spokes (walima/barat/mehndi/nikkah) | content-pillar |
| ⬜ | P0 | **Flagship "100× better" posts** vs the top-3 for the biggest money/info terms (e.g. "Wedding Cost in Pakistan 2026", "Best Wedding Photographers in {city} 2026") | seo-content-brief + content-pillar |
| ⬜ | P0 | "Best {service} in {city} 2026" listicle program (Tier-1 cities × core services) — the GEO/AI-citation weapon | code (listicle) |
| ⬜ | P1 | Informational gallery clusters (mehndi designs, bridal looks, decor ideas) — top-of-funnel volume → internal-link to money pages | content-pillar |
| ⬜ | P1 | Content calendar + publishing velocity ramp ([03](03-content-engine.md) §3) | task-management |
| ⬜ | P1 | First-party photography to replace Pexels placeholders (E-E-A-T) | _user / shoots_ |
| ⬜ | P2 | Urdu / Roman-Urdu content layer (en-PK + ur-PK already scaffolded) | code |
| ⬜ | P2 | Author bylines + E-E-A-T author pages | code |

## F. On-page optimization (per-page checklist — apply to every page)
| ✓ | P | Task | Tool |
|---|---|------|------|
| ⬜ | P0 | Primary keyword in: `<title>`, H1, URL slug, first 100 words, meta description | code |
| ⬜ | P0 | Secondary keywords split across H2/H3 (one intent per heading) | code |
| ⬜ | P1 | FAQ section + FAQPage schema targeting "people also ask" long-tail | schema-org |
| ⬜ | P1 | Internal links: hub→city→vendor + informational→commercial bridge | code |
| ⬜ | P1 | Image alt text (keyword-aware), WebP, lazy-load, dimensions (CLS) | code |
| ⬜ | P2 | Tables + answer-first lead (AI-citation friendly) | content-pillar |
| ⬜ | P2 | "Last updated" + freshness signals | content-pillar |

## G. Technical SEO & GEO (AI search)
| ✓ | P | Task | Tool |
|---|---|------|------|
| ⬜ | P1 | Core Web Vitals / INP audit + fixes (mobile-first PK) | lighthouse / pagespeed / crux |
| ⬜ | P1 | Schema coverage per page type (LocalBusiness+AggregateRating, ItemList, FAQ, Article, Breadcrumb) | schema-org |
| ⬜ | P1 | Indexation-at-scale monitoring (coverage, sitemap shard health) | gsc |
| ⬜ | P2 | IndexNow instant submission (Bing/Yandex) | indexnow |
| ⬜ | P2 | GEO: answer-first + tables + FAQ + llms.txt for AI Overviews/ChatGPT/Perplexity | seo-geo skill |
| ⬜ | P2 | hreflang en-PK/ur-PK correctness | code |

## H. Authority & link-building (the #1 lever — DA 1 today)
| ✓ | P | Task | Tool |
|---|---|------|------|
| ⬜ | P0 | Google Business Profile + Bing Places + consistent NAP | _user_ + bing-webmaster |
| ⬜ | P1 | Foundational PK citations (UrduPoint, directories, socials) | serper / firecrawl |
| ⬜ | P1 | Vendor reciprocity ("Featured on Wedding Wala" links) | code + outreach |
| ⬜ | P2 | Digital PR: annual "Pakistan Wedding Season Report" (Decemberistan data) → Dawn/Tribune | google-trends + outreach |
| ⬜ | P2 | Real-wedding features crediting vendors (backlink manufacturing) | code |

## I. Active sprint (do these next — top of stack)
1. ⬜ **P0** — Keyword planning: build the {service}×{city} matrix (Section B) for Tier-1 cities.
2. ⬜ **P0** — Competitor analysis: top-3 teardown + "100× better" spec for the first flagship (Section C).
3. ⬜ **P0** — Ship the first flagship blog post + first "Best {service} in {city} 2026" listicles.
4. ⬜ **P0** — Vercel 307→301 + Request Indexing (Section A) — _user actions_.

---
## J. Whole-Pakistan coverage — EXACT figures (full model: [11-whole-pakistan-coverage.md](11-whole-pakistan-coverage.md))
> Myth-bust: the "150–300 cities" claim is geographically false — only **127 Pakistani cities exceed 100k people** (2023 PBS census). We target **~32 cities** at full build-out (demand × real inventory), NOT all 127. Expanding from the 12 live today.

| ✓ | P | Task | Detail |
|---|---|------|--------|
| ⬜ | P0 | Deepen the **11×12 = 132** live {service}×{city} combos per [12-page-blueprint.md](12-page-blueprint.md) | inventory-backed only |
| ⬜ | P1 | **Vendor-PROFILE flywheel** — the real indexed-volume driver (**~3,000–6,000+** pages) | scales with onboarding; zero thin risk |
| ⬜ | P1 | "Best {service} in {city}" listicles — ≥3 vendors, flag-gated (~120–180 indexable) | GEO/AI-citation weapon |
| ⬜ | P2 | Expand vendor types **11 → ~17** (sherwani, bridal-jewellery, qawwali, choreographers, cakes, salons) | |
| ⬜ | P2 | Expand cities **12 → ~32** (Tier-3, inventory-gated) | Punjab-first |
| ⬜ | P2 | Event layer {service}×{city}×{event} + **7 province hubs** (~250–500 indexable) | |
| ⬜ | P0 | **The hard line:** NEVER mass-publish empty city pages — inventory-gate everything (already coded) | anti-penalty |

**Target indexable pages @ M24:** **~4,145 (Base → ~500k/mo)** to **~7,690 (Aggressive → ~1M/mo ceiling)**. ~9k–15k URLs *generated*, but ~7k stay `noindex,follow` by design. This BEATS the friend's "publish 2,273 doorway pages" approach (a scaled-content-abuse penalty risk).

## K. Adopt the definitive page blueprint ([12-page-blueprint.md](12-page-blueprint.md))
| ✓ | P | Task | Detail |
|---|---|------|--------|
| ✅ | P0 | Template already upgraded with pricing tiers + questions + FAQ schema (Section F) | live in template |
| ⬜ | P1 | Apply the full **13-block** structure (B0–B13) + **keyword-placement map** to money pages + listicles | primary/secondary/long-tail → exact slot |
| ⬜ | P2 | Add AggregateRating + Review schema once real review data flows | E-E-A-T |

---
_Created 2026-06-15. Living file — update status as we execute. Detail & rationale: see [00-README.md](00-README.md) and the mega-plan files. Rankings are competed for, not guaranteed; leads are the north star._

# Wedding Wala — SEO Execution Tracker (the EXECUTE file)

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` needs YOU
Detail: `00-ANALYZE.md`, `01-PLAN.md`, `03-keyword-competitor-research.md`. Master strategy: `seo-strategy/`.

## Phase 0 — Research & setup  ✅
- [x] Honest framing (no fake reviews; #1 maximized not guaranteed; must deploy to rank)
- [x] Codebase SEO audit (sitemap, robots, schema, llms.txt, content engine) — mature
- [x] Existing-program inventory (SEO-MASTER-PLAN + mega-plan-2yr + TODO found — expert-level)
- [x] Live keyword/competitor/SERP research (gl=pk) → `03-keyword-competitor-research.md`
- [x] Tracking files written/grounded

## Phase 1 — Make the 3,266 indexed leaf pages best-in-class
- [x] **E1 — per-type guidance + "What to ask" + expanded FAQPage schema on the SEO leaf page** (`components/seo/vendor-detail-page.tsx`). Content-rich + AI-citable on every vendor page.
- [ ] E5a — verify canonical: app `/{type}/{id}` (client) should canonical → SEO leaf `/{type}/{city}/{slug}-{id}` (dup-content check)
- [ ] E5b — remove deprecated `HowTo` schema from `jsonld.ts` (minor)
- [ ] E6 — image alt-text keyword-awareness across vendor/card/leaf templates

## Phase 2 — GEO/AI-citation weapon + cost layer (research-prioritised)
- [x] **E2 — "Best {service} in {city} 2026" listicles VERIFIED WORKING** (`best-vendor-listicle-page.tsx` already built — answer-first lead + comparison table + ranked list + CollectionPage/Article/Service/FAQPage schema). Tested `/best/bridal-makeup-artists-in-karachi` with real data. **Production action: set `NEXT_PUBLIC_LISTICLE_PAGES=true` + deploy** → sitemap auto-includes eligible combos (≥3 vendors). [U]
- [ ] E7 — cost layer: verify "Wedding Cost in Pakistan 2026" pillar (sitemap lists it) + budget calculator (exists at /planning-tools/budget); add "marquee rates in {city}" / "{type} price list {city}" if missing
- [x] city-hub FAQPage schema — already present (`vendor-type-city-page.tsx` emits CollectionPage+Service+FAQPage)

> **META-FINDING (important):** This codebase is ~90% SEO-complete. The listicle program, the deep B0–B13 city money pages, comprehensive schema, robots+AI-crawlers, llms.txt, sitemap shards, content engine — **all already built.** My initial glob tool was unreliable on nested paths and under-reported what exists. **New rule: VERIFY (Read/Grep/ls) before building any further E item — most already exist.** The real levers are now: enable flags → DEPLOY → authority/off-page (needs you).

## Phase 3 — Money-page depth + internal linking
- [ ] E3 — deepen `{type}×{city}` hubs: unique per-city intro (city-editorial), PKR ranges, ≥6 cards, FAQ, links — focus people-verticals where we can win
- [ ] E8 — internal-linking flywheel (hub→city→vendor + info→commercial) + province hubs

## Verified code findings (audited, not guessed)
- **HowTo schema** — used intentionally on `/how-it-works` + prescribed by the mega-plan for stepwise guides. Deprecated for *rich results* (Sept 2023) but not harmful as semantic markup. **Verdict: keep.**
- **App UX routes vs SEO routes [✅ FIXED + VERIFIED]** — the `(vendorListings)` group (`/makeup-artists`, `/venues`, `/photographers`, `/catering`, … + each `/[id]`) was `force-dynamic`, client-rendered, thin, and parallels the SEO-canonical routes (`/bridal-makeup-artists`, `/wedding-venues`, city pages, leaf — the only vendor URLs in the sitemap). **Fix applied:** added `app/(main)/(vendorListings)/layout.tsx` with `robots: { index: false, follow: true }`. Verified live: `/makeup-artists` → `noindex, follow`; `/wedding-venues` (SEO) → `index, follow` (untouched). Thin/dup UX pages deindexed; equity still flows via `follow`; SEO money pages unaffected. Scoped to one route-group layout = zero risk to SEO routes.
- **Type-hub SEO** — the *SEO* hubs (`/bridal-makeup-artists` etc., in sitemap @0.9) are server-rendered money pages (separate from the app browse). Assumed rich; verify on deploy.

## Phase 4 — On-page + technical polish
- [ ] E4 — on-page keyword pass (title/H1/first-100/meta) per page-type template
- [ ] E9 — IndexNow wiring (instant Bing/Yandex)
- [ ] CWV/INP audit (needs live measurement)

## Phase 5 — Needs YOU (the real ranking ceiling)
- [!] **U1 — DEPLOY the dev work (3,266 vendors etc.)** — nothing ranks until live + indexed
- [!] U2 — Authority: GBP + Bing Places + NAP, PK citations, vendor reciprocity, digital PR
- [!] U3 — Confirm GSC+GA4+Bing connected; define GA4 conversions
- [!] U4 — Vercel apex→www 307 → 301/308
- [!] U5 — Request Indexing for top money pages
- [!] U6 — First-party photography (E-E-A-T)

---
### Changelog
- 2026-06-19: Program kicked off. Research compiled (codebase mature + master plan exists + live SERP research). **E1 executed** (leaf-page guidance/FAQ + schema). Plan grounded to existing TODO.

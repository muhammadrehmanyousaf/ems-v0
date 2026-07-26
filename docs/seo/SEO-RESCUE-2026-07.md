# Wedding Wala — SEO Rescue (2026-07)

**Symptom:** ~4,000+ pages, only ~24 organic keywords, rankings slid from page 1 →
last page, ~60k site-audit issues, AI visibility 0.

**Root cause (confirmed by fetching the live site as Googlebot):**
`GET https://www.weddingwala.pk/photographers/2522` returns:
- `<title>` = the **generic site title** (identical on all 4,000 vendor pages)
- `<meta description>` = the **generic site description** (identical on all pages)
- **H1 count = 0**
- the vendor's name (**"Zarrin"**) is **absent** from the HTML
- the body contains **"Loading photographer…"** — i.e. Google gets a **client-side spinner**, not content

Every vendor detail route (`{type}/[id]/page.tsx`, ×24 types) is a **`"use client"`
component that fetches its data in `useEffect`**. So the server HTML has no content,
no unique title/description, no H1, no structured data. This one architecture flaw
mass-produces the audit issues and makes the pages unrankable.

**The cruel irony:** the repo already contains a *complete, LOCKED SEO architecture*
that was built and never wired up:
- `lib/seo/fetch-vendor.ts` — server-side vendor fetch (`fetchVendorById`, ISR 1h) + `slugifyName` + `parseVendorSlugAndId` + `buildVendorCanonicalPath`
- `lib/seo/metadata.ts` — `buildPageMetadata`, `noindexMetadata`
- `lib/seo/jsonld.ts` — `vendorLD`, `venueLD`, `breadcrumbsLD`, `faqLD`, `reviewLD`, `combineGraph`
- `docs/seo/03-url-conventions-LOCKED.md` — canonical URL = `/{type}/{city}/{name-slug}-{id}` (NOT `/venues/3273`)
- `components/seo/breadcrumbs.tsx`, working `generateMetadata` on blog/real-weddings/cities

The numeric client detail pages simply never adopted any of it.

---

## Issue inventory → which fix clears it

| SEMrush issue (×N pages) | Root cause | Fix |
|---|---|---|
| Duplicate title tag (×~4000) | shared generic `<title>` | `generateMetadata` → unique `{Name} — {Type} in {City}` |
| Duplicate / missing meta description (×~4000) | shared generic description | `generateMetadata` → unique per vendor |
| Missing H1 (×~4000) | spinner HTML, no server content | SSR the detail component (H1 = vendor name) |
| Low word count / thin content (×~3268) | client shell + thin OSM "unclaimed" rows | SSR real content + guidance/FAQ; noindex the thinnest until claimed |
| No structured data (×~4000) | none emitted | `vendorLD`/`venueLD` + `breadcrumbsLD` + `faqLD` JSON-LD |
| Non-descriptive / numeric URL (×~4000) | `/venues/3273` | slug URL `/{type}/{name}-{city}-{id}`, numeric 308→slug |
| Pages not indexed / crawl-wasted | 4000 near-duplicate thin pages | canonical + noindex-thin + quality gate |
| AI visibility 0 | no citable server content | SSR content (robots already allows GPTBot/OAI/Perplexity/Claude) |
| Orphan / weak internal links | cards link to numeric | link cards to slug URLs |

Robots.txt is **fine** (AI crawlers allowlisted). `next.config` has
`typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` → builds tolerate the
repo's pre-existing 125 type warnings.

---

## Fix plan (this workstream)

**P0 — the root cause (this commit):** migrate vendor detail routes to the existing
SSR architecture via ONE shared server helper (`lib/seo/vendor-detail-server.tsx`):
1. Convert each `{type}/[id]/page.tsx` from `"use client"` → **server component**.
2. `generateMetadata` → unique title/description/canonical(**slug**)/OG per vendor.
3. Fetch server-side (ISR 1h) → render the detail component **with data** = real
   crawlable HTML (H1, content, packages, the credibility block).
4. Emit JSON-LD: `vendorLD`/`venueLD` + `breadcrumbsLD` + `faqLD`.
5. Accept **both** numeric id and `name-city-id` slug in the segment; **308-redirect
   bare numeric → canonical slug**; canonical always the slug.
6. Sitemap emits the slug URLs (align sitemap ↔ route ↔ canonical ↔ JSON-LD).

**P1 (follow-ups, documented, not this commit):**
- Quality gate: `noindex` unclaimed/thin OSM listings until enriched or claimed
  (protects domain-wide quality — 3,268 near-duplicates are a Panda-class liability).
- City × type hub pages as the ranking workhorses (unique intros, internal linking).
- Enrich thin listings (the vendor-fillable content shipped separately now lets
  vendors add real content — see PROFILE-CONTENT-PARITY).
- Update every vendor card link across the app to the slug URL.
- `llms.txt` (currently 308) served 200 at apex.

## Honest timeline
- **Deploy** (Vercel, from `main`) → SEMrush **re-crawls in days**; issue counts fall as
  the crawler re-reads pages that now have unique titles/descriptions/H1/schema.
- **Rankings/keywords** climb over **4–12 weeks** as Google re-indexes real content and
  the domain-quality signal recovers. 24 → thousands of keywords is an *indexation +
  content* outcome, not a code toggle — but this commit removes the wall that made it
  impossible.

## Log
- 2026-07-26 — Root cause confirmed live (Googlebot sees generic title + spinner).
  Master doc authored. Implementing P0.

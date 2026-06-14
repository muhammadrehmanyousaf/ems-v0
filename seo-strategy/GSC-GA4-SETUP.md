# Google Search Console + GA4 Setup — weddingwala.pk

**Why this is step zero:** until GSC + GA4 are connected, you're flying blind — no impressions, clicks, positions, indexation status, or organic-traffic data. Every later decision (which pillars to expand, which keywords are landing) depends on this. Do it the day the `feat/seo-suite` branch merges to production.

Estimated time: ~30 minutes. You'll need access to the domain DNS (or the ability to add a file/meta tag to the site) and a Google account.

---

## 1. Google Search Console (GSC)

### 1.1 Add the property
1. Go to https://search.google.com/search-console
2. **Add property → Domain** (recommended — covers http/https + all subdomains + www/non-www in one).
   - Enter `weddingwala.pk`
   - Verify via **DNS TXT record** (GSC gives you a `google-site-verification=…` value → add it as a TXT record at your domain registrar/DNS host).
   - *Alternative if you can't edit DNS:* use **URL-prefix** property for `https://www.weddingwala.pk` and verify via the HTML-tag or HTML-file method.
3. **Canonical note:** the site renders canonicals on `https://www.weddingwala.pk` (confirmed in the build). If you use a URL-prefix property, use the **www** version to match.

### 1.2 Submit the sitemap
1. GSC → **Sitemaps** → enter `sitemap.xml` → Submit.
2. The single combined sitemap lives at `https://www.weddingwala.pk/sitemap.xml` (the old sharded/`sitemap.xml/route.ts` setup was removed — see the sitemap fix).
3. Expect "Success" + a discovered-URL count within a day. It should include all 32 content pillars, the cost + bridal pillars, `/wedding-guides`, vendor × city pages, and the blog.

### 1.3 Speed up first indexation (high-value pages)
Use **URL Inspection** → "Request indexing" for the money/flagship pages so they don't wait in the crawl queue:
- `/wedding-cost-in-pakistan`
- `/pakistani-bridal-dress-trends`
- `/wedding-guides`
- 4–5 top pillars (e.g. `/how-to-plan-a-wedding-in-pakistan`, `/nikah-process-in-pakistan`, `/how-to-save-money-on-a-wedding-in-pakistan`, `/court-marriage-in-pakistan`)
(Manual requests are rate-limited to ~10/day — prioritise.)

### 1.4 Reports to watch (weekly)
- **Performance:** impressions, clicks, avg position, top queries/pages. This is your scoreboard.
- **Pages (Indexing):** how many of the submitted URLs are indexed vs "Crawled – currently not indexed" / "Discovered – not indexed". The vendor × city pages with <1 listing are intentionally `noindex` until vendors arrive.
- **Experience → Core Web Vitals + Mobile usability.**

---

## 2. Google Analytics 4 (GA4)

### 2.1 Create the property + data stream
1. https://analytics.google.com → **Admin → Create Property** → name "Wedding Wala".
2. Set timezone **Pakistan (GMT+5)** and currency **PKR**.
3. **Data Streams → Web →** enter `https://www.weddingwala.pk` → you get a **Measurement ID** `G-XXXXXXXXXX`.

### 2.2 Wire the Measurement ID into the site
The app reads SEO/analytics config from env vars (e.g. social profiles use `NEXT_PUBLIC_SOCIAL_*`). Add the GA4 tag:
- **Preferred:** set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` in Vercel env, and render the GA4 gtag snippet in `app/layout.tsx` (use Next's `next/script` with `strategy="afterInteractive"`). *(If no GA component exists yet, this is a ~15-line add — ask me to wire it.)*
- **Or:** connect GA4 through **Google Tag Manager** if you already run GTM.
> ⚠️ Do not hard-code the ID in source — use the env var so it differs per environment and isn't committed.

### 2.3 Link GA4 ↔ GSC (do both directions)
- GA4 **Admin → Product links → Search Console links → Link** to the GSC property. This unlocks the **Reports → Search Console** collection inside GA4 (organic queries + landing pages alongside engagement).

### 2.4 Mark conversions
Define what a "win" is so organic ROI is measurable:
- Vendor enquiry / booking request submitted
- "Contact vendor" / WhatsApp click
- Budget calculator used (`/wedding-cost-in-pakistan`)
Mark these events as **Key events (conversions)** in GA4 once the events fire.

---

## 3. Also worth doing (same session, 10 min)

- **Bing Webmaster Tools** (https://www.bing.com/webmasters) — import directly from GSC in two clicks. Bing feeds **Microsoft Copilot** citations, and it's near-free incremental coverage.
- **IndexNow** (optional) — Bing/Yandex instant-submit; the codebase references an IndexNow protocol in the technical-SEO notes.
- **robots.txt** — confirm it points at `https://www.weddingwala.pk/sitemap.xml` (single sitemap now) and does **not** block `GPTBot` / `Google-Extended` / `PerplexityBot` (we want AI-search visibility for the schema-rich pillars).

---

## 4. What "good" looks like (first 90 days, greenfield)
- **Week 1–2:** sitemap processed; pillars move from "Discovered" → "Indexed". First impressions appear.
- **Week 3–6:** long-tail pillar queries start ranking (positions 20–50), especially the low-competition legal/cost/guide topics.
- **Month 2–3:** with backlinks + GBP underway, the winnable commercial terms (`wedding photographer {city}`, cost queries) climb toward page 1.
- **The lead indicator to trust:** rising *impressions* in GSC Performance — that means Google is showing the pages. Clicks follow position. If impressions are flat after 3–4 weeks of being indexed, the bottleneck is **authority (backlinks)**, not content.

> Reminder: the free-tier Ubersuggest volumes we used are directional. Once GSC has 2–4 weeks of data, **GSC becomes the source of truth** — prioritise expanding the pillars/keywords that are already getting impressions.

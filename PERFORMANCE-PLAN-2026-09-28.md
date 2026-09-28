# Wedding Wala — making the portal fast

**Measured 2026-09-28 against production** (`weddingwala.pk` + `ems-v0-backend-production.up.railway.app`), not estimated. Every number below has a method behind it in §2, and the instruments are in §9 so any of it can be re-run and disputed.

---

## 0. The headline, before the detail

**The backend is not slow.** The database answers the heaviest list query in **6.4 ms**. A single API request costs **~50–250 ms of server work**. Twenty-five simultaneous catalog requests returned **zero errors** at p50 1.2 s. Brotli compression is on and squeezing a 743 KB response into 19.8 KB.

**The portal is slow, and it is slow because of what the browser is asked to do.** On a mid-range Android on 4G — which is most of this market:

| page | First Contentful Paint | Largest Contentful Paint | Total Blocking Time | long tasks |
|---|---|---|---|---|
| **home** | 2,588 ms | **7,472 ms** | **8,067 ms** | 59 (worst single task **2,375 ms**) |
| **/search** | 2,080 ms | 4,832 ms | 4,543 ms | 26 (worst 1,351 ms) |
| **venue city page** | 2,652 ms | 4,904 ms | 2,229 ms | 13 (worst 820 ms) |

Google's thresholds are LCP ≤ 2,500 ms and TBT ≤ 300 ms. Every page fails both. **Eight seconds of blocked main thread** on the homepage means eight seconds where a tap does nothing — that is the "very very very slow" the owner is describing, and it is not the server's fault.

The single biggest cause, stated plainly:

> **The homepage downloads all 3,272 vendors — 17 paginated requests, ~16.7 MB of JSON to parse — in order to render a list of the ten most common city names.** `/search` downloads the same catalog again and then re-implements, in JavaScript, filters the server already supports.

Fixing that one thing is most of the win. It needs no new infrastructure, no Redis, no Elasticsearch, and no rewrite.

The second-biggest cause is smaller to fix and was measured directly: **Google Analytics accounts for 1,371 ms of the venue page's 2,080 ms of blocking time, and 2,710 ms of the homepage's.** Half a day's work.

A warning about the two problems being separate: the venue city pages make **zero** API calls and *still* fail both thresholds. Fixing the catalog download alone would leave every SEO landing page slow.

---

## 1. Method, and what the numbers do and do not mean

| instrument | what it measured | caveat that matters |
|---|---|---|
| `perf-api.cjs` | 13 endpoints, 3 runs each, median | Run from this laptop. My own round-trip to Railway is **~290 ms**, so subtract that from every absolute figure. `/health` took 286–517 ms doing nothing at all — that is the floor of my instrument, not the server. |
| `perf-db2.cjs` | production Postgres: table sizes, index coverage, `EXPLAIN (ANALYZE, BUFFERS)` | Read-only: `SELECT` and `EXPLAIN` only. My round-trip to the DB **proxy** is ~350 ms and the deployed app does **not** pay it (it uses Railway's private network). Only `EXPLAIN`'s own `actual time` and the row counts transfer. |
| `perf-load.cjs` | bursts of 1, 10 and 25 | Deliberately light. Ten simultaneous requests is ten people loading a page — normal traffic. No sustained load test was run against production. |
| `perf-page2.cjs` | production in a real browser, `PerformanceObserver` registered via `addInitScript` | Round 1 reported "0 long tasks, LCP n/a" and was **void**: `getEntriesByType("longtask")` returns nothing unless an observer was buffered before page scripts ran. Cross-origin resource timing also hides `transferSize` without `Timing-Allow-Origin`, so byte sizes come from Playwright, not the page. |
| `perf-mobile.cjs` | 390 px viewport, CPU throttled 4×, network shaped to 4G (4 Mbps, 150 ms latency) | A 4× CPU throttle approximates a mid-tier Android against this laptop. Directionally right; not a specific handset. |
| `perf-js.cjs` | script counts and decoded JS bytes | Its **coverage percentages were wrong** (nested V8 ranges, everything read "100 % used") and are **discarded**. The byte counts stand. |

Two things I checked and found **not** to be problems, so nobody spends a month on them:

- **Compression.** Brotli is active. 761 KB of JSON leaves as 19.8 KB (2.6 %). Bandwidth is not the issue; **parsing** is.
- **Join fan-out.** The list query LEFT JOINs packages and menus, which is the classic Sequelize cartesian trap — but measured, 3,313 businesses expand to only **5,129 rows** (1.55×). Not an explosion.

---

## 2. The evidence

### 2.1 Per request, the backend is fine

```
endpoint                                 median   wire     uncompressed  rows
health/baseline                           517ms                               <- my RTT floor, ~290ms
businesses p1 limit=200                   535ms   19.8kb   743kb          200
businesses p1 limit=20                    342ms    ~2kb      80kb           20
businesses-by-vendor Photographer         405ms   19.8kb   738kb          200
vendor bookings list                      346ms                            50
revenue breakdowns this_year              311ms
leads list                                322ms                            80
```

Subtract ~290 ms of my own latency and the server is doing **50–250 ms of work per request**. There is no endpoint here that needs rescuing.

### 2.2 The database is tiny, and fast

```
Businesses       3,354 rows    7 MB      Bookings           720 rows
Notifications   11,940 rows    3 MB      BookingDetails     720 rows
OutboxEmails     5,122 rows   16 MB      Users               51 rows
```

The whole database is roughly 40 MB. The `count(DISTINCT …)` half of `findAndCountAll`, joined across Users + Packages + Menus:

```
Aggregate (actual time=6.464..6.468 rows=1)   Buffers: shared hit=813
```

**6.4 ms, entirely from cache, zero disk reads.** Index tuning is not the lever here. It becomes one at 10–100× the data, which is §5 Phase 6.

Worth recording anyway: **810 indexes exist**, and yet **10 of 22 hot columns have no index with that column leading** — `Businesses.userId`, `minimumPrice`, `maxCapacity`, `subBusinessType`, `createdAt`, `BookingDetails.bookingDate`, `Bookings.userId`, `Bookings.createdAt`, `Favorites.userId`, `Users.reviewProfile`. At 3,354 rows a sequential scan costs ~4 ms so nothing hurts today. And **`pg_stat_statements` is not installed**, which means the database currently cannot tell us its own slowest queries.

### 2.3 Under concurrency it degrades gracefully

```
 1 request,  catalog page            955ms
10 at once,  catalog page   p50 1,185ms   p95 1,196ms   non-200: 0
10 at once,  20 rows        p50   426ms   p95   590ms   non-200: 0
25 at once,  catalog page   p50 1,234ms   p95 1,568ms   non-200: 0
```

Nothing falls over. Note the shape though: 25 concurrent **20-row** requests would be trivial, while 25 concurrent **200-row** requests cost the process 25 × (743 KB serialize + brotli compress). The ceiling is CPU spent on payloads nobody needed.

### 2.4 One homepage view, as the client actually requests it

```
36 API calls, of which:
   17 × /businesses?page=1..17&limit=200        <- the entire catalog
   18 × /businesses/businesses-by-vendor?...&limit=200
    1 × /platform-stats

23 of those fired together:  wall 1,606ms   p50 1,294ms   max 1,595ms
  on the wire (brotli):  ~455 KB     <- fine
  decompressed:         15.33 MB     <- what the browser must JSON.parse
one catalog page uncompressed: 743 KB  =>  ~16.7 MB parsed per homepage view
```

And the reason, from the source:

- `components/homepage/hero-section.tsx:76` calls `useVendors()` → `fetchAllBusinessPages` → **every page of the catalog**. What it does with it: counts cities to show ten chips, and name-matches "hall|palace|banquet|garden" to guess which vendors are venues.
- Four more homepage sections each call `useVendorsByType(type)`. That hook tries the shared cache first — but all sections mount at once, the cache is still empty, so each one falls through to **its own full download**. That is the 18 per-type calls.

### 2.5 `/search` downloads the catalog to do what the server already does

`app/(main)/search/page.tsx` is `"use client"` with no SSR. It calls `useVendors()` (17 requests, the whole catalog) and then filters in a `useMemo` with roughly ten `.filter()` passes: text, category, city, price, rating, capacity, amenities…

Meanwhile `getBusinesses` in `src/controllers/businessController.js` **already implements server-side** `?q=`, `?city=`, `?minCapacity=`, `?maxBudget=`, `?vendorTypes=`, `?dietaryOptions=`, `?dietaryOptionsAny=`, `?availableOn=`, `?verifiedOnly=` and the whole Pakistani filter-chip set — with pagination. The frontend passes **none** of them.

### 2.6 Duplicate and uncached client fetches

Measured on `/dashboard/bookings`: **`/notifications/unread-count` requested 4×**, slowest **1,177 ms**. The cause is four independent callers, each with its own `useEffect` and raw fetch, none of them going through React Query:

```
components/dashboard/layout/champagne-shell.tsx:208
components/dashboard/layout/champagne-user-menu.tsx:35
components/dashboard/mainScreens/artifact/artifact-shell.tsx:816
context/NotificationContext.tsx:196
```

That is one instance of a pattern: **114 `useEffect` blocks call an API class directly** across 104 live files — no caching, no deduplication, no retry policy — against 92 files that do use `useQuery`.

The vendor dashboard fires **21 requests**, including five separate analytics calls (`/analytics/kpis`, `revenue-trends`, `booking-trends`, `recent-bookings`, `revenue-breakdowns`) at ~650 ms each, for one screen.

### 2.7 The JavaScript itself

```
home              41 script requests   1,339 KB decoded  (397 KB wire)
venue city page   48 script requests   1,430 KB decoded  (317 KB wire)
   largest single script on that page:  514 KB — Google Analytics (gtag)
```

The venue city page makes **zero API calls** and still blocks the main thread for **2,229 ms**. So the data problem and the JavaScript problem are **independent**, and fixing only the first would leave `/search` and every SEO landing page still failing LCP.

**How much of that is Google Analytics?** Measured, by running each page twice — as shipped, and with Tag Manager blocked:

| page | TBT as shipped | TBT with GTM blocked | recovered | LCP change |
|---|---|---|---|---|
| venue city page | 2,080 ms | **709 ms** | **−1,371 ms (66 %)** | 4,456 → 4,680 ms (noise) |
| home | 8,347 ms | **5,637 ms** | **−2,710 ms (32 %)** | 8,600 → **7,152 ms** |

One third-party tag owns **two-thirds of the blocking time** on the SEO landing pages, and 2.7 seconds of it on the homepage. Blocking is not the same as deferring, so treat these as the *upper bound* of what moving it off the critical path recovers — but the bound is large enough that this is the cheapest significant win in this document. On the venue page it alone takes TBT from 2,080 ms to within sight of the 300 ms target.

Also, the render strategies are inconsistent — and the fast one is already in the repo:

| page | strategy | API calls at runtime |
|---|---|---|
| `/wedding-venues/[city]` | `revalidate = 3600` + `generateStaticParams` | **0** |
| `/` | server shell, client-fetched data | 36 |
| `/search` | `"use client"`, no SSR at all | 17 |

### 2.8 Runtime and connection posture

- `start: node app.js` — **one process, one core.** No `cluster`, no worker threads, no `railway.json`/`Procfile` declaring replicas.
- Pool `min: 0`, `idle: 10000`, `evict: 5000` — **no connection is kept warm.** The config's own comment records that a 5-connection cap once made a 7-day availability grid take 23 s; `max` was raised to 15, but `min: 0` means a quiet period is followed by fresh TCP+TLS+auth handshakes.
- **71 loop-with-a-query sites** across controllers and services (a query per iteration), including `PaymentTransaction.sum` inside `for (const d of details)` twice in `analyticsController.js`.
- No Redis, no queue, no in-process read cache.

---

## 3. Root causes, ordered by what they cost the user

| # | cause | measured cost | fix effort |
|---|---|---|---|
| **C1** | Home + `/search` download the whole catalog | 35 requests, ~16.7 MB parsed, most of home's 8 s TBT | **S** |
| **C2** | List rows carry packages, menus, features, image arrays — 3.7 KB per row for a card that shows 6 fields | 743 KB where ~40 KB would do | **S** |
| **C3** | Client re-implements filtering the server already has | `/search` cannot ever be fast while it must hold every row | **M** |
| **C4a** | **Google Analytics on the critical path** | **1,371 ms of TBT on the venue page (66 %), 2,710 ms on home** — measured with/without | **XS** |
| **C4b** | 1.3–1.4 MB of first-party JS per page | 709 ms TBT still remains on a page that fetches nothing | **M** |
| **C5** | 114 uncached `useEffect` fetches; `unread-count` 4× per page; 5 analytics calls per dashboard | ~1.2 s of duplicate work per dashboard view | **S** |
| **C6** | One Node process; no read cache; cold pool | fine at today's traffic, the first thing to break at 10× | **M** |
| **C7** | Aggregates computed per row/per request (rating + reviewCount subqueries; sums in loops) | small today, superlinear later | **M** |
| **C8** | No `pg_stat_statements`, no RUM, no performance budget in CI | we are arguing from feel — including me, until today | **S** |

---

## 4. How systems at this scale actually solve this

Not a reading list — each item maps to a phase below, and several are already half-present in this repo.

1. **Never ship the corpus to the client.** Booking.com, Airbnb and Amazon return a page of 20–30 results from a server-side index. The client holds what is on screen. → Phase 1, 2.
2. **A search index separate from the write model.** Postgres full-text + `pg_trgm` first (free, already in Postgres); OpenSearch/Algolia only when relevance and facet counts outgrow it. → Phase 2, 6.
3. **Two shapes per resource: a list projection and a detail projection.** The list DTO is small and cacheable; detail is fetched on demand. → Phase 2.
4. **Cache in layers with explicit invalidation** — browser, CDN edge, application, database. Public catalog reads are the easiest possible CDN win: identical for every anonymous visitor. `stale-while-revalidate` means a cache miss never blocks a user. → Phase 4.
5. **Static/ISR for anything SEO cares about.** Already true of `/wedding-venues/[city]` here, which is why it makes zero API calls; the homepage and `/search` never got the same treatment. → Phase 1, 3.
6. **Precompute what you read often and write rarely.** Ratings, review counts, city counts, platform stats: denormalised columns or materialised views refreshed on write, not recomputed per row per request. → Phase 7.
7. **Horizontal scale behind a load balancer**, plus one process per core. A single Node process is a single core no matter how large the container. → Phase 5.
8. **Move slow work out of the request.** Email, notifications, webhooks, PDF generation go to a queue. → Phase 5.
9. **Measure in production, continuously.** p50/p95/p99 per route, slow-query logging, and Real User Monitoring — because the desktop number (LCP 1.9 s) and the phone number (LCP 7.5 s) differ by 4×, and only one of them is the customer. → Phase 0.
10. **Budgets enforced in CI.** A performance win that nothing defends is a performance win with a half-life. This repo just learned the same lesson about type errors — the ratchet is the model. → Phase 8.

---

## 5. The plan

Each phase states what, why (with the measured number), how (concrete), the target, and the risk. Phases 1–3 are the user-visible win. Phase 0 comes first because everything after it needs a scoreboard.

### Phase 0 — Make it measurable (½ day)

Nothing here makes the site faster. It makes every later claim checkable.

1. `pg_stat_statements` on the Railway database → the DB names its own worst queries instead of us guessing.
2. Per-route timing in the Express layer: log method, route, status, duration; emit p50/p95/p99. A 20-line middleware, no vendor needed.
3. Sequelize `benchmark: true` behind an env flag, plus a slow-query log above 200 ms.
4. Real User Monitoring on the frontend: report FCP/LCP/CLS/INP from actual visitors (`web-vitals` → an existing analytics endpoint). **This is the only number that matters**, and right now nobody has it.
5. Commit the six measurement scripts from §9 into `scripts/perf/` so before/after is reproducible by anyone.

**Acceptance:** a dashboard (or logged summary) showing p95 per route and field LCP by device class.

### Phase 0.5 — Get Google Analytics off the critical path (half a day) ← best ratio in this document

**Why:** measured, it costs **1,371 ms of blocking time on the venue city page (66 % of that page's total)** and **2,710 ms on the homepage**. It is 514 KB, the largest single script on a page that otherwise fetches nothing, and it is loaded in a way that competes with the page's own hydration.

**How:** `next/script` with `strategy="lazyOnload"`, or load on first interaction / `requestIdleCallback`. If that still costs too much, the options in order of effort are a lighter measurement client, GA4 via the Measurement Protocol server-side, or Partytown to move it to a worker.

**Target:** venue city page TBT under 800 ms from this change alone; no loss of page-view or conversion data.
**Risk:** this is the owner's call, not mine — deferring the tag changes *when* events fire and can drop events from visitors who leave within a second or two. Bounce-heavy pages are exactly where that matters. Verify in GA4's realtime view after deploying, and be ready to revert.

### Phase 1 — Stop shipping the catalog (2–3 days) ← most of the win

**Why:** 35 requests and ~16.7 MB of JSON per homepage view, to render about 30 cards.

1. **`/platform-stats` (or a new `/businesses/facets`) returns the city counts.** The hero section downloads 3,272 vendors to compute ten city names; that is one `GROUP BY city` the database answers in single-digit milliseconds.
2. **The homepage becomes server-rendered with ISR**, exactly like `/wedding-venues/[city]`: fetch the 6–8 cards per section on the server, `revalidate = 300`. Runtime API calls from the browser: **0**.
3. **Homepage sections stop each fetching their own list.** One server fetch per section, passed down as props. Delete the `useVendorsByType` fan-out from the homepage entirely.
4. **`useVendors()` is retired as a page-level data source.** It is the primitive that makes "download everything" easy, and three live callers use it (`hero-section`, `/search`, `favorites-preloader`). Keep a narrow version for the favourites preloader if it genuinely needs ids, and make even that fetch ids only.
5. **Kill the `fetchAllBusinessPages` walk on user-facing paths.** It is correct and necessary for `app/sitemap.ts` (a build-time job); it has no business running in a browser.

**Target:** home ≤ 3 API calls, ≤ 150 KB of JSON parsed, LCP < 2.5 s and TBT < 600 ms on the throttled phone.
**Risk:** low. The hero's "is this a venue?" name-matching heuristic must be replaced by a real type filter — which is a correctness improvement, not a regression.

### Phase 2 — Slim payloads and let the server search (3–5 days)

**Why:** 3.7 KB per row for a card that shows name, city, price, rating, image, type. And `/search` re-implements in JS what `getBusinesses` already does in SQL.

1. **A `?view=card` (list) projection** on `/businesses`: id, slug, name, city, type, minimumPrice, rating, reviewCount, one image, verified flag, sponsored. Drop packages, menus, features and image arrays from the list response. Expected: 743 KB → **~40 KB** per 200 rows, and correspondingly less CPU serializing and compressing.
2. **`/search` moves to server-driven filtering and pagination.** Every filter the page owns already exists as a query param — pass them, take 24 rows, paginate. Keep the URL as the source of truth so a filtered search is shareable and cacheable.
3. **Facet counts from the server** ("Karachi 412") via one aggregate query, rather than counting a client-side array.
4. **Postgres full-text + `pg_trgm`** for `?q=`, replacing the multi-word `hay()` scan the client does now. Tolerates typos, ranks results, and gets an index.
5. **Cursor pagination** (`?after=<id>`) for deep pages; `OFFSET 3200` degrades as the catalog grows.
6. **One composite `/analytics/dashboard` endpoint** replacing the five calls the dashboard makes, resolved concurrently server-side. Five round-trips at 650 ms become one.

**Target:** `/search` first paint under 1.5 s on the throttled phone; any filter change ≤ 1 request ≤ 50 KB.
**Risk:** medium — this is where behaviour can subtly change. Every filter needs a test asserting the same result set as today's client-side logic before the client version is deleted.

### Phase 3 — Cut the JavaScript (3–4 days)

**Why:** 1.3–1.4 MB decoded per page, and 2,229 ms TBT on a page that fetches nothing.

1. **Google Analytics off the critical path.** 514 KB and the largest script on the venue page. Load it after first interaction or on idle (`next/script` `strategy="lazyOnload"`), or move to a server-side/lightweight measurement path. Measure the delta; do not assume it.
2. **Audit what forces client-side rendering.** `/search` is `"use client"` for the whole page; most of it is presentational. Push interactivity to leaf components and let the rest be server-rendered.
3. **Find the 2,375 ms task.** One long task on the homepage blocks for 2.4 s — profile it, name it, split it. A task that long is usually one synchronous loop over a large array, which Phase 1 may delete outright.
4. **Trim the animation library surface.** `framer-motion` imported into many public components is a large client dependency; static sections should not carry it.
5. **Route-level code splitting review.** 41–48 script requests per page suggests chunks that could be merged or deferred.
6. **`next/image` everywhere above the fold**, with explicit `sizes` and `priority` on the LCP image only. Config is already correct (AVIF/WebP, 30-day TTL) — the wins left are in usage.

**Target:** ≤ 600 KB decoded JS on public pages; TBT < 300 ms on the throttled phone; LCP < 2.5 s on every public template.
**Risk:** low-to-medium. Moving analytics changes data collection timing — the owner should confirm that trade.

### Phase 4 — Cache in layers (2 days)

**Why:** anonymous catalog reads are identical for every visitor and are currently computed from scratch every time.

1. **CDN caching on public GETs.** `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` on the catalog, facets and platform stats. The pattern exists in `express.js` already (`public, max-age=60, stale-while-revalidate=120`) — it needs applying to the endpoints that matter, and `Vary: Authorization` is already set so authed responses stay private.
2. **A small in-process LRU** (60–300 s) for facets, platform stats and the first page of the default catalog. No Redis yet: one process, tiny data, and an LRU costs nothing. Redis becomes right when Phase 5 makes multiple processes need a *shared* cache.
3. **ETag / `If-None-Match`** on list endpoints so an unchanged page is a 304.
4. **Persist the React Query cache** (IndexedDB) for the vendor dashboard, so a returning vendor sees data instantly and revalidates behind it.

**Target:** cache hit ratio > 80 % on public catalog reads; repeat homepage view issuing zero uncached API calls.
**Risk:** low, but invalidation must be deliberate — a vendor editing their listing must not wait 5 minutes to see it. Note the existing related trap: public vendor pages already cache backend data for an hour with no on-demand revalidation, which has previously looked like "my edit disappeared". Fix that in the same pass with on-demand revalidation.

### Phase 5 — Scale the runtime (1–2 days)

**Why:** one process is one core, however big the container.

1. **One worker per core**, via `cluster` in `app.js` or Railway replicas + its load balancer. Sessions are JWT-based so nothing is process-local — check the Socket.io path, which needs a shared adapter once there are multiple processes.
2. **Pool `min: 2`** so a quiet period is not followed by a TLS handshake. `max: 15` per process × N processes must stay under the Postgres connection ceiling — size it, do not guess it.
3. **Move email/notification/webhook work out of the request** onto a queue (the `OutboxEmails` table at 5,122 rows is already an outbox — finish the pattern with a worker).
4. **Fix the 71 loop-with-a-query sites**, starting with the two `PaymentTransaction.sum` loops in `analyticsController.js`: one grouped aggregate replaces N queries.

**Target:** linear throughput with cores; p95 stable under 100 concurrent users.
**Risk:** medium. Multi-process breaks anything holding state in memory — that includes the Phase 4 LRU (fine, per-process) and Socket.io (not fine without an adapter).

### Phase 6 — The database, for 10–100× (2–3 days, not urgent)

**Why:** 6.4 ms today. These are the things that stop it becoming 600 ms at 300k rows.

1. **Add the 10 missing leading-column indexes** listed in §2.2. Cheap now, and they only get more expensive to add later.
2. **Review the 810 existing indexes** — that is a lot for 40 MB, and unused indexes cost write throughput. `pg_stat_user_indexes` names the ones never scanned.
3. **Denormalise `rating` and `reviewCount` onto `Businesses`**, maintained on review write. Removes two correlated subqueries per row from every list response.
4. **Read replica** for analytics/reporting once those queries start competing with transactional traffic.
5. **Partition or archive** `OutboxEmails`, `Notifications`, `ActivityEvents` — they are already the three biggest tables and they only grow.

### Phase 7 — Precompute the hot aggregates (2 days)

City counts, platform stats, per-type counts, facet counts: materialised views or summary tables refreshed on write or on a schedule. Read-often, write-rarely. Phase 1 needs a cheap version of this immediately; this phase makes it principled.

### Phase 8 — Keep it fast (1 day, then forever)

1. **Lighthouse CI on every PR**, mobile preset, failing the build on LCP/TBT/bundle-size regression. Same shape as the TypeScript ratchet that now gates this repo: a number that can only go down.
2. **A payload-size assertion in the API tests** — if `/businesses?limit=200` ever exceeds ~60 KB again, a test fails and names the field that grew.
3. **Watch the field RUM data from Phase 0**, by device class. Desktop said 1.9 s; the phone said 7.5 s. Only one of those is a customer.

---

## 6. Targets

| metric | today (measured) | after Phase 1–2 | after Phase 3–4 |
|---|---|---|---|
| home, API calls | 36 | ≤ 3 | ≤ 1 (cached) |
| home, JSON parsed | ~16.7 MB | < 150 KB | < 100 KB |
| home, LCP (mid Android/4G) | 7,472 ms | < 3,000 ms | **< 2,000 ms** |
| home, TBT | 8,067 ms | < 1,000 ms | **< 300 ms** |
| `/search`, API calls | 17 | 1 per filter change | 1, edge-cached |
| `/search`, LCP | 4,832 ms | < 2,500 ms | < 1,800 ms |
| venue city page, TBT | 2,229 ms | **< 800 ms** (Phase 0.5 alone) | **< 300 ms** |
| dashboard, API calls | 21 | 12 | 12, warm-cached |
| catalog response, 200 rows | 743 KB | ~40 KB | ~40 KB, 304 on repeat |
| p95 under 25 concurrent | 1,568 ms | < 500 ms | < 200 ms |

---

## 7. What I deliberately would **not** do

- **Not Redis, yet.** One process and 40 MB of data. An in-process LRU wins now; Redis earns its place in Phase 5 when processes must share a cache.
- **Not Elasticsearch/Algolia, yet.** Postgres FTS + `pg_trgm` handles 3,354 rows and will handle 100k. Revisit when relevance tuning or cross-facet counting becomes the actual complaint.
- **Not an index-tuning project first.** The heaviest query is 6.4 ms. Doing Phase 6 first would be measurable, publishable work that a user would not feel at all.
- **Not a rewrite.** Express + Sequelize is not the bottleneck; at 250 ms of server work per request, the language is irrelevant.
- **Not more Railway instances as step one.** Scaling a system that asks for 35 catalog pages per page view just buys the same waste in parallel. Phase 1 first, then Phase 5.
- **Not HTTP/2 push, service-worker precaching of the catalog, or other clever workarounds** for shipping too much data. Send less.

---

## 8. Where I would start

**Two changes, in this order, are worth more than everything else combined:**

1. **Google Analytics off the critical path** (half a day). Measured to recover **1,371 ms** of blocking time on the venue city page and **2,710 ms** on the homepage. Nothing else in this document has that ratio of hours to milliseconds.
2. **Give the hero section a real endpoint for city counts** and stop it calling `useVendors()` (one day). That single change deletes 17 requests and ~12 MB of JSON parsing from the most-visited page in the product.

**Then, in order:** Phase 0 (so the scoreboard exists before the big changes) → the rest of Phase 1 → Phase 2 → Phase 3.

Two things need the owner's decision before I touch them:
1. **Moving Google Analytics off the critical path** changes when and whether events are collected.
2. **Server-driven `/search`** changes the URL contract — filters become shareable links, which is better for SEO and for users, but it is a product-visible change.

---

## 9. The instruments

All in the session scratchpad, to be committed to `scripts/perf/` in Phase 0:

| script | what it does |
|---|---|
| `perf-api.cjs` | endpoint timing, 3 runs, median, sizes, row counts |
| `perf-db2.cjs` | read-only DB introspection: sizes, index coverage, `EXPLAIN ANALYZE` |
| `perf-load.cjs` | light concurrency bursts + a simulated full homepage request set |
| `perf-page2.cjs` | production page vitals with correctly buffered observers, public + authed |
| `perf-mobile.cjs` | the same, throttled to a mid-range Android on 4G |
| `perf-3p.cjs` | first-party vs third-party JS, measured with and without |

**Re-run before and after every phase.** The reason this plan says "measured" everywhere is that the first two versions of my own instruments lied to me — a "0 long tasks" that meant "no observer", and a "100 % of JS used" that meant "broken range arithmetic". Any number here that cannot be reproduced by these scripts should be treated as suspect.

# 05 — Authority & Link-Building (DA 1 → DA 35+ over 24 months)

> Purpose: the off-page authority engine — the single highest-leverage variable in this whole plan. We start at **0 backlinks / 0 referring domains / DA 1**; shadiyana.pk sits at **DA 22, ~10,312 backlinks / ~850 referring domains**. Closing that gap is *the* moat. Everything in 02-keyword-universe.md, 03-content-engine.md, and 04-programmatic-architecture.md is necessary but **not sufficient** without authority — pages without links do not rank for contested head terms.

---

## 1. The honest framing

Authority is a **lagging, compounding** metric. You cannot buy your way to DA 35 in a quarter without burning the domain. **Plan of record = the BASE case: ~180 RD / DA ~20 at M12 and ~350 RD / DA ~28 at M24** (matching 01-traffic-model-to-1M.md and 08-24-month-roadmap.md) — this is what we build and budget for, and it still unlocks the bulk of commercial rankings. The headline ~640 RD / DA 32–37 growth curve in §2 is the **AGGRESSIVE scenario** — the ceiling that supports the 1M-visitor stretch, never the default. **Gate decisions on RD count, not DA (DA is directional).** **Referring domains (unique linking sites) matter far more than raw backlink count** — 850 referring domains is the number to chase, not 10,000 links. We optimize for *quality, relevance, and Pakistani-context links*, never volume for its own sake.

Why this is winnable: shadiyana's 850 referring domains accumulated over ~8 years, largely passively (venue owners linking back, a handful of press hits). They have **no active PR engine and no vendor-reciprocity program**. We will run both deliberately from month one. Relevance is our edge — a link from a Lahori wedding photographer's site is worth more for *our* topical authority than a generic DA-50 directory.

---

## 2. The 24-month referring-domain growth curve

Targets are **referring domains (RD)** — unique linking root domains — because that is what moves DA. **Gate decisions on RD count, not DA (DA is directional).** Backlink count will run 8–15× RD. DA is Moz's 1–100 log scale; gains get exponentially harder near the top, so the curve front-loads "easy" foundational links and back-loads hard-won editorial/PR links.

**Plan of record (BASE) — build and budget to this:** ~180 RD / DA ~20 at M12, ~350 RD / DA ~28 at M24 (matching 01-traffic-model-to-1M.md and 08-24-month-roadmap.md).

The phase table below traces the **AGGRESSIVE scenario** — the ~640 RD / DA 32–37 ceiling that supports the 1M-visitor stretch, never the default:

| Phase | Months | New RD / mo (target) | Cumulative RD | Est. DA | Dominant link type |
|---|---|---|---|---|---|
| **Foundation** | 1–3 | 12–18 | ~45 | 6–10 | Citations, social, GBP, NAP |
| **Reciprocity ramp** | 4–6 | 18–25 | ~110 | 12–15 | Vendor "Featured on" badges |
| **Content + outreach** | 7–9 | 20–28 | ~185 | 16–19 | Guest posts, blogger swaps |
| **First PR flywheel** | 10–12 | 22–30 | ~260 | 20–23 | Wedding Season Report press |
| **Scale** | 13–18 | 25–35 | ~440 | 26–30 | Mixed: PR + reciprocity + editorial |
| **Authority consolidation** | 19–24 | 30–40 | ~640 | **32–37** | Editorial, second annual report, partnerships |

**Read:** the ~640 RD / DA 32–37 endpoint above is the **AGGRESSIVE** ceiling (≈ shadiyana's *current* profile, while they're roughly static). The **BASE plan of record is ~350 RD / DA ~28 at M24** (~180 RD / DA ~20 at M12) — even the base is enough to contest most {vendor-type}×{city} and bridal-dress commercial terms. **Gate go/no-go on RD count, not DA (DA is directional).** **Monthly link velocity must look organic** — a smooth ramp, no spikes that trip spam detection. Pair every month's velocity target with a *relevance* check, not just a count.

---

## 3. Foundation layer — citations & NAP (Months 1–3, do first)

These are table-stakes, mostly free, and establish entity consistency for local-pack and AI-citation eligibility. **NAP (Name, Address, Phone) must be byte-identical everywhere** — "Wedding Wala", a single Pakistani business address, one phone, https://www.weddingwala.pk. (Internal note: scrub the legacy "AJOINT" alias from any directory it leaked into; it fractures the entity.)

**Core citations (week 1–2):**
- **Google Business Profile** — the highest-value single citation; category "Wedding Service / Wedding Planner", service-area covering all 12 cities, weekly Posts, Q&A seeded, photos from /real-weddings.
- **Bing Places** — feeds Microsoft Copilot citations; mirror GBP exactly (see 06-technical-geo.md for AI-search/GEO).
- **Apple Business Connect** + **OpenStreetMap/Nominatim** — completes the NAP-verification quartet.

**Pakistani directories & high-authority local citations:**
- Locanto.com.pk, OLX.com.pk (business listing), PakBiz, Pakistan Business Directory, Findpk, Tuugo.pk, Pakistanidirectory, Brandsynario business listings.
- **UrduPoint** — major PK portal (DA-strong); pursue a business listing *and* an editorial/directory placement.
- Wedding-niche aggregators: Shaadi-vendor directories, Hitched-PK-style listings, regional event-portal listings.

**Social profile links (consistent NAP, linked bio):**
- Instagram (primary — wedding is visual; drives Pinterest/IG referral too), Facebook Page + Facebook Business, YouTube (real-wedding films), Pinterest (critical — mehndi/bridal-dress informational intent funnels here; see the ~673K/mo "mehndi design" universe), TikTok, LinkedIn company page, X.

Foundation realistically yields **40–50 RD** and a DA bump to ~6–10 by month 3. Verify each citation indexes (IndexNow submit + GSC URL inspection).

---

## 4. The vendor-reciprocity engine (the scalable core)

This is our structural advantage and the most defensible link source: **every vendor we list gets a "Featured on Wedding Wala" badge + link to embed on their own site.** Wedding vendors (photographers, makeup artists, venues, decorators) almost all have a website or a Linktree, and they *love* third-party validation to show clients.

**Mechanics (additive, flag-gated — see 04-programmatic-architecture.md):**
1. On each `/vendor/[slug]` detail page, render a **"Get your Featured badge"** CTA in the vendor dashboard.
2. Provide a copy-paste HTML snippet: an `<a href>` to their profile URL with an `<img>` badge (host the badge asset; alt text = vendor name). Anchor text rotates naturally — vendor name, "Featured on Wedding Wala", "View our Wedding Wala profile" — **never** exact-match commercial anchors at scale (that's a footprint risk; see §9).
3. Email/WhatsApp onboarding sequence to all listed vendors: "You're live — here's your badge."
4. Quarterly "Top-Rated Vendor 2026" awards → a higher-prestige badge vendors are eager to display (these earn the most natural embeds).

**Volume math:** if 1,000 vendors are listed over 24 months and even **15–20% embed the badge**, that's **150–200 RD** from hyper-relevant, in-niche Pakistani wedding sites — a third of the entire RD target, on autopilot. These are the most topically relevant links we can get. **Honesty caveat:** badge links are partially reciprocal; keep the ratio of reciprocal-to-editorial links healthy by pairing this engine with the PR and editorial work below, and never make listing *conditional* on linking (that violates Google guidelines).

---

## 5. Digital PR flywheel (the DA-30+ unlock)

Foundational + reciprocal links get us to ~DA 20. Crossing into the high-20s/30s requires **editorial links from real publications**. Three repeatable plays:

### 5a. Annual "Pakistan Wedding Season Report" (the hero asset)
Once a year (publish ~October, ahead of **Decemberistan** season), produce an original-data report: *The Pakistan Wedding Season Report* — using **Google Trends** data (search interest for mehndi designs, bridal dresses, venues by city/month), our own aggregate vendor-pricing ranges (PKR), booking-timing patterns, and city-by-city demand. Original data = the one thing journalists reliably link to.

- **Pitch targets:** Dawn (Images/lifestyle desk), Express Tribune, Business Recorder (the wedding *economy* angle — PKR billions spent, vendor employment), The News, Brandsynario, ProPakistani (the search-trends/data angle).
- **Angles that land:** "Pakistanis now plan weddings X months earlier," "Mehndi searches peak in [month]," "Average barat/walima vendor cost by city," "Decemberistan by the numbers."
- One strong national hit (Dawn/Tribune) is a DA-50+ editorial link **plus** syndication tails (regional papers re-running it). Target **8–15 RD per report cycle**, with the report page itself becoming a perennial citation magnet.

### 5b. Real-wedding features that credit vendors
Every story on `/real-weddings` credits each vendor by name with a link to their profile — and we **notify each credited vendor**, who routinely link back to "our feature on Wedding Wala" and share socially. This compounds the reciprocity engine with genuine editorial-style content. Couples also share, earning personal-blog/social links.

### 5c. Styled-shoot & trend pitches to wedding media
Partner with photographers/decorators on **styled shoots** (a low-cost, high-output content + link play) and pitch the resulting galleries to **Mashion, Diva Magazine, Brides of Pakistan, Something Haute, Galaxy Lollywood (celeb-wedding angle)**. Each feature credits all collaborators (more reciprocal shares) and earns a magazine editorial link. Target **3–6 styled-shoot placements/year**.

---

## 6. Guest content, blogger & photographer partnerships

A steady mid-tier RD stream between the big PR moments:

- **Guest posts** on PK lifestyle/wedding/parenting blogs and Medium-style PK publications — genuinely useful articles (e.g. "How to budget a Lahore walima in 2026"), one contextual link to a relevant pillar (see 03-content-engine.md), not the homepage.
- **Photographer/MUA cross-promotion:** beyond the badge, co-create content ("5 mehndi looks by [artist]") published on both sites with mutual links — relevant, natural, repeatable.
- **Micro-influencer & wedding-blogger collabs:** gift features / co-branded checklists embedding our /planning-tools (budget/checklist/timeline) — linkable, useful assets that bloggers cite.
- **University/community angles:** sponsor or contribute data to bridal expos, wedding fairs (Bridal Couture Week tie-ins) — event sites and recap articles link to sponsors.

Target **5–8 RD/mo** from this lane during Phases 3–6.

---

## 7. HARO / journalist & reactive outreach

Run reactive PR continuously:
- **HARO / Qwoted / Featured.com / SourceBottle** — answer journalist queries on weddings, events, small-business, South-Asian culture, e-commerce/marketplace topics with a quotable expert reply from a named Wedding Wala spokesperson (E-E-A-T: real person, real title).
- **Reactive newsjacking:** when a celebrity wedding or a viral wedding-trend story breaks, publish a fast data-backed take and pitch it same-day (Reddit r/pakistan and Google Trends are early signal sources — see §8).
- Target **2–4 RD/mo** of editorial links here; low hit-rate but high authority per win.

---

## 8. Running link-building on the MCP stack

Operationalize prospecting and qualification with the connected servers:

| Job | Tool(s) | How |
|---|---|---|
| **Find link prospects** | serper, exa, g-search | Search "pakistani wedding blog", "write for us wedding pakistan", "{city} wedding photographer blog", competitor backlink anchor footprints |
| **Steal competitor links** | ubersuggest `backlinks` / `linking_domains` / `backlink_opportunity` on shadiyana.pk | Pull their ~850 RD; filter to repeatable/contactable sources; replicate |
| **Qualify a prospect** | firecrawl, fetch | Scrape the prospect: DA proxy, contact page, outbound-link health, whether they accept guests; auto-reject spammy/PBN sites |
| **Story angles & demand** | google-trends, reddit (r/pakistan, r/PAK), tavily | Source data points and trending wedding topics for the annual report + newsjacking |
| **Get hits indexed fast** | indexnow | Submit new earned-link target pages + the report page the moment they go live |
| **Track RD growth** | ubersuggest `backlinks_overview`, GSC Links report, bing-webmaster | Monthly RD/DA tracking vs the §2 curve; **GSC is the source of truth once connected — Step Zero** |
| **Validate badge schema** | schema-org | Ensure badge/profile pages emit clean Organization/LocalBusiness JSON-LD |

Build a simple prospects sheet (status: identified → qualified → contacted → won) and review against the monthly velocity target. **Connect GSC/GA4/Bing first** — real link data replaces directional Ubersuggest numbers (see GSC-GA4-SETUP.md).

---

## 9. Toxic links & disavow note

With aggressive acquisition, monitor for harm:
- **Audit quarterly** via GSC Links + Ubersuggest backlinks for: sudden RD spikes, irrelevant/foreign-language spam, link-farm/PBN footprints, comment-spam, exact-match commercial anchors at scale.
- **Anchor-text hygiene:** keep branded ("Wedding Wala") + naked-URL + generic anchors dominant; commercial-keyword anchors well under ~10% of the profile to avoid over-optimization.
- **Disavow conservatively.** Google mostly ignores spam now; only disavow if you see (a) a clear negative-SEO attack, or (b) a manual action. Maintain a `disavow.txt` but submit only with cause — careless disavowing of borderline-good links does more harm than the spam.
- **Never buy links, never join link schemes, never make a vendor listing contingent on a link.** One sustained penalty erases two years of compounding. This is live production — every off-page action stays additive and guideline-safe (see live-system-safety standard).

---

## 10. Monthly link-velocity scorecard (track this)

| Metric | Target | Source |
|---|---|---|
| New referring domains / mo | per §2 curve (12 → 40) | GSC / Ubersuggest |
| Reciprocity badge embeds / mo | 8–15 (ramping) | Backlink scan for badge URL |
| Editorial/PR links / quarter | 8–15 (report) + 2–4/mo HARO | Manual + GSC |
| Branded-anchor share | dominant (>50%) | Ubersuggest `anchor_texts` |
| Commercial-anchor share | < 10% | Ubersuggest `anchor_texts` |
| Toxic-link flags | reviewed quarterly | GSC + audit |
| DA trajectory | per §2 curve | Ubersuggest (directional) |

**Bottom line:** authority is the rate-limiter on the entire 1M-visitor plan. The reciprocity engine gives us a relevant link compounding loop nobody else in PK wedding is running; the annual Wedding Season Report gives us the editorial DA jumps; foundational citations and HARO fill the gaps. Execute the velocity curve steadily, keep anchors clean, and the BASE plan of record — ~350 RD / DA ~28 by month 24 (~180 RD / DA ~20 at M12) — is what we build to; DA 32–37 / ~640 RD by month 24 is the aggressive ceiling, not the default. **Gate decisions on RD count, not DA (DA is directional).** See 03-content-engine.md for the linkable assets this engine promotes and 06-technical-geo.md for how authority feeds AI-search citations.

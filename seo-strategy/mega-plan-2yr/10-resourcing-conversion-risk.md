# 10 — Resourcing, Conversion & Risk

> Purpose: close the three things a 24-month "1M/mo" plan cannot omit — **who/what it costs**, **how a visitor becomes a lead**, and **what happens if Google hits us**. This file fills the gaps the internal QA flagged (G1–G4). It is the most honest file in the set: it is where the ambition meets the bill.

Honesty frame (same as every file here): **1M/mo organic is the Aggressive ceiling, not a promise.** The Base scenario in [01-traffic-model-to-1M.md](01-traffic-model-to-1M.md) (§2.3) is the plan-of-record. The real north star is **organic leads/bookings**, not visitors — see §2.

---

## 1. Resourcing & budget model

The traffic model implies a content + link machine. That machine has two honest build paths. Pick one explicitly — the plan's velocity assumptions break if you fund neither.

### 1.1 The two paths

| | **Path A — Lean (operator + AI)** | **Path B — Small team** |
|---|---|---|
| Who | You + Claude/MCP stack, ~24/7 | You + 1 content writer (Urdu/English) + 1 part-time outreach/PR + freelance photographer |
| Sustainable velocity | 3–6 quality pages/day (AI-drafted, you edit) | 10–15 pages/day + dedicated link outreach |
| Realistic 24-mo ceiling | **Base scenario** (~500k/mo) is reachable; 1M is a stretch | **Aggressive scenario** (1M) becomes plausible |
| Bottleneck | Your editing hours + link-building (can't be fully automated) | Cash + management overhead |

**The honest implication:** **1M/mo realistically requires Path B at some point** (months ~7–12 onward). On Path A alone, plan for the Base case and treat 1M as aspirational. Do not assume solo + AI = 1M; AI accelerates drafting, but link-building, real photography, PR relationships, and editorial judgment are human-gated.

### 1.2 Indicative monthly cost (PKR; ranges, not precision)

| Line item | Lean (Path A) | Team (Path B) | Notes |
|---|---|---|---|
| Content writer(s) | — | 80k–200k | 1 strong bilingual writer; scale to 2 in Year 2 |
| Outreach/PR (part-time) | — | 50k–120k | Link-building is the #1 lever — see [05](05-authority-linkbuilding.md) |
| Photography (first-party) | 20k–60k | 60k–150k | Replaces Pexels placeholders; E-E-A-T + image SEO ([03](03-content-engine.md) §4) |
| Paid SEO tools (when needed) | 0–15k | 25k–70k | Ahrefs/Semrush/DataForSEO — only when free tier caps bite ([07](07-mcp-operating-manual.md) §4) |
| Hosting/infra delta | minimal | minimal | Already on Vercel/Neon; programmatic pages are cheap |
| **Indicative total/mo** | **~20k–135k** | **~215k–540k** | USD ≈ $75–480 (lean) / $770–1,940 (team) at ~280 PKR/USD |

These are **planning ranges to size the decision, not quotes.** Replace with real numbers once you choose a path. The point: a 1M plan with zero cost line is fiction — fund Path B before committing to the Aggressive curve.

### 1.3 Phase → resourcing gate

- **M1–M3 (Foundation + quick wins):** Path A is fine. Prove the engine (rankings appear, GSC impressions climb) before spending.
- **M4–M6 (depth):** add the first writer if Base milestones are hit (see decision-gates in [08](08-24-month-roadmap.md) §9).
- **M7–M12 (scale):** Path B required to keep the content velocity in [03](03-content-engine.md) §3 honest.
- **M13–M24 (1M push):** full team or accept the Base ceiling.

---

## 2. Conversion surface & lead definition (the real north star)

Every file says "judge on leads, not visitors." This section defines what a *lead* actually is, so [09-measurement-cadence.md](09-measurement-cadence.md) can measure it.

### 2.1 The conversion events (define these in GA4 — Step Zero unblocks this)

Primary (count as a "lead"):
1. **Vendor contact reveal** — user clicks to reveal/visit a vendor's phone/WhatsApp on a vendor profile or `{vendor}×{city}` page.
2. **Enquiry / "Get quotes" form submit** — the marketplace lead form.
3. **WhatsApp click-through** — `wa.me` click (dominant PK contact channel; instrument it).

Secondary (assisted/micro-conversions):
4. Budget-calculator completion, checklist/timeline tool use (intent signal; feeds remarketing + internal links).
5. Save/shortlist a vendor.

**Action:** these must be GA4 conversion events with the source/medium attributed. Until they exist, the program is unmeasurable on its real goal — wire them in the same sprint as GSC/GA4 ([07](07-mcp-operating-manual.md) §2).

### 2.2 Where the CTA lives

- **Money pages** (`{vendor}×{city}`, vendor profiles): contact/WhatsApp/enquiry above the fold and repeated after the vendor list.
- **Listicles** ("Best {vendor} in {city}"): each entry links to its vendor profile (the conversion surface), not a dead end.
- **Informational galleries/guides** (mehndi, dress): these do **not** convert directly — their job is the **internal-link bridge** to money pages (see §2.3). A gallery with no contextual link to "book a mehndi artist in {city}" is wasted traffic.

### 2.3 The informational→commercial bridge (load-bearing — measure it)

The entire reason to chase low-converting informational volume (mehndi/dress) is to funnel it to commercial pages. If that bridge doesn't work, 1M is pure vanity. So it is a tracked KPI:

- **Bridge CTR** = % of informational-page sessions that click through to a money/vendor page.
- **Assisted conversions** = leads where an informational page was an earlier touch (GA4 path/attribution).
- Target: establish a baseline in the first 90 days of real traffic, then improve quarter over quarter. Add this KPI to [09](09-measurement-cadence.md) §1.

### 2.4 CRO principle

If clicks rise but leads don't, it is a **conversion/UX problem on the money pages, not an SEO problem** — fix the CTA, trust signals (reviews, real photos, PKR pricing), and page speed before assuming you need more traffic.

---

## 3. Algorithm-risk & recovery playbook

Publishing thousands of templated pages from a DA-1 domain carries real, specific risk. Name it and mitigate it.

### 3.1 The risks

1. **Programmatic / thin-content demotion or manual action** — the biggest risk at scale. Google's "scaled content abuse" policy targets mass low-value pages.
2. **Core update volatility** — broad ranking swings independent of anything we did.
3. **De-indexation of thin city×vendor combos** — index bloat dragging the whole domain.

### 3.2 Mitigations (mostly already designed into the plan)

- **Uniqueness floor per programmatic page** ([04](04-programmatic-architecture.md) §3) — real vendor data, unique intro copy, PKR pricing, local FAQ. No boilerplate-only pages.
- **Thin-page noindex guard** ([04](04-programmatic-architecture.md) §4) — combos below the vendor threshold stay `noindex,follow` until populated. This is the single most important spam-safety control; protect it.
- **Gradual rollout, not a 8,000-page dump** — publish in waves so quality is monitored ([08](08-24-month-roadmap.md)).
- **E-E-A-T signals** ([03](03-content-engine.md) §4) — author bylines, first-party photography, factual accuracy.
- **AI-content discipline** — AI-assisted drafting is fine; AI-only unedited mass pages are exactly what gets penalized. Human editing is the firewall.

### 3.3 Recovery steps (if hit)

1. Diagnose: GSC Manual Actions report + coverage/impressions drop pattern (sitewide vs section) via the own-data MCPs.
2. If manual action (scaled content): `noindex` or improve the offending page set, raise the uniqueness floor, request reconsideration.
3. If core update: do **not** panic-edit. Assess over 2–4 weeks, double down on E-E-A-T and the pages that held, document changes, wait for the next update.
4. **Owner:** this file + [06-technical-geo.md](06-technical-geo.md) (technical regression) jointly own incident response. Log every incident and response in the monthly review ([09](09-measurement-cadence.md) §4).

---

## 4. Competitor roster (beyond shadiyana)

The plan's primary benchmark is **shadiyana.pk** (DA ~22, ~66k/mo, ~850 referring domains, venue-dominated — canonical profile lives in [02-keyword-universe.md](02-keyword-universe.md)). But 1M-scale category leadership means beating the whole SERP. Named set (from prior research in `../SEO-MASTER-PLAN.md` §3):

| Competitor | Threat type | Notes |
|---|---|---|
| **shadiyana.pk** | Direct marketplace (primary) | Venue-strong, non-venue + content + Urdu thin = our wedge |
| **shehnai.pk** | Content threat | Best blog ("Wedding Cost in Pakistan", city venue guides) — beat on cost/budget content |
| **urdupoint.com** | High-DA hall directory + Urdu | More a **backlink target** than a rival |
| **wedmegood.com** (PK section) | High-DA, India-based | Shallow on PK — outdepth on local specificity |
| eventza.pk, hamaravenue.com | Venue-only directories | Narrow; beatable on category breadth |
| shadibox.com, shadibazar.pk, shadikart.com.pk | Commerce/resale | Different intent; watch, don't chase |
| **Pinterest / Instagram** | Informational-SERP owners | They own mehndi/dress *image* intent — the real "competitor" for the informational mass ([01](01-traffic-model-to-1M.md) §4.2 risk) |

Matrimonial "shaadi.com"-type sites = different intent, ignore. Re-run a live competitor scan quarterly via `serper` + `firecrawl` ([07](07-mcp-operating-manual.md) §3 quarterly).

---

## 5. Cross-references
- Traffic model & scenarios → [01-traffic-model-to-1M.md](01-traffic-model-to-1M.md)
- Canonical keyword/competitor numbers → [02-keyword-universe.md](02-keyword-universe.md)
- Content velocity & E-E-A-T → [03-content-engine.md](03-content-engine.md)
- Programmatic uniqueness & noindex guards → [04-programmatic-architecture.md](04-programmatic-architecture.md)
- Link velocity & PR → [05-authority-linkbuilding.md](05-authority-linkbuilding.md)
- Technical/GEO & incident response → [06-technical-geo.md](06-technical-geo.md)
- MCP cadences & Step Zero → [07-mcp-operating-manual.md](07-mcp-operating-manual.md)
- Month-by-month roadmap & gates → [08-24-month-roadmap.md](08-24-month-roadmap.md)
- KPIs, dashboard, conversion metrics → [09-measurement-cadence.md](09-measurement-cadence.md)

_Status: drafted 2026-06-15. Budget figures are planning ranges, not quotes. Lead/conversion targets to be set from the GA4 baseline once Step Zero is complete._

# 09 — Measurement, KPIs & Operating Cadence

*Purpose: the scoreboard and the routine that runs it — a north-star-down KPI tree, the GSC + GA4 + Bing data pipeline (pulled via MCP), a Looker Studio dashboard spec built on native connectors, and a weekly/monthly/quarterly review rhythm calibrated so early no-traffic months are judged on leading indicators, not vanity visitors.*

> **Read this first.** A plan you cannot measure is a wish. This file does not re-argue the 1M ceiling (see `01-traffic-model-to-1M.md`) — it tells you *what to count, where it comes from, and when to look.* The hard rule from `01`: the north star is **organic leads/bookings**, not the 1M visitor number. Much of any 1M is low-value mehndi-design / dress-inspiration informational traffic (see `02-keyword-universe.md`); the money is in a small commercial subset (venues, photographers, bridal dress). We measure both, but we **judge** the program on the commercial subset. All Ubersuggest figures here are **directional**; GSC is truth — connect it first (`GSC-GA4-SETUP.md`).

---

## 1. The KPI tree (north-star down)

One north star, three lagging business outcomes, and a layer of leading indicators that move *first*. Read it top-down for "are we winning?" and bottom-up for "what do I fix this week?"

```
NORTH STAR:  Organic leads & bookings  (vendor enquiries / contact-reveals from organic)
   │
   ├─ LAGGING (outcomes, move late)
   │    • Organic sessions (total) — vanity ceiling, watched not chased
   │    • Commercial-intent organic sessions (venue/photographer/dress/makeup)
   │    • Organic conversion rate (lead ÷ commercial session)
   │    • Assisted conversions + informational→commercial internal-bridge CTR
   │        (the metric that *justifies* chasing informational traffic — see 10-resourcing-conversion-risk.md §2.3)
   │    • Keywords ranking top-3 / top-10  (commercial cohort tracked separately)
   │
   ├─ MID (move mid-cycle)
   │    • GSC clicks  ←  CTR  ←  impressions   (the funnel, in this order)
   │    • Indexed-page count (valid ÷ submitted)  & index-bloat ratio
   │    • Referring domains / DA  (see 05-authority-linkbuilding.md §10)
   │
   └─ LEADING (move first — judge early months on these)
        • Pages published / indexed this week
        • Impressions on new URLs (demand confirmed before clicks exist)
        • New referring domains won
        • CWV pass rate (% URLs "Good")
        • AI-citation share (mentions in AI Overviews / ChatGPT / Perplexity / Copilot)
```

### KPI definitions & targets

> **Data-label note.** Two distinct classes of target appear below. **Off-site authority figures (DA, referring domains) are *directional* (Ubersuggest free-tier — rough).** All lead/conversion-rate and impressions/clicks/CTR/sessions ranges are **modeled/illustrative — to be set from the GA4 baseline** once GSC/GA4 are connected; they are forecasts with no external source yet, not promises. Once GSC/GA4/Bing are live, both classes are replaced by **real** numbers.

| KPI | Layer | Source | M3 target | M12 target | M24 target |
|---|---|---|---|---|---|
| Organic leads/bookings (mo) | North star | GA4 conversion event | 5–15 | 200–500 | 1,500–4,000 |
| Organic sessions (mo) | Lagging | GA4 / GSC clicks | 1–3k | 60–120k | 400k–1M |
| Commercial-intent sessions % | Lagging | GA4 landing-page segment | n/a | 12–18% | 10–15% |
| Organic conv. rate (commercial) | Lagging | GA4 | baseline | 1.5–3% | 2–4% |
| Info→commercial bridge CTR + assisted conv. | Lagging | GA4 (path/assisted-conv) | baseline | 3–6% | 5–10% |
| Keywords top-3 / top-10 | Lagging | GSC position | ~0 / ~10 | 150 / 1,200 | 1,500 / 12,000 |
| GSC clicks (mo) | Mid | GSC | 200–800 | 50–100k | 350k–900k |
| GSC impressions (mo) | Mid | GSC | 30–80k | 3–6M | 25–60M |
| Sitewide CTR | Mid | GSC | 0.5–1.5% | 1.5–2.5% | 1.5–3% |
| Quality-indexed pages | Mid | GSC Pages report | 300–800 | ~4k (Base) | ~8k (Aggressive) |
| Raw indexed (valid, incl. thin) | Mid | GSC Pages report | 300–800 | 5–9k | 20–40k (crawlable/generated capacity incl. noindex — NOT an indexed-page target) |
| Referring domains | Mid | Ubersuggest / Bing | 15–30 | 150–250 | 600–900 |
| DA | Mid | Ubersuggest | 3–6 | 18–25 | 35+ |
| CWV pass rate | Leading | CrUX / PageSpeed | 70%+ | 90%+ | 90%+ |
| AI-citation share | Leading | serper / manual probes | track | growing | category-leader |

Targets are the **base scenario** from `01`; conservative and aggressive bands live there. Never present a single number as a promise.

---

## 2. The data pipeline (own-data first, MCP-driven)

The pipeline is **own-data first**: GSC, GA4 and Bing Webmaster are ground truth and cost nothing. Ubersuggest/serper/CrUX fill the gaps (DA, competitor RDs, AI-citation probes). The operator is available 24/7, so collection is *pull-on-demand via MCP*, not a brittle scheduled ETL.

| Stage | Source | MCP server | What it answers |
|---|---|---|---|
| Demand & rank truth | Search Console | `gsc` / `gsc-advanced` / `search-console-unified` | impressions, clicks, CTR, position, by query/page/country/device |
| Behaviour & leads | GA4 | `ga4` | organic sessions, landing pages, conversions, lead events |
| Microsoft / Copilot index | Bing Webmaster | `bing-webmaster` | Bing impressions/clicks, backlinks, IndexNow status |
| Indexation push | IndexNow | `indexnow` | instant submit of new/changed URLs |
| CWV field data | CrUX | `crux` / `pagespeed-crux` / `pagespeed` | LCP/INP/CLS pass rate (field, not lab) |
| Off-site authority | Ubersuggest | `ubersuggest` | DA, referring domains, competitor backlink gap |
| AI-citation share | serper + probes | `serper` / `tavily` / `exa` | does WW appear in AI Overviews / LLM answers |
| Competitor watch | Ubersuggest / serper | `ubersuggest` / `serper` | shadiyana.pk RDs (~850), keyword overlap, new venue pages |

**Flow:** GSC/GA4/Bing → MCP pull → reconcile against last week's snapshot → diff into *winners/losers* → write commentary → file actions into the relevant plan doc (content gaps → `02`, link gaps → `05`, template/CWV issues → `04`). The assistant's job each cycle is to turn the diff into a *decision*, not just a chart.

**STEP ZERO gate:** until GSC, GA4 and Bing are connected and verified (`GSC-GA4-SETUP.md`), every number in this plan is Ubersuggest-directional. Connecting them is the single highest-leverage measurement task — do it before publishing page #2.

---

## 3. Looker Studio dashboard spec

There is **no Looker Studio MCP or public build API** — dashboards are built once, by hand, on Looker Studio's **native GA4 and GSC connectors** (free, official, auto-refreshing). The assistant cannot edit the dashboard, so it pulls the *same numbers* via MCP (§2) for the written commentary that sits beside it. The dashboard is the operator's at-a-glance; the MCP pull is the analysis.

**Data sources to attach:** (1) GA4 native connector → WW property; (2) GSC connector twice — once "Site Impression" (totals) and once "URL Impression" (per-page); (3) optional Sheet of monthly DA/RD pulled from Ubersuggest, since there's no Looker connector for it.

**Page 1 — Executive scorecard.** Scorecards (with sparkline + period-over-period %): organic sessions, GSC clicks, impressions, CTR, organic leads, top-3 keyword count. One time-series: organic clicks vs impressions (dual axis) over 16 months. A single "leads" big-number tile so the north star is impossible to miss.

**Page 2 — Traffic & query trend.** Clicks/impressions trend with a 7-day moving average; query table sorted by clicks with position + CTR columns; a **winners/losers** table — biggest click delta vs prior period, both directions (this is the weekly action list). Filter controls: country (default PK), device, date.

**Page 3 — Landing-page & city×vendor performance.** Top landing pages by clicks/impressions/position. A pivot of **city × vendor-type** (the programmatic surface from `04`: 11 vendor types × 12 cities) showing clicks per cell — instantly reveals which Lahore-venues / Karachi-photographers cells are pulling and which are dead. A "rising pages" table filtered to URLs gaining impressions but with position >10 (the optimisation backlog).

**Page 4 — Conversions & leads.** GA4 organic conversions over time; lead conversion rate by landing-page group (venue vs photographer vs dress vs informational); commercial-vs-informational session split (proves the §1 quality argument); top converting cities/vendor types.

**Page 5 — Technical / CWV.** CWV pass-rate gauges (LCP/INP/CLS) from a CrUX Sheet; indexed vs submitted pages; coverage-error count; index-bloat ratio. GSC's own Core Web Vitals + Indexing reports are the backstop here.

Every Looker tile has a named MCP equivalent in §2, so weekly commentary and the dashboard never disagree.

---

## 4. Review rhythm (operator available 24/7)

> **Canonical cadence lives in `07-mcp-operating-manual.md` §3.** That file owns the operating cadence (weekly/monthly/quarterly loops + MCP usage + Step-Zero). The loops below are the *measurement view* of that same rhythm — what to count in each loop — not a second, parallel cadence. If the two ever diverge, `07` §3 wins.

Three loops at three altitudes. Discipline beats intensity — the same checklist every cycle.

### Weekly scorecard (Mondays, ~30 min)
Pull GSC (clicks/impressions/CTR/position, last 7d vs prior 7d via `gsc`), GA4 leads (`ga4`), Bing (`bing-webmaster`), new RDs (`ubersuggest`/Bing). Produce a one-screen scorecard: north-star leads, the funnel (impr→clicks→CTR), pages published/indexed, new RDs, and the **winners/losers** query list. Action: pick the top 3 movers and route them — new-page-with-impressions-no-clicks → title/meta or CTR fix; rising-but-rank-11–20 → on-page boost; losers → check for cannibalisation or de-index. IndexNow-submit anything new (`indexnow`). Early months will show *zero clicks* — that is expected; judge on §5 leading indicators.

### Monthly deep-dive (first working day, ~2 hrs)
Full month-over-month across the whole KPI tree. Indexation health (valid ÷ submitted, bloat ratio), CWV pass rate (`crux`), DA/RD curve vs the `05` velocity target, content-cluster performance vs `02`, city×vendor heatmap vs `04`. Competitor check: shadiyana.pk RD count and any new venue pages (`ubersuggest`/`serper`). AI-citation probe: run 15–20 head queries through `serper`/`tavily`, log whether WW is cited. Output: a dated monthly memo with 3–5 prioritised actions feeding the next month's content/link calendar.

### Quarterly strategy reset (~half day)
Re-score the three scenarios in `01` against actuals — are we tracking conservative, base, or aggressive? Re-validate the keyword universe with fresh GSC + Ubersuggest enrichment (`02`), re-rank the programmatic backlog by *proven* impression demand (`04`), reset link targets (`05`), and reset the next quarter's KPI targets. This is where the 1M narrative is honestly recalibrated — if base is slipping, say so and adjust the page/link velocity, don't move the goalposts quietly.

| Cadence | Cool-headed question | Primary sources |
|---|---|---|
| Weekly | What moved, what do I fix now? | GSC, GA4, Bing |
| Monthly | Are leading indicators compounding? | + CrUX, Ubersuggest, serper |
| Quarterly | Which scenario are we on; reset targets | All + `01`/`02`/`04`/`05` |

---

## 5. Leading vs lagging — judging the early months fairly

The single most common way SEO programs get killed is judging month 2 by visitor count. At DA 1 with ~1 ranking keyword, **there is no traffic to measure** — and there won't be for months. Indexation precedes impressions; impressions precede clicks; clicks precede leads; links and DA gate how high any of it can climb. So early progress is *real* even when GA4 is flat.

| Phase | Judge ON (leading) | Do NOT yet judge on (lagging) |
|---|---|---|
| M0–3 (foundation) | pages indexed, RDs won, CWV "Good", GSC impressions appearing, AI-crawler access | sessions, clicks, leads, rankings |
| M4–9 (traction) | impression growth, first top-20 positions, CTR on indexed pages, RD velocity | total-traffic vanity number |
| M10–18 (compounding) | clicks growth, top-10 keyword count, commercial-cohort rank | absolute 1M progress |
| M19–24 (scale) | leads, commercial conv. rate, category share vs shadiyana | — (now judge on outcomes) |

**The early-warning chain:** if impressions on new pages are flat, demand or indexation is broken — check coverage *before* writing more. If impressions rise but clicks don't, it's a title/CTR or SERP-feature problem, not a content problem. If clicks rise but leads don't, it's a CRO/UX problem on the vendor pages, not SEO. Each link in `impressions → clicks → leads` fails differently and is fixed by a different team — diagnosing *which* link broke is the entire point of the scoreboard. Tie every red metric back to the doc that owns the fix, and the measurement system becomes the steering wheel, not just the speedometer.

# Wedding Wala — 24-Month SEO Mega-Plan (toward 1,000,000 organic visits/mo)

**Domain:** weddingwala.pk · **Market:** Pakistan (locId 2586) · **Horizon:** 24 months · **Drafted:** 2026-06-15
**Extends:** [`../SEO-MASTER-PLAN.md`](../SEO-MASTER-PLAN.md) (the 12-month, 3-phase plan) → this folder takes it to 24 months and a 1M target.

---

## The honest one-paragraph verdict

**1,000,000 organic visits/month is a genuine stretch ceiling — reachable, not guaranteed.** It is physically possible only because Pakistan's wedding *informational* search universe is enormous (mehndi/dress/decor/hairstyle/cards demand runs into the millions/month). Capturing ~1M means becoming the country's dominant wedding **content** hub (galleries + guides at scale) layered on the **booking** engine, pushing authority from DA 1 toward DA 30+, publishing thousands of quality pages, over a sustained 24 months — and most likely with a small content team (see [10](10-resourcing-conversion-risk.md) §1). Much of any 1M is low-value inspiration traffic, so **the real north star is organic leads/bookings, not the visitor count.** Anyone who *guarantees* 1M is selling hype; this plan instead maximizes the realistic outcome and measures honestly.

---

## How to use this folder

Read in order. Each file is standalone but cross-references the others.

| # | File | What it answers |
|---|---|---|
| 00 | **00-README.md** (this) | Governance, canonical conventions, how to use, status |
| 01 | [01-traffic-model-to-1M.md](01-traffic-model-to-1M.md) | The honest math: demand sizing, 3 scenarios, what 1M requires |
| 02 | [02-keyword-universe.md](02-keyword-universe.md) | **Canonical** keyword volumes/SD + page-type map + competitor profile |
| 03 | [03-content-engine.md](03-content-engine.md) | Content types, publishing velocity, E-E-A-T, Urdu, content-ops |
| 04 | [04-programmatic-architecture.md](04-programmatic-architecture.md) | **Canonical** {vendor}×{city}×{event} matrix, vendor flywheel, thin-page guards |
| 05 | [05-authority-linkbuilding.md](05-authority-linkbuilding.md) | **Canonical** link/RD targets, digital PR, vendor reciprocity |
| 06 | [06-technical-geo.md](06-technical-geo.md) | Indexation at scale, CWV/INP, schema, GEO/AI search |
| 07 | [07-mcp-operating-manual.md](07-mcp-operating-manual.md) | **Canonical** MCP tool-to-job map, Step-Zero, operating cadences |
| 08 | [08-24-month-roadmap.md](08-24-month-roadmap.md) | Month-by-month execution calendar + decision gates |
| 09 | [09-measurement-cadence.md](09-measurement-cadence.md) | KPI tree, Looker Studio dashboard spec, review rhythm |
| 10 | [10-resourcing-conversion-risk.md](10-resourcing-conversion-risk.md) | Budget/headcount, lead/conversion definition, algorithm-risk, competitor roster |
| 11 | [11-whole-pakistan-coverage.md](11-whole-pakistan-coverage.md) | Real PK geography + exact page-count math (theoretical vs inventory-gated indexable) toward 1M |
| 12 | [12-page-blueprint.md](12-page-blueprint.md) | The definitive 1000× page blueprint + keyword-placement map (primary/secondary/long-tail → exact on-page slot) |
| — | [TODO.md](TODO.md) | Master execution checklist |
| — | [briefs/](briefs/) | Per-page competitor teardowns + "100× better" content briefs |
| — | [authority-execution-pack.md](authority-execution-pack.md) | Ready-to-run link-building assets — NAP, citations, vendor-backlink engine, Decemberistan PR + templates |

---

## Canonical conventions (the source-of-truth rules — resolve all cross-file conflicts here)

When two files disagree, **these rules win:**

1. **Plan of record = the Base scenario** ([01](01-traffic-model-to-1M.md) §2.3). The **Aggressive / 1M** scenario is the ceiling we *build for* but never *commit to*. Any file that plans to the Aggressive line as if it were default is wrong and should be read against Base.
2. **Authority go/no-go gate = referring-domain (RD) count**, not Domain Authority. RD is the (more) first-party signal (GSC Links + Bing). **DA is a secondary, directional, third-party score** — never gate decisions on it. (Resolves the DA-number drift across files.)
3. **Canonical owners of numbers:**
   - **Keyword volumes / SD / competitor profile →** [02](02-keyword-universe.md). Other files quote, don't redefine.
   - **Traffic model, scenarios & page-count ceiling →** [01](01-traffic-model-to-1M.md). The quality-indexed page ceiling is **~4,000 (Base) / ~8,000 (Aggressive)** — *not* the larger "generated/crawlable URL" figures that appear elsewhere (those include `noindex` thin combos and are capacity ceilings, not indexed-page targets).
   - **Link / RD targets →** [05](05-authority-linkbuilding.md), aligned to Base as plan-of-record.
   - **MCP usage, Step-Zero, cadences →** [07](07-mcp-operating-manual.md).
4. **Data labeling discipline (three tiers):**
   - **Directional** = from Ubersuggest free tier (PK numbers leak US data, only ~19 kw/cluster enriched). Treat as a *floor/sketch*.
   - **Modeled/illustrative** = forecast outputs with no external source yet (e.g. future impressions/lead ranges). Plausible, not measured.
   - **Real** = from GSC/GA4/Bing once connected. **Replace directional/modeled numbers with Real the moment Step Zero is done, then re-forecast.**
5. **North star = organic leads/bookings** ([10](10-resourcing-conversion-risk.md) §2), with **visitors** as a supporting metric. The **informational→commercial internal-link bridge** ([10](10-resourcing-conversion-risk.md) §2.3) is what makes informational volume worth chasing — it is a tracked KPI, not an assumption.

---

## Start here — Step Zero (unblocks everything)

Connect real data before trusting any number in these files:
1. Create a **Google service-account JSON**, enable Search Console + Analytics Data APIs, add the SA email to GSC (Owner) and GA4 (Viewer).
2. Wire `gsc` + `ga4` + `bing-webmaster` MCP servers to it (full steps in [07](07-mcp-operating-manual.md) §2).
3. Define the **GA4 conversion events** (contact reveal / enquiry / WhatsApp click — [10](10-resourcing-conversion-risk.md) §2.1).
4. Submit `sitemap.xml`, confirm indexation baseline.

Until this is done, the whole plan runs on directional Ubersuggest data. After it's done, the 24/7 measurement loop ([07](07-mcp-operating-manual.md) §5, [09](09-measurement-cadence.md)) goes live.

---

## Maintenance

This is a **living plan**, not a one-shot doc. Re-forecast **quarterly** once GSC is connected (real data replaces directional). Keep [02](02-keyword-universe.md) as the single place to update keyword numbers. Log algorithm incidents and KPI reviews per [10](10-resourcing-conversion-risk.md) §3 / [09](09-measurement-cadence.md) §4.

---

## Known reconciliation backlog (from internal QA — open items, tracked not hidden)

An automated consistency review flagged these. All items are now resolved (reconciliation pass, 2026-06-15):

- **[CLOSED] Cross-reference filenames** → every sibling cross-reference in files 01–09 corrected to the canonical names in the index above; verified zero broken refs remain.
- **[CLOSED] Page-count tables** → [03](03-content-engine.md) §3 and [09](09-measurement-cadence.md) §1 now split *quality-indexed* (~4k Base / ~8k Aggressive, per rule 3) from *raw generated/crawlable URLs incl. noindex*; the larger figures are explicitly labeled capacity, not targets.
- **[CLOSED] RD/DA endpoints** → [05](05-authority-linkbuilding.md) now leads with the **Base** plan-of-record (~180 RD/DA~20 @M12; ~350 RD/DA~28 @M24) and labels the ~640 RD / DA 32–37 curve as the **Aggressive** ceiling.
- **[CLOSED] Gate metric** → authority go/no-go gates in [08](08-24-month-roadmap.md) and [01](01-traffic-model-to-1M.md) switched from DA to **referring-domain count**; DA demoted to a secondary directional signal.
- **[CLOSED] Budget/resourcing gap →** added in [10](10-resourcing-conversion-risk.md) §1.
- **[CLOSED] Conversion-surface gap →** added in [10](10-resourcing-conversion-risk.md) §2.
- **[CLOSED] Algorithm-risk playbook →** added in [10](10-resourcing-conversion-risk.md) §3.
- **[CLOSED] Competitor roster →** added in [10](10-resourcing-conversion-risk.md) §4.

---

_Drafted 2026-06-15 by the SEO operating system (Claude + 35-server MCP stack). Directional until Step Zero (GSC/GA4/Bing) is connected. Built on the real codebase (Next.js 14 App Router) and live Ubersuggest PK data — no invented metrics._

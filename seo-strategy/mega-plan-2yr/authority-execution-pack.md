# Authority Execution Pack — ready-to-run link-building assets

> Strategy lives in [05-authority-linkbuilding.md](05-authority-linkbuilding.md). **This file is the do-it-now layer:** exact NAP, a prioritized citation list, the vendor-backlink engine, and the Decemberistan PR campaign — with copy-paste templates. Authority (referring domains) is the **#1 ranking lever** and the slowest to build, so start now.
> Honest note: for an online **marketplace**, a Google Business Profile is low-leverage (the local pack is won by individual vendors' GBPs, not the directory). Put the effort into **citations + vendor reciprocity + digital PR** below.

---

## 1. Canonical NAP & brand facts (use these EXACTLY, everywhere — consistency is the signal)
| Field | Value |
|---|---|
| Business name | **Wedding Wala** |
| Tagline | Pakistan's Wedding & Event Planning Marketplace |
| Website | https://www.weddingwala.pk |
| Phone (display) | +92 327 4811220 |
| Phone (E.164) | +923274811220 |
| Email | info@weddingwala.pk |
| Address | **[confirm registered business address — do not vary it once set]** |
| Country / market | Pakistan |
| Short description (≤160) | Wedding Wala is Pakistan's wedding marketplace — find, compare and book verified venues, photographers, caterers, decorators, mehndi artists and more, with real reviews and transparent PKR pricing. |

**Rule:** every listing must use the *identical* name, phone and URL above (no "WeddingWala.pk" vs "Wedding Wala (Pvt) Ltd" drift). Inconsistent NAP cancels the trust signal.

> Also verify the on-site **Organization JSON-LD** (lib/seo/jsonld.ts) carries this exact NAP + a `sameAs` array of your social profiles — that's the entity/trust anchor citations reinforce.

---

## 2. Citation submission list (foundational trust — do first, ~1–2 weeks)
Submit the canonical NAP to each. Prioritize P0 first.

| Source | Type | Priority | Notes |
|---|---|---|---|
| Bing Places | Search engine | P0 | Feeds Bing + Copilot; you already have Bing WMT |
| Google Business Profile | Search engine | P1 | Set up as the brand/HQ listing; low local-pack value for a marketplace, but a brand entity + a backink-adjacent signal |
| Apple Business Connect | Maps | P1 | Apple Maps presence |
| Facebook Page + Instagram | Social | P0 | Complete profiles with the exact NAP + website; primary brand sameAs |
| LinkedIn Company Page | Social | P1 | B2B + entity signal |
| YouTube channel (About) | Social | P2 | NAP in About; ties to future video |
| UrduPoint business/directory | PK directory | P0 | High-DA PK property — strong citation + potential editorial |
| Pakistan Yellow Pages (pakistanyp / yellowpages.pk) | PK directory | P1 | Standard PK citation |
| Locanto / OLX Pakistan (business) | PK classifieds | P2 | Volume citations |
| Crunchbase / startup directories | Global | P2 | Entity + occasional backlink |
| Clutch / GoodFirms (if agency-listed) | B2B | P3 | Only if you offer services directly |

**Process:** create one master "NAP sheet" (section 1), then submit verbatim. Track in a simple sheet: source · URL · date submitted · live URL · status.

---

## 3. The vendor-reciprocity engine (your scalable backlink machine 🔁)
Every vendor you list is a potential backlink. This compounds as you onboard vendors and is the most scalable, on-brand link source you have.

**Mechanism:** give each vendor a "Featured on Wedding Wala" badge + link to *their* Wedding Wala profile, and ask them to add it to their website/footer/"as seen on" section.

**Badge link snippet (give vendors this copy-paste HTML):**
```html
<a href="https://www.weddingwala.pk/{vendor-type}/{city}/{vendor-slug}-{id}" rel="noopener">
  <img src="https://www.weddingwala.pk/badges/featured-on-wedding-wala.png"
       alt="Featured on Wedding Wala" width="180" height="60" />
</a>
```
*(Action: create the badge image at `/public/badges/featured-on-wedding-wala.png`. Until then, vendors can use a text link: "Featured on Wedding Wala →".)*

**Vendor outreach email template:**
```
Subject: Your Wedding Wala profile is live — grab your "Featured on" badge

Hi {Vendor Name},

Your profile is live on Wedding Wala (Pakistan's wedding marketplace):
{profile URL}

Couples are browsing {vendor-type} in {city} there now. Add the free
"Featured on Wedding Wala" badge to your website so visitors can see your
reviews and book you — here's the snippet (30 seconds to paste):

{badge snippet}

It links straight to your profile. Anything you'd like updated on your
listing, just reply here.

— Team Wedding Wala · www.weddingwala.pk
```
**Why it works:** vendors *want* the credibility + referral traffic, so conversion is high; each link is a relevant, contextual backlink. Bake the badge ask into vendor onboarding so it scales automatically.

---

## 4. Digital PR — the "Pakistan Wedding Season Report" (the DA-mover 📈)
The single highest-ceiling link play: publish original **data** that PK media want to cite every year around the Oct–Feb "Decemberistan" season.

**The asset:** an annual **"Pakistan Wedding Report {year}"** — original, citable data:
- Average wedding cost by city + YoY inflation (you already have the cost model in `wedding-cost-in-pakistan`; layer in Google Trends + your GA4/GSC demand data as it accrues).
- Most-searched vendors/venues/trends (Google Trends, `google-trends` MCP).
- Peak booking months, guest-count trends, budget shifts.
- A few shareable stat-cards / charts.

**Why:** journalists link to *primary data*. A yearly report = recurring editorial backlinks from high-DA PK outlets — exactly the referring domains that move DA.

**Target publications (pitch list):**
| Outlet | Angle |
|---|---|
| Dawn (Images) | Lifestyle/culture — wedding cost & trends |
| The Express Tribune | Business/lifestyle — wedding economy, inflation |
| Business Recorder | Business — wedding-industry spend data |
| Mashion | Bridal/lifestyle — trends, real weddings |
| Something Haute / Diva | Fashion/bridal — designer & look trends |
| Brides of Pakistan / Pakistani wedding blogs | Niche — every credited vendor links back |

**Pitch email template:**
```
Subject: Data: how much a Pakistani wedding costs in {year} (free to cite)

Hi {Journalist},

We crunched 2026 wedding data across Lahore, Karachi and Islamabad —
average cost by city, the categories driving inflation, and the most-
searched trends this season. A few findings you're welcome to cite:

• {stat 1 — e.g. average mid-range wedding cost + YoY %}
• {stat 2 — e.g. catering as % of budget}
• {stat 3 — e.g. most-searched vendor/trend}

Full report + charts (free to use with a link to weddingwala.pk):
{report URL}

Happy to send the dataset or a quote. — {Name}, Wedding Wala
```

---

## 5. HARO-style / reactive outreach
- Monitor journalist requests (e.g. #journorequest on X, Help-a-Reporter-style PK groups, Facebook journalist groups) for wedding/lifestyle/cost queries.
- Respond fast with a concise expert quote + a stat from the report → earns a cited backlink.
- Keep a 3–4 line "expert source" boilerplate ready (who Wedding Wala is + one stat).

---

## 6. Guest content & partnerships
- Offer original guest articles (cost guides, planning checklists) to PK wedding blogs and photographer/vendor sites.
- Partner with PK wedding photographers/planners for content swaps (they credit + link the marketplace).
- Repurpose your existing pillars (cost guides, mehndi/decor guides) into guest pitches.

---

## 7. Monthly link-velocity scorecard (track this — gate on RD, not DA)
Per [05](05-authority-linkbuilding.md), the **referring-domain count is the gate**, DA is a directional read.

| Month | Citations live | Vendor backlinks | PR/editorial links | Total referring domains | Notes |
|---|---|---|---|---|---|
| M1 | target 8–12 | — | — | baseline | foundational citations |
| M2 | — | first 10–20 | — | climbing | vendor badge in onboarding |
| M3 | — | scaling | first 1–2 | ~25+ | first guest posts |
| ... | | | annual report (peak season) | toward 180 @ M12 (Base) | |

Pull referring-domain counts from **Bing WMT** + **GSC Links** (your free first-party sources).

---

## 8. First-30-days action checklist
1. ☐ Confirm + lock the canonical NAP (section 1), incl. business address.
2. ☐ Create the badge image at `/public/badges/featured-on-wedding-wala.png`.
3. ☐ Submit P0 citations: Bing Places, Facebook, Instagram, UrduPoint.
4. ☐ Add the vendor-badge ask to onboarding + email existing vendors (template §3).
5. ☐ Verify Organization JSON-LD has correct NAP + `sameAs` socials.
6. ☐ Outline the "Pakistan Wedding Report 2026" from the cost model + Google Trends.
7. ☐ Build the journalist pitch list + send the first 5 pitches (template §4).

---
_Created 2026-06-15. Templates use the canonical NAP in §1 — confirm the business address before mass-submitting. Referring-domain growth is the #1 lever and compounds slowly; start now and run it every month. See [05-authority-linkbuilding.md](05-authority-linkbuilding.md) for the full strategy and [00-README.md](00-README.md) for governance._

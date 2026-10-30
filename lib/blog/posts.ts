/**
 * Blog post data — currently in-memory TypeScript so we can ship the
 * editorial template without picking a CMS. Migration paths when the
 * editorial team grows:
 *   1. MDX files in content/blog/<cluster>/<slug>.mdx (next-mdx-remote)
 *   2. A headless CMS (Sanity / Contentful / Strapi)
 *   3. The existing backend with a Posts model
 *
 * Each post has: cluster (topic silo per L5 of url-conventions-LOCKED),
 * slug, headline, excerpt, hero image, author, date stamps, body
 * (paragraphs as strings — markdown-light), and reading-time minutes.
 *
 * Reference:
 *   - docs/seo/00-master-seo-playbook.md §7 content silos + §8 E-E-A-T
 *   - docs/seo/03-url-conventions-LOCKED.md §L5
 */

export interface BlogAuthor {
  slug: string
  name: string
  role: string
  bioShort: string
  /** Public profile link, used for E-E-A-T signal in Article.author. */
  url?: string
}

export interface BlogCluster {
  slug: string
  name: string
  description: string
}

export interface BlogPost {
  cluster: string // matches BlogCluster.slug
  slug: string
  headline: string
  excerpt: string
  imageUrl: string
  author: BlogAuthor
  publishedAt: string // ISO 8601
  updatedAt?: string // ISO 8601
  readingMinutes: number
  /** Body — array of { type, text } blocks. Keep it simple. */
  body: BlogBlock[]
  tags?: string[]
}

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }

// ─── Authors ────────────────────────────────────────────────────────────

const AUTHORS: Record<string, BlogAuthor> = {
  "wedding-wala-editorial": {
    slug: "wedding-wala-editorial",
    name: "Wedding Wala Editorial",
    role: "Editorial Team",
    bioShort:
      "The Wedding Wala editorial team writes about Pakistani wedding planning, vendor selection, and shaadi-season trends.",
    url: "https://weddingwala.pk/about",
  },
}

// ─── Clusters (topic silos) ─────────────────────────────────────────────

export const CLUSTERS: BlogCluster[] = [
  {
    slug: "planning",
    name: "Wedding planning",
    description:
      "Checklists, timelines, budgets, and the big-decision guides for Pakistani couples.",
  },
  {
    slug: "venues",
    name: "Wedding venues",
    description:
      "Banquet halls, marquees, lawns, and farmhouses across Pakistan — what to look for, what to ask.",
  },
  {
    slug: "photography",
    name: "Wedding photography",
    description:
      "Bridal portraits, mehndi candids, full-event coverage — choosing the right photographer in Pakistan.",
  },
  {
    slug: "decor",
    name: "Wedding decor",
    description: "Mandap, stage, mehndi setup — current decor trends across PK weddings.",
  },
  {
    slug: "bridal",
    name: "Bridal wear & beauty",
    description:
      "Lehengas, ghararas, mehndi designs, makeup looks, and outfit-shopping guides for Pakistani brides.",
  },
]

export function getCluster(slug: string): BlogCluster | undefined {
  return CLUSTERS.find((c) => c.slug === slug)
}

// ─── Posts ──────────────────────────────────────────────────────────────

export const POSTS: BlogPost[] = [
  {
    cluster: "planning",
    slug: "how-much-does-a-pakistani-wedding-cost-2026",
    headline: "How much does a Pakistani wedding cost in 2026?",
    excerpt:
      "A city-by-city breakdown of typical Pakistani wedding budgets — from intimate 100-guest mehndis in Lahore to 1000-guest walimas in Karachi.",
    imageUrl:
      "/images/seo/hero.jpg",
    author: AUTHORS["wedding-wala-editorial"],
    publishedAt: "2026-04-12T09:00:00.000Z",
    updatedAt: "2026-05-01T14:00:00.000Z",
    readingMinutes: 14,
    tags: [
      "wedding budget",
      "Pakistan",
      "Lahore",
      "Karachi",
      "Islamabad",
      "shaadi",
    ],
    body: [
      {
        type: "p",
        text: "A Pakistani wedding in 2026 typically costs PKR 1.5M to PKR 8M, depending on city, guest count, and vendor mix. The single biggest variable is the venue — banquet halls in central Lahore and DHA Karachi run 4–10× the price of suburban marquees, before food. The second biggest variable is the guest count: at PKR 1,800–4,500 per plate (depending on city + caterer + menu tier), every extra hundred guests adds PKR 180,000–450,000 to a single function. For a three-function wedding the math compounds quickly.",
      },
      {
        type: "h2",
        text: "Cost by city",
      },
      {
        type: "p",
        text: "Lahore weddings tend to come in 10–20% above the national average for premium venues but match the average on caterers. The Mall Road / Cantt corridor is where prices peak; suburban Lahore (Bahria, Wapda Town) is 30–40% cheaper for equivalent capacity. Karachi's DHA / Clifton corridor is the priciest in the country for both venue and decor — a 600-guest banquet hall on Korangi Road can run PKR 800k–1.5M for the room alone, before catering. Islamabad is mid-tier on most line items but has a smaller pool of high-capacity venues, which pushes prices up for >500-guest events. The diplomatic enclave hotels (Marriott, Serena) are luxury-tier; F-7 and E-11 banquet halls offer better value for 200–400 guest counts.",
      },
      {
        type: "p",
        text: "Outside the Big Three, prices drop materially. Faisalabad weddings of equivalent size run 25–35% under Lahore. Multan is similar. Sialkot has stronger bridal-wear infrastructure than its size suggests but venue stock is limited. Peshawar and Quetta are the most affordable major cities — partly because the local guest-list expectations are smaller, partly because of less venue competition driving prices.",
      },
      {
        type: "h2",
        text: "Where the money goes",
      },
      {
        type: "ul",
        items: [
          "Venue + catering: 50–60% of total budget",
          "Bridal wear + groom outfit: 10–15%",
          "Photography + cinematography: 8–12%",
          "Decor + mandap + stage: 8–12%",
          "Mehndi night separately: 8–10%",
          "Cars + transport: 2–4%",
          "Stationery + invitations: 1–2%",
          "Buffer for last-minute additions: 5–10%",
        ],
      },
      {
        type: "h2",
        text: "Three realistic budget tiers",
      },
      {
        type: "p",
        text: "Tier 1 — intimate (PKR 1.5M–3M, 100–200 guests). One main function plus a smaller mehndi at home. Suburban venue or upscale farmhouse. Mid-tier photographer. Made-to-measure but not couture bridal. The most common shape for second-time weddings, court marriages, and inter-city couples whose guest lists don't compound from both sides.",
      },
      {
        type: "p",
        text: "Tier 2 — standard (PKR 3M–6M, 300–500 guests). Three functions. Mid-to-premium venue. Established photographer with a team. Designer bridal (Sana Safinaz / Élan / Zara Shahjahan tier). Decor that uses the venue's existing structure rather than building from scratch. This is where most middle-class urban Pakistani weddings land.",
      },
      {
        type: "p",
        text: "Tier 3 — luxury (PKR 6M–12M+, 500–1000 guests). Three or four functions including a separate dholki. Top-tier venue (Pearl Continental, Movenpick, Mövenpick, custom marquee). Couture bridal. Full-team photo + cinema. Custom decor builds. Often a celebrity-tier mehndi performance. PKR 12M+ is genuinely uncommon outside Karachi DHA / Lahore Cantt.",
      },
      {
        type: "h2",
        text: "Where couples most often blow the budget",
      },
      {
        type: "p",
        text: "Three predictable overruns. First, guest count creep — the list grows 15–20% between booking and the event as relatives suggest \"just one more cousin.\" Build the buffer in. Second, decor escalation — what looks like a flat quote in February gets revised in November when the vendor sees the venue and adds rentals. Lock specific deliverables in writing. Third, last-minute outfit additions — sherwanis for the groom's brothers, jewellery for the bride's mother, valima outfits the couple didn't initially plan. Reserve a 10% buffer for these and you'll feel calm; don't and you'll be stressed.",
      },
      {
        type: "h2",
        text: "How to use this data",
      },
      {
        type: "p",
        text: "Start with your guest count and your city. Multiply by the per-plate range your shortlisted caterers quote. Layer on venue rental and you're ~60% of the way to a real budget. From there, allocate the rest by priority — couples who care most about photography typically over-index on that and trim decor. Use the Wedding Wala budget calculator to model your specific numbers; the city-specific multipliers are baked in.",
      },
    ],
  },
  {
    cluster: "photography",
    slug: "choosing-a-pakistani-wedding-photographer",
    headline: "How to choose a Pakistani wedding photographer (without regrets)",
    excerpt:
      "Beyond the portfolio: the questions that separate a photographer who'll show up reliably from one whose final delivery slips for months.",
    imageUrl:
      "/images/home/partners/photography.jpg",
    author: AUTHORS["wedding-wala-editorial"],
    publishedAt: "2026-03-28T10:00:00.000Z",
    readingMinutes: 7,
    tags: ["wedding photography", "vendor selection", "Pakistan"],
    body: [
      {
        type: "p",
        text: "Picking a wedding photographer is one of the few decisions that's truly irreversible — you can't redo a baraat. Pakistani couples typically shortlist three or four candidates from Instagram or referrals, but the portfolio alone misses the operational signals that matter most.",
      },
      {
        type: "h2",
        text: "What to ask before booking",
      },
      {
        type: "ul",
        items: [
          "What's your delivery turnaround on edited photos? (Pakistani average is 6–10 weeks; longer is a red flag.)",
          "Do you cover the full event or do you have a backup photographer for parallel functions?",
          "What's your cancellation and rescheduling policy if a force-majeure event hits?",
          "Can you show me three full weddings (not curated highlights) you shot in the last six months?",
          "Do you carry equipment redundancy — second camera body, backup lights?",
        ],
      },
      {
        type: "h2",
        text: "Red flags",
      },
      {
        type: "p",
        text: "Vague answers on turnaround. No insurance or backup gear. Reluctance to share unedited samples. Heavy reliance on one signature aesthetic that may not match your function's vibe. And — most commonly — no written contract.",
      },
      {
        type: "h2",
        text: "What to look for in the portfolio",
      },
      {
        type: "p",
        text: "Beyond aesthetic taste, three specific signals. First, range across functions — a great mehndi shooter often struggles with a tightly-lit walima stage; ask to see all three function types. Second, candid skill — bridal portraits are mostly technical, candids reveal whether the photographer reads the room. Third, post-processing consistency — look at three full weddings and check whether the colour grade is consistent across them or whether each looks shot-by-someone-else. Inconsistent edits usually mean the photographer outsources colour, which means your final delivery may not match what you were sold.",
      },
      {
        type: "h2",
        text: "Cinematic vs photographic — and the cost difference",
      },
      {
        type: "p",
        text: "Most established Pakistani photographers offer cinematography either in-house or via a partner. The split tends to add 40–80% on top of the photo package. The marginal value depends on what you'll actually rewatch — couples who genuinely watch their wedding film love the investment; couples who default to scrolling photos rarely watch the film twice. A short 90-second highlight reel often gives 80% of the emotional payoff at 30% of the full-film cost.",
      },
      {
        type: "h2",
        text: "Why deposits matter — and how Wedding Wala protects you",
      },
      {
        type: "p",
        text: "Photography is a high-deposit category — typically 30–50% of the package upfront, since the photographer is locking out other clients for your date. The risk is real: if the photographer can't deliver (illness, scheduling, going out of business), you've lost the deposit and have weeks to find a replacement. Booking through Wedding Wala holds the deposit until the photographer confirms the booking; if they can't deliver, the deposit comes back to you in full and we help you find a replacement at no platform fee.",
      },
    ],
  },
  {
    cluster: "venues",
    slug: "outdoor-vs-indoor-wedding-venues-pakistan",
    headline: "Outdoor vs indoor wedding venues in Pakistan: a clear-eyed comparison",
    excerpt:
      "Lawn weddings look stunning in photos but bring weather, mosquito, and acoustic risks. Banquet halls control all three but cost more per guest. Here's how to choose.",
    imageUrl:
      "/images/home/venues/v1.jpg",
    author: AUTHORS["wedding-wala-editorial"],
    publishedAt: "2026-02-15T08:00:00.000Z",
    readingMinutes: 8,
    tags: ["wedding venues", "Pakistan", "outdoor weddings", "banquet halls"],
    body: [
      {
        type: "p",
        text: "Pakistan's wedding season runs October to February, when most outdoor weddings happen. Outside that window, the calculus shifts dramatically — May barat lawns in Karachi need misters and weather contingencies that double the decor budget.",
      },
      {
        type: "h2",
        text: "Outdoor pros",
      },
      {
        type: "ul",
        items: [
          "Photography lights better in golden hour than under tungsten halls",
          "Capacity scales — most marquees handle 1000+ guests easily",
          "Decor reads bigger and more cinematic in open space",
          "Generally cheaper per-guest than equivalent indoor venues",
        ],
      },
      {
        type: "h2",
        text: "Outdoor risks (and how to handle them)",
      },
      {
        type: "ul",
        items: [
          "Weather — book a venue with a covered indoor backup, even in winter",
          "Mosquitoes / flies — budget for misters or fogging in pre-October events",
          "Acoustic spread — outdoor sound dissipates fast; rent more PA than you think",
          "Guest comfort — heaters in December, fans in May, both in shoulder seasons",
        ],
      },
      {
        type: "h2",
        text: "When indoor wins",
      },
      {
        type: "p",
        text: "If your event is between March and September, or your guest count is under 250, an indoor banquet hall almost always wins on consistency, lighting predictability, and budget headroom. Pakistani winter (October–February) is when the outdoor calculus flips.",
      },
    ],
  },
  {
    cluster: "decor",
    slug: "wedding-stage-decor-trends-pakistan-2026",
    headline: "Wedding stage decor trends in Pakistan, 2026",
    excerpt:
      "What's actually getting booked this season — minimalist florals, Mughal-revival arches, and the quiet retreat from oversized chandeliers.",
    imageUrl:
      "/images/home/partners/decor.jpg",
    author: AUTHORS["wedding-wala-editorial"],
    publishedAt: "2026-04-25T08:00:00.000Z",
    readingMinutes: 7,
    tags: ["wedding decor", "stage decor", "Pakistan trends", "2026"],
    body: [
      {
        type: "p",
        text: "Pakistani wedding decor is in a quiet course-correction. The maximalist crystal-chandelier era of 2018–2022 is fading; what's booking now is restrained, architectural, and much more expensive per visible element — but uses fewer elements overall. Three trends are dominant in 2026.",
      },
      {
        type: "h2",
        text: "1. Minimalist florals over structural maximalism",
      },
      {
        type: "p",
        text: "Stages built around a single hero floral arrangement — rather than a wall of flowers — are everywhere. The economics: one tightly-curated arrangement of high-end blooms (peonies, anthuriums, hydrangeas) reads more luxurious than ten metres of generic gladioli, and costs roughly the same. Decor Diaries in Karachi has been pushing this aesthetic hard; Mehndi Atelier's Lahore work follows similar logic.",
      },
      {
        type: "h2",
        text: "2. Mughal-revival architectural arches",
      },
      {
        type: "p",
        text: "Stage backdrops referencing Lahore Fort or Wazir Khan Mosque tilework have surged — particularly for walima. The look pairs well with heritage venues but works in modern halls too because the arch geometry reads as classical regardless of context. Cost-effective: sandstone-coloured wood + LED strip-lit cutouts replicate the visual without the actual stonework.",
      },
      {
        type: "h2",
        text: "3. The retreat from oversized chandeliers",
      },
      {
        type: "p",
        text: "Pre-pandemic, chandeliers were the photographic centrepiece. In 2026 they're being replaced by ambient lighting — ceiling drapes with embedded warm fairy lights, or open-air canopies with no central fixture at all. The shift is partly aesthetic (a bright chandelier overexposes photos) and partly practical (rented chandeliers are heavy, slow to install, prone to damage).",
      },
      {
        type: "h2",
        text: "What's NOT trending in 2026",
      },
      {
        type: "ul",
        items: [
          "Cold colour palettes — purples and silvers dropped sharply; warm palette dominates",
          "Themed weddings (Hollywood, Bollywood film themes) — almost gone",
          "Acrylic / lucite anything — peaked 2023, now reads dated",
          "Fog machines for entry — banned at most banquet halls anyway",
        ],
      },
      {
        type: "h2",
        text: "Budgeting for stage decor",
      },
      {
        type: "p",
        text: "A stage in 2026 typically runs PKR 250k–800k depending on city, complexity, and whether you need separate stages for mehndi / barat / walima. Custom builds (the Mughal-arch kind) start at PKR 500k. Floral-led stages start lower (around PKR 200k) but flowers are perishable — your visible cost is one-day-only versus a structure you might re-use across functions.",
      },
    ],
  },
  {
    cluster: "bridal",
    slug: "pakistani-bridal-lehenga-trends-2026",
    headline: "Pakistani bridal lehenga trends, 2026",
    excerpt:
      "Less heavy, more layered: a clear-eyed look at what designers are actually shipping this bridal season — Sana Safinaz, Élan, Zara Shahjahan, Bunto Kazmi.",
    imageUrl:
      "/images/home/lookbook/l1.jpg",
    author: AUTHORS["wedding-wala-editorial"],
    publishedAt: "2026-04-30T08:00:00.000Z",
    readingMinutes: 7,
    tags: ["bridal wear", "lehenga", "Pakistani designers", "bridal trends"],
    body: [
      {
        type: "p",
        text: "Pakistani bridal lehengas in 2026 are doing something interesting: getting visually heavier through layering, while the actual fabric weight drops sharply. Brides are reporting the dance-friendly feeling of mid-2010s lehengas without sacrificing the photo-ready opulence the late-2010s set as the norm. Three threads worth pulling on.",
      },
      {
        type: "h2",
        text: "1. Pearl-on-pearl over gota-on-velvet",
      },
      {
        type: "p",
        text: "Heavy gota work on velvet remains the safe choice for traditional brides, but pearl-and-crystal embellishment over silk organza is the conversation this season. The look is luminous rather than imposing. Sana Safinaz's spring 2026 bridal collection leans into this; Élan has a parallel line.",
      },
      {
        type: "h2",
        text: "2. Modern colour over the red-only era",
      },
      {
        type: "p",
        text: "Red is still the most-booked baraat colour by a wide margin, but ivory-with-gold, blush-with-rose-gold, and a notable comeback of forest-green-with-antique-gold are eating into red's dominance. Bridal Wear designers like Zara Shahjahan have been pushing brides toward 'colour-coordinated heritage' rather than the default deep red.",
      },
      {
        type: "h2",
        text: "3. Mehndi yellows are getting more sophisticated",
      },
      {
        type: "p",
        text: "Bright lemon yellow is being replaced by mustard, chartreuse, and butter-cream tones. Mehndi outfits are also more separates-driven (gharara + kurti + odhni) than full-flow lehengas, which gives the bride more movement on a night that's about dancing.",
      },
      {
        type: "h2",
        text: "Three names worth knowing if you don't already",
      },
      {
        type: "ul",
        items: [
          "Sana Safinaz — the safest premium choice; consistent quality, full-team measurements, 4–6 month lead time",
          "Élan — pricier; signature heavy work; runs late on delivery more often than not (build slack into your timeline)",
          "Zara Shahjahan — modern aesthetic; smaller team but very responsive; strong with non-red palettes",
          "Bunto Kazmi — heritage couture; expensive but the gold standard for wedding-day photographs",
        ],
      },
      {
        type: "h2",
        text: "What this means for budget",
      },
      {
        type: "p",
        text: "Premium bridal in 2026 starts at around PKR 4.5L for ready-to-buy and 8L+ for full custom from a name designer. Add 30–50% for mehndi + valima outfits. The rule of thumb: if you're spending under PKR 6L total on outfits, you're at the entry tier (still beautiful, less name-recognition); PKR 8–15L is the standard urban-Pakistani middle tier; PKR 15L+ is statement bridal.",
      },
      {
        type: "h2",
        text: "Booking timeline",
      },
      {
        type: "p",
        text: "First fitting 6 months before the wedding. Final fitting 3–4 weeks out. Don't compress this — every senior designer is fully booked Oct–Feb shaadi season, and rush jobs are when quality slips.",
      },
    ],
  },
  {
    cluster: "planning",
    slug: "how-to-choose-the-right-wedding-planner-for-your-big-day",
    headline: "How to Choose the Right Wedding Planner for Your Big Day",
    excerpt:
      "Seven things to check before you hire a wedding planner in Karachi, Lahore, Islamabad or anywhere in Pakistan: services, experience, costs, vendor network, communication, client feedback and the written agreement.",
    imageUrl: "/images/seo/hero.jpg",
    author: AUTHORS["wedding-wala-editorial"],
    publishedAt: "2026-10-30T09:00:00.000Z",
    readingMinutes: 9,
    tags: ["wedding planner", "Karachi", "Lahore", "Islamabad", "Pakistan", "vendor selection"],
    body: [
      {
        type: "p",
        text: "Choosing a wedding planner is an important decision because the right professional can make the entire celebration easier to manage, from the initial preparations to the final event. However, with different service packages, budgets, and planning approaches available, knowing how to choose the best wedding planner in Karachi can be challenging.",
      },
      {
        type: "p",
        text: "A beautiful portfolio alone does not necessarily mean a planner is the right fit for your wedding. You also need to consider their experience, range of services, communication, vendor network, and ability to manage unexpected situations. Whether you are arranging a wedding in Karachi, Lahore, Islamabad, or another city in Pakistan, evaluating these factors before hiring can help you make a more confident decision.",
      },
      { type: "p", text: "Here are seven important things to consider when selecting a wedding planner." },
      { type: "h2", text: "1. Start by Understanding What You Need From a Wedding Planner" },
      {
        type: "p",
        text: "Before contacting different planners, identify the type of support you actually need. The best wedding planners in Pakistan offer different levels of support, and not every professional provides the same range of services.",
      },
      {
        type: "p",
        text: "Some couples prefer complete wedding planning, where the planner manages arrangements from the early stages. Others may only need assistance with specific responsibilities or coordination on the wedding day.",
      },
      { type: "p", text: "Common service options include:" },
      {
        type: "ul",
        items: [
          "Full-service wedding planning: Covers major arrangements such as budgeting, venue selection, vendor bookings, décor planning, scheduling, and event execution.",
          "Partial wedding planning: Assists with selected responsibilities while the family manages other aspects independently.",
          "Wedding-day coordination: Focuses on managing the schedule, vendors, setup and event flow on the actual wedding day.",
        ],
      },
      {
        type: "p",
        text: "Think about the number of functions, expected guest count, venue requirements, and how much time you can personally dedicate to the preparations.",
      },
      {
        type: "p",
        text: "For example, a wedding involving Mehndi, Baraat, and Walima may require more extensive coordination than a single-day celebration. Understanding your requirements first will help you approach planners whose services match your expectations.",
      },
      { type: "h2", text: "2. Evaluate Their Experience and Previous Wedding Projects" },
      {
        type: "p",
        text: "A wedding planner's experience provides useful insight into how they handle different events, clients, and practical challenges. However, experience should be evaluated through actual work rather than relying only on the number of years a company claims to have operated.",
      },
      {
        type: "p",
        text: "Ask to see examples of weddings they have managed. Review their portfolio to understand the variety of events they have handled, the quality of their arrangements, and whether their work reflects the style you want.",
      },
      { type: "p", text: "Pay attention to details such as:" },
      {
        type: "ul",
        items: [
          "Different wedding functions and event sizes.",
          "Venue layouts and stage arrangements.",
          "Décor execution and attention to detail.",
          "Guest seating and dining arrangements.",
          "Coordination between different service providers.",
          "Consistency across the events shown in their portfolio.",
        ],
      },
      {
        type: "p",
        text: "It is also useful to ask whether the planner has managed events similar to yours. Someone experienced in large wedding receptions may have a different approach from a planner who primarily handles intimate celebrations.",
      },
      {
        type: "p",
        text: "Do not judge a company solely by its most impressive photographs. Ask about its actual responsibilities in those projects and how much of the event was managed by its own team.",
      },
      { type: "h2", text: "3. Check the Range of Wedding Planning Services They Offer" },
      {
        type: "p",
        text: "A professional wedding planner should clearly explain what is included in their services. Some companies specialize in décor, while others manage several aspects of the event, including logistics, catering, entertainment, and on-site coordination.",
      },
      {
        type: "p",
        text: "Before comparing proposals, check which responsibilities the planner can handle and which services need to be arranged separately.",
      },
      { type: "p", text: "Important areas to discuss include:" },
      {
        type: "ul",
        items: [
          "Venue selection and management: Can they help shortlist suitable venues based on guest count, location, budget, and event requirements?",
          "Décor and stage design: Do they provide customized concepts, floral arrangements, lighting, entrance décor, and stage setups?",
          "Catering arrangements: Can they coordinate menu selection, food service, serving staff, and dining requirements?",
          "Vendor management: Do they work with photographers, videographers, entertainment teams, sound technicians, and other service providers?",
          "Event-day execution: Will their team supervise setup, manage the schedule, and coordinate vendors throughout the celebration?",
        ],
      },
      {
        type: "p",
        text: "A detailed service breakdown makes it easier to understand what you are paying for. It also helps prevent misunderstandings when the event approaches.",
      },
      { type: "h2", text: "4. Compare Wedding Planner Costs and Understand What Is Included" },
      {
        type: "p",
        text: "Budget is one of the most important considerations when hiring a wedding planner. However, choosing the lowest quotation without understanding the services included can lead to additional expenses later.",
      },
      { type: "p", text: "Wedding planner costs in Pakistan can vary depending on several factors:" },
      {
        type: "ul",
        items: [
          "Number of wedding functions.",
          "Total guest count.",
          "Venue size and location.",
          "Décor complexity and customization.",
          "Number of vendors involved.",
          "Level of planning and on-site coordination.",
          "Additional production or logistical requirements.",
        ],
      },
      {
        type: "p",
        text: "When requesting quotations, share the same event details with each shortlisted planner. This makes it easier to compare their proposals fairly.",
      },
      {
        type: "p",
        text: "Ask whether the quotation covers planning fees, vendor charges, décor, catering coordination, transportation, equipment, and any additional services. Also clarify which expenses are estimated and which are confirmed.",
      },
      {
        type: "p",
        text: "A written proposal should outline the agreed services, payment schedule, additional charges, and cancellation terms.",
      },
      {
        type: "p",
        text: "Rather than focusing only on the total price, consider the value of the services being provided. A slightly higher quotation may include responsibilities that would otherwise require separate vendors or additional coordination.",
      },
      { type: "h2", text: "5. Ask About Their Vendor Network and Coordination Process" },
      {
        type: "p",
        text: "Choosing an experienced event management company in Karachi can also help bring different vendors and event arrangements under coordinated management. This is why vendor coordination should be an important part of your evaluation.",
      },
      {
        type: "p",
        text: "Ask the planner how they select and work with their vendors. Find out whether they have an established network of decorators, caterers, photographers, videographers, entertainment teams and technical suppliers.",
      },
      { type: "p", text: "You should also understand how they manage communication between these teams." },
      { type: "p", text: "Useful questions include:" },
      {
        type: "ul",
        items: [
          "Who confirms vendor bookings and service details?",
          "How are setup and arrival times communicated?",
          "Who handles changes in the event schedule?",
          "Is there a designated person supervising vendors on the event day?",
          "What happens if a booked vendor becomes unavailable?",
        ],
      },
      {
        type: "p",
        text: "A reliable coordination process should include confirmed responsibilities, clear timelines, and a designated contact person. This is particularly important when several functions take place at different venues or on consecutive days.",
      },
      { type: "h2", text: "6. Assess Their Communication and Problem-Solving Skills" },
      {
        type: "p",
        text: "Wedding preparations involve many decisions, discussions, and changes. Your planner should be someone who listens carefully, understands your priorities, and communicates clearly throughout the process.",
      },
      {
        type: "p",
        text: "During your initial meetings, notice how they respond to your questions. Do they explain their suggestions with practical reasons? Are they willing to discuss alternatives? Do they understand your budget and preferences?",
      },
      { type: "p", text: "You should also ask how they handle unexpected situations." },
      {
        type: "p",
        text: "For example, what happens if the guest count increases, a vendor arrives late, the weather affects an outdoor setup or an important piece of equipment develops a problem?",
      },
      {
        type: "p",
        text: "No planner can guarantee that every event will run without unexpected challenges. What matters is whether they have a practical approach to handling them.",
      },
      { type: "p", text: "Before hiring, clarify:" },
      {
        type: "ul",
        items: [
          "Who will be your main point of contact?",
          "How frequently will you receive planning updates?",
          "How will important decisions and changes be documented?",
          "Who will be present at the venue on the event day?",
          "How will urgent issues be communicated?",
        ],
      },
      {
        type: "p",
        text: "Good communication helps establish trust and reduces the chances of misunderstandings during the preparations.",
      },
      { type: "h2", text: "7. Review Client Feedback and Finalize the Agreement" },
      {
        type: "p",
        text: "Before making your final decision, look beyond the planner's portfolio and review feedback from previous clients.",
      },
      {
        type: "p",
        text: "If possible, ask the planner whether you can speak with a previous client. A genuine client experience may help you understand what working with the company is like beyond the promotional material.",
      },
      {
        type: "p",
        text: "Once you have shortlisted your preferred planner, arrange a detailed meeting to discuss the complete event requirements.",
      },
      { type: "p", text: "Before signing an agreement, make sure it clearly states:" },
      {
        type: "ul",
        items: [
          "Services and deliverables included.",
          "Number of functions covered.",
          "Payment schedule and deadlines.",
          "Additional charges and possible exclusions.",
          "Cancellation and rescheduling terms.",
          "Responsibilities of both parties.",
          "Event-day team and coordination arrangements.",
        ],
      },
      {
        type: "p",
        text: "Avoid relying entirely on verbal promises. A written agreement gives both sides a clear understanding of the expected services and responsibilities.",
      },
      { type: "h2", text: "Questions to Ask Before Hiring a Wedding Planner" },
      {
        type: "p",
        text: "Meeting a wedding planner is an opportunity to understand their working style and assess whether they can manage your event. Instead of discussing only décor ideas and prices, ask questions that reveal how they approach planning and execution.",
      },
      { type: "p", text: "Consider asking:" },
      { type: "h3", text: "1. Have you managed weddings similar to mine?" },
      {
        type: "p",
        text: "This helps you assess whether their previous experience matches your event size, style and requirements.",
      },
      { type: "h3", text: "2. Which services are included in your package?" },
      { type: "p", text: "Request a clear breakdown of the responsibilities covered in the quotation." },
      { type: "h3", text: "3. Will your own team be present on the wedding day?" },
      { type: "p", text: "Confirm who will supervise the event and coordinate vendors at the venue." },
      { type: "h3", text: "4. How do you handle last-minute changes?" },
      { type: "p", text: "Their response can help you understand their approach to unexpected situations." },
      { type: "h3", text: "5. Can you share references or examples of completed events?" },
      {
        type: "p",
        text: "This allows you to review their work and learn about previous client experiences.",
      },
      { type: "h3", text: "6. What is your payment and cancellation policy?" },
      { type: "p", text: "Understanding financial terms before booking helps avoid disagreements later." },
      { type: "h2", text: "Final Thoughts" },
      {
        type: "p",
        text: "Choosing the right wedding planner requires more than comparing prices or selecting the company with the most attractive portfolio. You need a professional who understands your requirements, offers suitable services, coordinates vendors effectively, and communicates clearly throughout the process.",
      },
      {
        type: "p",
        text: "Take time to compare portfolios, review client feedback, discuss service details, and understand the written agreement before making your decision. Whether you are planning an intimate gathering or a multi-function wedding, selecting a planner with the right experience and coordination approach can make the entire celebration easier to manage.",
      },
      {
        type: "p",
        text: "The best choice is not necessarily the most expensive or the most popular planner. It is the one whose services, working approach, and experience align with your wedding requirements.",
      },
      { type: "h2", text: "Frequently Asked Questions" },
      { type: "h3", text: "When should you hire a wedding planner?" },
      {
        type: "p",
        text: "It is generally better to contact wedding planners several months before the wedding, especially if you are planning multiple functions or need assistance with venue and vendor bookings. Starting early gives you more time to compare services and finalize arrangements.",
      },
      { type: "h3", text: "How much does a wedding planner cost in Pakistan?" },
      {
        type: "p",
        text: "The cost depends on the number of functions, guest count, venue, décor requirements, and level of service. Requesting detailed quotations based on the same event requirements is the best way to compare different planners.",
      },
      { type: "h3", text: "What is the difference between a wedding planner and a wedding coordinator?" },
      {
        type: "p",
        text: "A wedding planner typically manages broader preparations, including budgeting, vendor selection, bookings, and event arrangements. A wedding coordinator focuses more on organizing the schedule, supervising vendors, and managing the event's execution.",
      },
    ],
  },
]

export function getPostsByCluster(clusterSlug: string): BlogPost[] {
  return POSTS.filter((p) => p.cluster === clusterSlug).sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1,
  )
}

export function getPost(clusterSlug: string, slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.cluster === clusterSlug && p.slug === slug)
}

export function getRecentPosts(limit = 5): BlogPost[] {
  return [...POSTS]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, limit)
}

/**
 * PURE DATA — Pakistan 2026 wedding-vendor indicative pricing, booking
 * questions, and guide-pillar links.
 *
 * Powers reusable sections on the live /[vendor-type]/[city] money pages
 * (weddingwala.pk). The goal is HELPFUL, HONEST orientation for couples
 * who don't yet know what a category "should" cost — NOT a quote engine.
 *
 * IMPORTANT — honesty rules these bands must respect:
 *   - These are INDICATIVE market ranges synthesised from public 2025/2026
 *     Pakistani vendor listings and budget guides (Shadiyana, Shehnai,
 *     Evento Race, Hanif Rajput, Noor Kada, Laam, Hamara Venue, etc.).
 *   - They are NOT Wedding Wala quotes and NOT promises. Real prices vary
 *     by city, area (DHA/Clifton vs. suburbs), season (Nov–Feb peak adds
 *     20–50%), day (Fri/Sat premium), guest count, and the individual
 *     vendor. The LIVE vendor prices shown on the page are the source of
 *     truth — every `note` below says so.
 *   - Units differ by category on purpose: caterers + venues are quoted
 *     per head, bridal-wear per outfit, stationery per card, and the rest
 *     per event / package.
 *
 * This module has ZERO runtime dependencies and ZERO side effects. The
 * getters never throw on an unknown slug — they fall back to null / [].
 *
 * Slugs here MUST match VENDOR_TYPES in ./constants.ts.
 */

export interface PricingTier {
  tier: string;
  band: string;
  includes: string;
}

export interface VendorTypePricing {
  tiers: PricingTier[];
  note: string;
}

/**
 * Shared honesty disclaimer suffix. Kept as a constant so the wording stays
 * consistent across all 11 categories — every `note` ends with this.
 */
const INDICATIVE_SUFFIX =
  "These are indicative market ranges for orientation only — not Wedding Wala quotes. Actual prices vary by city, area, season, day, and vendor; the live vendor prices on this page are the source of truth.";

/**
 * One entry for EACH of these 11 SEO slugs:
 *   wedding-venues, wedding-photographers, wedding-planners, caterers,
 *   wedding-decorators, mehndi-artists, bridal-makeup-artists, bridal-wear,
 *   wedding-stationery, wedding-cars, wedding-djs
 */
export const VENDOR_TYPE_PRICING: Record<string, VendorTypePricing> = {
  "wedding-venues": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 800–1,500/head",
        includes:
          "Local marriage hall or community marquee, basic in-house menu, fans or limited AC, seating for the function — best for 150–300 guests on a tight budget.",
      },
      {
        tier: "Mid-range",
        band: "PKR 1,800–3,000/head",
        includes:
          "Established banquet hall or lawn with full AC, in-house catering, parking, stage area and standard lighting — typically 300–500 guests.",
      },
      {
        tier: "Premium",
        band: "PKR 3,500–6,500/head",
        includes:
          "Upscale banquet, hotel ballroom or farmhouse in a prime area, refined menu, generous AC and decor allowance, valet and dedicated coordination — 500+ guests.",
      },
      {
        tier: "Luxury",
        band: "PKR 200,000–800,000+ flat (lawn / farmhouse rental)",
        includes:
          "Rental-only premium lawn or farmhouse where catering, decor and lights are arranged separately — peak-season (Nov–Feb) and Fri/Sat dates carry the highest premiums.",
      },
    ],
    note: `Venue costs are usually quoted per head with food, though premium lawns and farmhouses often charge a flat rental and let you bring outside catering. ${INDICATIVE_SUFFIX}`,
  },

  "wedding-photographers": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 30,000–60,000/event",
        includes:
          "Single photographer, one function, traditional photo coverage, edited images delivered digitally — minimal or no cinematic film.",
      },
      {
        tier: "Mid-range",
        band: "PKR 70,000–130,000/package",
        includes:
          "2-person team across 1–2 days, photo plus a short cinematic highlight film, basic reel and one printed album.",
      },
      {
        tier: "Premium",
        band: "PKR 150,000–300,000/package",
        includes:
          "Multi-day coverage (mehndi, barat, walima), full cinematic film, social-media reels, drone, couple shoot and premium album.",
      },
      {
        tier: "Luxury",
        band: "PKR 330,000–600,000+/package",
        includes:
          "Signature studio, large crew, full storytelling films, same-day edits, multiple albums and high-end drone/cinematography across every function.",
      },
    ],
    note: `Photography and cinematography are often priced separately or bundled — always confirm which is included. ${INDICATIVE_SUFFIX}`,
  },

  "wedding-planners": {
    tiers: [
      {
        tier: "Day-of coordination",
        band: "PKR 50,000–200,000/event",
        includes:
          "On-the-day management only — vendor wrangling, timeline, and run-of-show for a single function so the family can relax.",
      },
      {
        tier: "Partial planning",
        band: "PKR 100,000–500,000/wedding",
        includes:
          "Vendor sourcing and negotiation, budget tracking, and coordination for selected functions — you stay involved in the big decisions.",
      },
      {
        tier: "Full-service",
        band: "PKR 200,000–1,000,000/wedding",
        includes:
          "End-to-end design and execution across mehndi, barat and walima — concept, vendors, logistics, guest management and on-site teams.",
      },
      {
        tier: "Luxury / destination",
        band: "PKR 1,000,000+/wedding",
        includes:
          "Multi-day, multi-city or destination weddings with bespoke design, large production crews and white-glove guest hospitality.",
      },
    ],
    note: `Planner fees are usually separate from venue, catering and decor — sometimes a flat fee, sometimes a percentage of total spend. ${INDICATIVE_SUFFIX}`,
  },

  "caterers": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 800–1,200/head",
        includes:
          "Simple desi menu — one rice dish, one or two curries, salad, roti and a basic dessert, served buffet-style. Service staff and crockery may be extra.",
      },
      {
        tier: "Mid-range",
        band: "PKR 1,300–2,500/head",
        includes:
          "Fuller menu (4–6 dishes) with a BBQ item, multiple mains, salads, naan/roti and 1–2 desserts — buffet with basic service staff and crockery.",
      },
      {
        tier: "Premium",
        band: "PKR 2,800–4,500/head",
        includes:
          "Extended menu (7–10 dishes) with live BBQ and handi stations, continental options, dessert spread, full service staff and quality crockery.",
      },
      {
        tier: "Luxury",
        band: "PKR 5,000–10,000+/head",
        includes:
          "Lavish multi-cuisine spread, multiple live stations, premium ingredients, dedicated waiters, fine crockery and presentation for high-end weddings.",
      },
    ],
    note: `Catering is quoted per head — but watch what's bundled: live BBQ stations, service staff, crockery and waiter charges are often priced on top. ${INDICATIVE_SUFFIX}`,
  },

  "wedding-decorators": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 45,000–110,000/event",
        includes:
          "Basic stage backdrop, simple floral arrangement, standard lighting and entrance setup for one function.",
      },
      {
        tier: "Mid-range",
        band: "PKR 120,000–300,000/event",
        includes:
          "Themed stage with fresh flowers, draping, walkway/entrance decor, table centerpieces and layered lighting.",
      },
      {
        tier: "Premium",
        band: "PKR 350,000–600,000/event",
        includes:
          "Custom themed design — floral walls, statement stage, full ceiling/draping treatment, LED installations and a coordinated lighting plan.",
      },
      {
        tier: "Luxury",
        band: "PKR 600,000+/event",
        includes:
          "Bespoke large-scale production across multiple functions — imported florals, custom structures, immersive lighting and full venue transformation.",
      },
    ],
    note: `Decor is usually priced per function (mehndi vs. barat differ widely) and scales with stage size, fresh-flower volume and lighting. ${INDICATIVE_SUFFIX}`,
  },

  "mehndi-artists": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 3,000–8,000 (bridal package)",
        includes:
          "Simpler Arabic or light Pakistani design on both hands, wrist-length, by an emerging artist — at-home service.",
      },
      {
        tier: "Mid-range",
        band: "PKR 8,000–17,000 (bridal package)",
        includes:
          "Detailed Pakistani/Indian bridal design covering both hands up to wrist or below the elbow, plus feet — by an experienced professional.",
      },
      {
        tier: "Premium",
        band: "PKR 18,000–35,000 (bridal package)",
        includes:
          "Intricate full-coverage bridal mehndi — hands and arms up to the elbow plus feet, with personalised motifs and fine detailing.",
      },
      {
        tier: "Celebrity / signature",
        band: "PKR 35,000–50,000+ (bridal package)",
        includes:
          "Sought-after celebrity artist, fully bespoke heavy bridal coverage, often with assistants for the rest of the family (charged per pair of hands).",
      },
    ],
    note: `Bridal mehndi is priced per booking, while guests' designs are usually charged per pair of hands; intricacy, coverage (wrist vs. elbow) and the artist's name drive the price. ${INDICATIVE_SUFFIX}`,
  },

  "bridal-makeup-artists": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 12,000–25,000/look",
        includes:
          "Bridal makeup and basic hairstyling for one function by an emerging artist or local salon — single look, no trial.",
      },
      {
        tier: "Mid-range",
        band: "PKR 30,000–60,000/look",
        includes:
          "Established salon or artist, full bridal makeup and hair, dupatta setting, and often a trial session for one main function.",
      },
      {
        tier: "Premium",
        band: "PKR 70,000–150,000/look",
        includes:
          "Well-known artist, premium products, pre-wedding trial, party/family makeup options and on-location service for the main function.",
      },
      {
        tier: "Luxury / celebrity",
        band: "PKR 150,000+/look",
        includes:
          "Top-tier celebrity artist, multiple looks across functions, dedicated trials, signature techniques and full bridal-party makeup.",
      },
    ],
    note: `Bridal makeup is priced per look/function — confirm whether a trial, hairstyling, dupatta setting and family makeup are included or billed separately. ${INDICATIVE_SUFFIX}`,
  },

  "bridal-wear": {
    tiers: [
      {
        tier: "Budget / ready-to-wear",
        band: "PKR 40,000–120,000/outfit",
        includes:
          "Ready-made or lightly worked bridal lehenga, gharara or maxi from a high-street brand or local boutique — limited customisation.",
      },
      {
        tier: "Mid-range",
        band: "PKR 130,000–350,000/outfit",
        includes:
          "Semi-custom bridal outfit with substantial embroidery and fitting alterations from an established label or designer boutique.",
      },
      {
        tier: "Premium designer",
        band: "PKR 350,000–800,000/outfit",
        includes:
          "Custom designer bridal (e.g. heavily worked lehenga or gharara) with personal fittings, premium fabrics and hand embellishment.",
      },
      {
        tier: "Luxury couture",
        band: "PKR 800,000–2,500,000+/outfit",
        includes:
          "Top couture house, fully bespoke heavy bridal with extensive zardozi/dabka handwork, multiple fittings and signature design.",
      },
    ],
    note: `Bridal wear is priced per outfit — heavier handwork, custom design and big-name labels move the price sharply; renting is a lower-cost alternative for some brides. ${INDICATIVE_SUFFIX}`,
  },

  "wedding-stationery": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 80–250/card",
        includes:
          "Standard printed invitation on quality card stock with single insert — straightforward designs, ordered in bulk.",
      },
      {
        tier: "Mid-range",
        band: "PKR 250–500/card",
        includes:
          "Premium finishes — foil, embossing, vellum wrap, multiple inserts or scroll/passport styles with envelopes.",
      },
      {
        tier: "Premium",
        band: "PKR 500–1,500/card",
        includes:
          "Designer or acrylic invites, custom artwork, wax seals and coordinated insert suites for the full function set.",
      },
      {
        tier: "Luxury / boxed",
        band: "PKR 1,500–3,500+/box",
        includes:
          "Bespoke boxed invitations (often velvet) with mithai/favour compartments, custom design and premium packaging.",
      },
    ],
    note: `Stationery is priced per card (or per box for luxury sets) and depends on material, finish, inserts and order quantity. ${INDICATIVE_SUFFIX}`,
  },

  "wedding-cars": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 15,000–35,000/event",
        includes:
          "Standard sedan or family car for the rukhsati with basic fresh or artificial floral decoration and a driver for a few hours.",
      },
      {
        tier: "Mid-range",
        band: "PKR 35,000–80,000/event",
        includes:
          "Premium sedan or SUV (e.g. Mercedes E-Class, Audi) with chauffeur, fuller decoration and several hours of coverage.",
      },
      {
        tier: "Premium",
        band: "PKR 80,000–150,000/event",
        includes:
          "Luxury car (Mercedes S-Class, BMW 7 Series, Maybach) with chauffeur for ~8 hours and premium floral or ribbon decoration.",
      },
      {
        tier: "Luxury / exotic",
        band: "PKR 150,000–300,000+/event",
        includes:
          "Top-end or exotic car (e.g. Rolls-Royce, Maybach) with chauffeur, bespoke decoration and full-day availability.",
      },
    ],
    note: `Car rental is priced per event/day and usually excludes the floral decoration (commonly PKR 3,000–5,000), extra hours and out-of-city travel. ${INDICATIVE_SUFFIX}`,
  },

  "wedding-djs": {
    tiers: [
      {
        tier: "Budget",
        band: "PKR 20,000–50,000/event",
        includes:
          "Basic DJ with a compact sound system and standard lighting for one function — curated playlist, no extras.",
      },
      {
        tier: "Mid-range",
        band: "PKR 50,000–120,000/event",
        includes:
          "Professional DJ with a fuller sound system, dance-floor lighting, wireless mics and a live dhol entry for one or two functions.",
      },
      {
        tier: "Premium",
        band: "PKR 120,000–250,000/event",
        includes:
          "Established DJ act with large PA, LED/effects lighting, MC support and a dhol troupe across multiple functions.",
      },
      {
        tier: "Luxury / live band",
        band: "PKR 250,000+/event",
        includes:
          "Live band or headline performers with full production sound and lighting, multiple slots and bespoke set design.",
      },
    ],
    note: `Entertainment is priced per event — a seasoned dhol pair alone can run up to ~PKR 50,000; sound system, lighting, mics and extra functions add up quickly. ${INDICATIVE_SUFFIX}`,
  },
};

/**
 * 4–6 sharp, PK-relevant "questions to ask before booking" per the same 11
 * slugs. These are deliberately specific to where Pakistani couples get
 * surprised (hidden per-head extras, peak-season premiums, who keeps the
 * RAW footage, in-house vs. outside catering rules, etc.).
 */
export const VENDOR_TYPE_QUESTIONS: Record<string, string[]> = {
  "wedding-venues": [
    "Is the quoted rate per head with food, or a flat rental where catering is separate?",
    "Is outside catering allowed, or is in-house catering mandatory?",
    "Is the price higher for peak season (Nov–Feb) or Friday/Saturday dates?",
    "Is the whole venue air-conditioned, and is there a generator backup for load-shedding?",
    "What is the guest capacity, and is parking (and valet) included?",
    "What is the booking advance, and what is the cancellation or date-change policy?",
  ],
  "wedding-photographers": [
    "Is cinematography (the film) separate from photography in this package, or bundled?",
    "How many functions and how many days of coverage are included?",
    "How many photographers and videographers will actually be on site?",
    "What is the delivery timeline for edited photos, the film, and the album?",
    "Do we receive the RAW/unedited footage, and are drone shots and reels included?",
    "What is the advance, and what happens if the lead shooter is unavailable on the day?",
  ],
  "wedding-planners": [
    "Is the fee flat, or a percentage of our total wedding budget?",
    "Which functions and what scope does this cover — day-of only, partial, or full-service?",
    "Do you take any commission from vendors you book on our behalf?",
    "Who from your team will be on-site on the actual function days?",
    "How do you handle our budget — do we pay vendors directly or through you?",
    "Have you managed weddings at our shortlisted venues before?",
  ],
  "caterers": [
    "Is the per-head rate inclusive of service staff, waiters and crockery?",
    "Are live BBQ or handi stations included, or charged on top?",
    "What is the minimum guest guarantee we have to pay for?",
    "How many dishes are in this menu, and can we do a tasting beforehand?",
    "How are extra guests on the night billed, and is there a service or setup charge?",
    "Do you provide your own setup for outdoor/lawn venues, including generators?",
  ],
  "wedding-decorators": [
    "Is this quote per function, or for all functions (mehndi, barat, walima)?",
    "Are the flowers fresh or artificial, and how much fresh floral is included?",
    "Does the price include lighting, draping and the entrance/walkway, or only the stage?",
    "Is setup and teardown included, and how long before the event do you arrive?",
    "Does the venue charge a separate fee for outside decorators or for using their structures?",
    "Can we see photos of a real setup you did, not just inspiration images?",
  ],
  "mehndi-artists": [
    "Is the bridal price for both hands, and up to where — wrist or elbow — plus feet?",
    "Are family and guest designs charged separately, per pair of hands?",
    "Do you use natural henna, and how long before the function should it be applied for deep colour?",
    "Will the named artist apply the bridal mehndi personally, or an assistant?",
    "Is at-home/at-venue service included, or is there a travel charge?",
    "Roughly how long will the bridal application take so we can plan the timeline?",
  ],
  "bridal-makeup-artists": [
    "Is a pre-wedding trial included, or charged separately?",
    "Does the price cover hairstyling and dupatta setting, or just face makeup?",
    "Which makeup brands and products do you use, and are they suited to the photography lights?",
    "Is this price per function — and what is the rate for additional functions or looks?",
    "Do you offer family/bridal-party makeup, and at what per-person rate?",
    "Will the named artist do the bride personally, and do you travel to our venue?",
  ],
  "bridal-wear": [
    "What is the price for this exact outfit, and what does customisation add?",
    "How many fittings are included, and how far in advance must we order?",
    "Is the embroidery handwork (zardozi/dabka) or machine, and on what fabric?",
    "What is the production timeline, and is there a rush charge for tight dates?",
    "Are the dupatta, blouse and any accessories included in this price?",
    "Do you offer a rental option, and what is the deposit and return policy?",
  ],
  "wedding-stationery": [
    "Is the price per card, and how does it change with quantity?",
    "What finishes are included (foil, embossing, vellum, wax seal) at this price?",
    "How many inserts come with each invite, and are envelopes included?",
    "What is the design and printing turnaround, and how many revisions are allowed?",
    "Is digital proofing included before the full print run?",
    "What is the cost for boxed or premium versions for close family?",
  ],
  "wedding-cars": [
    "Is floral car decoration included, or charged separately (typically PKR 3,000–5,000)?",
    "How many hours does the booking cover, and what is the per-hour overtime rate?",
    "Is a chauffeur included, and is fuel part of the price?",
    "Is there an extra charge for travel outside the city or to multiple stops?",
    "Can we see the exact car (model, year, condition) before booking?",
    "What is the advance, and the policy if the car breaks down on the day?",
  ],
  "wedding-djs": [
    "Is a live dhol included, or is that an add-on to the DJ package?",
    "How many functions and how many hours does this price cover?",
    "Is the sound system, dance-floor lighting and a wireless mic for announcements included?",
    "Will you provide a backup setup and power source in case of load-shedding?",
    "Can we share a must-play and do-not-play list in advance?",
    "Is there an MC/host, and what is the overtime rate beyond the booked hours?",
  ],
};

/**
 * Link to the relevant in-depth guide pillar per slug. wedding-djs has no
 * guide pillar yet, so it is intentionally omitted from this map (the getter
 * returns null for it).
 */
export const VENDOR_TYPE_GUIDE_PILLAR: Record<string, { label: string; href: string }> = {
  "wedding-venues": {
    label: "How to Choose a Wedding Venue in Pakistan",
    href: "/how-to-choose-a-wedding-venue-in-pakistan",
  },
  "wedding-photographers": {
    label: "How to Choose a Wedding Photographer in Pakistan",
    href: "/how-to-choose-a-wedding-photographer-in-pakistan",
  },
  "wedding-planners": {
    label: "How to Choose a Wedding Planner in Pakistan",
    href: "/how-to-choose-a-wedding-planner-in-pakistan",
  },
  "caterers": {
    label: "How to Choose a Wedding Caterer in Pakistan",
    href: "/how-to-choose-a-wedding-caterer-in-pakistan",
  },
  "wedding-decorators": {
    label: "How to Choose a Wedding Decorator in Pakistan",
    href: "/how-to-choose-a-wedding-decorator-in-pakistan",
  },
  "mehndi-artists": {
    label: "How to Choose a Mehndi Artist in Pakistan",
    href: "/how-to-choose-a-mehndi-artist-in-pakistan",
  },
  "bridal-makeup-artists": {
    label: "How to Choose a Bridal Makeup Artist in Pakistan",
    href: "/how-to-choose-a-bridal-makeup-artist-in-pakistan",
  },
  "wedding-cars": {
    label: "How to Choose a Wedding Car in Pakistan",
    href: "/how-to-choose-a-wedding-car-in-pakistan",
  },
  "bridal-wear": {
    label: "Pakistani Bridal Dress Guide",
    href: "/pakistani-bridal-dress-guide",
  },
  "wedding-stationery": {
    label: "Pakistani Wedding Invitation Wording",
    href: "/pakistani-wedding-invitation-wording",
  },
};

/** Getters with SAFE fallbacks — never throw on an unknown slug. */
export function getVendorTypePricing(slug: string): VendorTypePricing | null {
  return VENDOR_TYPE_PRICING[slug] ?? null;
}

export function getVendorTypeQuestions(slug: string): string[] {
  return VENDOR_TYPE_QUESTIONS[slug] ?? [];
}

export function getVendorTypeGuidePillar(slug: string): { label: string; href: string } | null {
  return VENDOR_TYPE_GUIDE_PILLAR[slug] ?? null;
}

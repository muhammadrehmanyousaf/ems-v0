import type { CitySlug } from "./constants"

/**
 * City-specific editorial blurbs for the programmatic /[vendor-type]/[city]
 * SEO pages. The goal is to give Google enough unique content per
 * city × vendor-type combination to push past the "thin content" filter
 * that was leaving 12 pages in GSC's "Crawled - currently not indexed".
 *
 * Each entry has:
 *   - intro:        one paragraph that anchors the page in the city's
 *                   wedding culture / venues / season. Used in the
 *                   "About {vendor-type} in {city}" section.
 *   - peakSeason:   month-range string for "When to book" copy.
 *   - notable:      one or two short notes about venues / locations
 *                   that are specific to the city.
 *   - priceContext: average-spend hint — informs Google + customers
 *                   that Pakistani weddings vary by city.
 *
 * Keep entries short and factual. Avoid invented stats. If you don't
 * know something for a specific city, leave the field empty rather
 * than fabricate it — the page falls back to generic copy.
 */
export interface CityEditorial {
  intro: string
  peakSeason: string
  notable: string
  priceContext: string
}

export const CITY_EDITORIAL: Record<CitySlug, CityEditorial> = {
  karachi: {
    intro:
      "Karachi weddings span everything from Clifton beachfront marquees to formal banquet halls in DHA and PECHS. The city's scale means more vendors, more variety, and more competitive pricing — but also longer lead times for premium dates.",
    peakSeason: "November–February (cooler months)",
    notable:
      "Bahria Town, DHA, and Clifton dominate the venue map; Saddar and PECHS host most mehndi and dholki venues. Coastal venues at Hawksbay and Sandspit are popular for off-season nikkahs.",
    priceContext:
      "Karachi sits at the higher end of Pakistani wedding spend due to vendor competition and venue prestige — but small banquet halls inland still keep tight-budget weddings viable.",
  },
  lahore: {
    intro:
      "Lahore is Pakistan's wedding capital — the food is louder, the events are bigger, and the vendor scene is the deepest in the country. From Walled City courtyards to DHA marquees and Bahria farmhouses, every shaadi has a venue archetype here.",
    peakSeason: "October–March",
    notable:
      "DHA, Bahria Town, and Model Town concentrate the highest-rated banquet halls. Gulberg's hotel ballrooms (Avari, Pearl Continental) cover formal walima; farmhouses along Bedian and Barki Roads serve outdoor mehndis and dholkis.",
    priceContext:
      "Lahore offers the widest PKR range of any city — budget catering from 1,200/head, premium five-star packages past 8,000/head.",
  },
  islamabad: {
    intro:
      "Islamabad weddings lean modern and formal. Banquet halls cluster around Margalla foothills, F-sectors host most mehndi venues, and the city's hotel ballrooms (Marriott, Serena) anchor high-end walimas.",
    peakSeason: "October–March (avoid July–August monsoon)",
    notable:
      "F-7, F-8, and F-10 carry the prestige banquet halls. Margalla-view farmhouses in Bani Gala and Bhara Kahu are popular for daytime mehndis. Diplomatic Enclave hosts a handful of intimate, formal venues.",
    priceContext:
      "Islamabad pricing tracks Lahore on the upper end and trends formal — fewer budget options inside the city limits.",
  },
  rawalpindi: {
    intro:
      "Rawalpindi is the practical, value-driven cousin to Islamabad — more banquet halls per kilometer, often half the price, and a deep mehndi-decor ecosystem. Many Islamabad couples book Pindi venues to keep costs sane.",
    peakSeason: "October–March",
    notable:
      "Saddar and Bahria Town Phase 1–8 carry the bulk of venues. Westridge and Chaklala hosts smaller halls for nikkah and dholki.",
    priceContext:
      "Rawalpindi runs 30–40% cheaper than Islamabad for comparable services — same vendors often serve both cities.",
  },
  faisalabad: {
    intro:
      "Faisalabad weddings are large, textile-industry-funded affairs with strong vendor traditions. Banquet halls in Madina Town and D-Ground host most baraats; older central neighborhoods keep family mehndis intimate.",
    peakSeason: "November–February",
    notable:
      "Madina Town, Susan Road, and Gulberg are the prestige venue zones. Industrial-area farmhouses cater to larger guest counts (1,000+).",
    priceContext:
      "Mid-range city — Faisalabad pricing typically sits 20% below Lahore for the same service quality, with strong local catering depth.",
  },
  multan: {
    intro:
      "Multan blends traditional South Punjab wedding rituals with newer banquet-hall culture. Mehndis are theatrical here — dholki + sufi nights are still mainstream, and decor leans warmer, deeper-tone palettes.",
    peakSeason: "October–February (avoid May–July summer heat)",
    notable:
      "Cantonment, Bosan Road, and Shah Rukn-e-Alam neighborhoods carry most modern banquet halls. Outdoor venues along the river road are popular for daytime nikkahs.",
    priceContext:
      "Lower-mid PKR range — Multan typically runs 30–40% under Lahore for equivalent service.",
  },
  peshawar: {
    intro:
      "Peshawar weddings hold strongest to traditional Pashtun ceremonial structure — separate men/women functions remain common, and venue layouts reflect that. The vendor pool is smaller but well-established.",
    peakSeason: "October–February",
    notable:
      "University Town and Hayatabad host the largest banquet halls. Cantonment-area venues serve formal walimas. Mehndi and dholki often happen at family homes here rather than rented venues.",
    priceContext:
      "Conservative spend per head; vendor quotes tend toward fixed-package rather than per-person pricing.",
  },
  sialkot: {
    intro:
      "Sialkot's wedding industry is shaped by the city's export-economy wealth — expect mid-to-premium banquet halls and tight vendor networks. Many Sialkot weddings still combine multiple events at a single farmhouse over 2–3 days.",
    peakSeason: "November–February",
    notable:
      "Cantonment, Defence, and Sambrial-road farmhouses dominate. Lahore vendors frequently travel for high-end Sialkot weddings.",
    priceContext:
      "Mid-to-upper PKR range — Sialkot couples often spend more per head than Faisalabad equivalents.",
  },
  gujranwala: {
    intro:
      "Gujranwala weddings emphasize family scale — guest counts here regularly exceed 500. Banquet halls are built for it. Catering depth (BBQ, regional Punjabi cuisine) is exceptionally strong.",
    peakSeason: "October–February",
    notable:
      "GT Road and Satellite Town carry the prestige venues. Cantonment-side farmhouses serve bigger outdoor events.",
    priceContext:
      "Lower-mid range — vendor competition keeps per-head pricing accessible.",
  },
  hyderabad: {
    intro:
      "Hyderabad weddings blend Sindhi traditional ceremonies with mainstream Pakistani structure. Vendor specialization in regional cuisine (Sindhi BBQ, Sindhi sweet dishes) is a real differentiator.",
    peakSeason: "November–February (avoid April–June heat)",
    notable:
      "Latifabad and Qasimabad host the prestige banquet halls. Riverside farmhouse venues run popular for daytime mehndis.",
    priceContext:
      "Lower-mid range — Hyderabad typically runs 30–40% below Karachi for the same service.",
  },
  quetta: {
    intro:
      "Quetta weddings remain among the most traditional in Pakistan — extended-family-driven, structured around long ceremonial mehndis and walimas. The vendor pool is small but trusted within the community.",
    peakSeason: "September–November and March–May (avoid winter snow + summer dust)",
    notable:
      "Satellite Town and Jinnah Road area host the city's banquet halls. Many weddings still happen at family residences with rented marquees.",
    priceContext:
      "Conservative spend; vendor pricing tends toward all-inclusive packages.",
  },
  bahawalpur: {
    intro:
      "Bahawalpur weddings carry the city's princely-state aesthetic — Mughal-Saraiki decor traditions, deep-tone color palettes, and an emphasis on hospitality. Venues range from heritage haveli courtyards to modern banquet halls.",
    peakSeason: "November–February",
    notable:
      "Model Town and the Cantonment area host most modern banquet halls. Heritage venues (Noor Mahal, etc.) occasionally host high-end events.",
    priceContext:
      "Lower PKR range — Bahawalpur typically runs at the most affordable end of Punjab pricing.",
  },
}

/**
 * Vendor-type-specific "what to look for" copy. Pairs with the city
 * editorial to produce unique content per city × vendor-type cell.
 *
 * Keyed by the SEO slug — see VENDOR_TYPES in constants.ts.
 */
export const VENDOR_TYPE_GUIDE: Record<string, string> = {
  "wedding-venues":
    "When evaluating a venue, ask about peak-date holds (most charge a non-refundable booking fee), parking capacity for your guest count, the in-house catering markup vs allowing outside vendors, and whether the venue's decor scheme works with your color palette before adding paid customization.",
  "wedding-photographers":
    "Look for a full event portfolio (not just couple portraits), confirmed cinematography coverage (separate from photography in some packages), delivery timelines (the average in Pakistan is 6–10 weeks for full edits), and raw-photo handover rights for your archive.",
  "wedding-planners":
    "Confirm whether you want full-service (vendor coordination + design + day-of run-of-show) or just day-of coordination — the cost difference is significant. Ask for the planner's preferred-vendor network and whether they take vendor kickbacks (it affects what they recommend).",
  caterers:
    "Pakistani catering is per-head — confirm exact menu options at each price tier, ask whether servers/waiters are included or extra, and verify minimum guest counts. Always do a menu tasting before signing.",
  "wedding-decorators":
    "Look at flower vs theme-decor pricing separately; the cost difference is 3–5x. Confirm setup and teardown windows (some venues charge overtime), and ask whether the decorator handles stage backdrop or if you need a separate stage-design vendor.",
  "mehndi-artists":
    "Confirm style preference upfront — traditional Pakistani / Indian / Arabic / modern minimal each look distinctly different on hand-and-feet portraits. Most artists charge per pair of hands + feet, not flat per-bride. Ask about session time per design (a full bridal set is 4–6 hours).",
  "bridal-makeup-artists":
    "Always schedule a trial 4–6 weeks before the wedding. Confirm whether the package includes the bride only or also includes ladies (sisters, mother). Verify product brands used — high-pigment HD makeup photographs differently than soft glam under venue lighting.",
  "bridal-wear":
    "Allow 8–12 weeks for custom-stitched bridal wear; longer for heavy zardosi or pearl work. Confirm fitting schedule (typically 3 fittings) and whether matching dupatta, jewelry rentals, or stitching of accompanying outfits is included.",
  "wedding-stationery":
    "Pakistani wedding invites are increasingly hybrid — printed for elders + digital for everyone else. Confirm design rounds included (most printers cap at 2–3 revisions), printing technique (foil-press, letterpress, digital), and minimum order quantity for printed sets.",
  "wedding-cars":
    "Luxury car rental for shaadi runs hourly with daily caps. Confirm chauffeur is included (it usually is), fuel allowance / extra-km charges, decoration setup, and whether the car is for baraat entry only or full-day use including doli.",
  "wedding-djs":
    "Confirm setup and sound-check time (some DJs charge for early setup), playlist customization rounds, lighting included or extra, and whether the DJ provides MC services for the entry / cake-cut moments.",
}

/**
 * Get a typed editorial entry for a city slug.
 * Returns a sensible-fallback object if the slug isn't in our editorial set
 * so the page never crashes on a new city before its blurb is written.
 */
export function getCityEditorial(slug: string): CityEditorial {
  return (
    CITY_EDITORIAL[slug as CitySlug] ?? {
      intro: "",
      peakSeason: "October–March (peak shaadi season nationwide)",
      notable: "",
      priceContext: "",
    }
  )
}

export function getVendorTypeGuide(slug: string): string {
  return VENDOR_TYPE_GUIDE[slug] ?? ""
}

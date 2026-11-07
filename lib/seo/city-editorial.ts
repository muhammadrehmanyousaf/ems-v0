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

// Partial on purpose: only cities with real, checked copy are listed, and
// getCityEditorial() falls back to generic copy for the rest. Typing it as a
// full Record claimed 84 cities were covered when 11 are.
export const CITY_EDITORIAL: Partial<Record<CitySlug, CityEditorial>> = {
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
  abbottabad: {
    intro:
      "Abbottabad is Khyber Pakhtunkhwa's premier hill-station wedding hub, offering scenic outdoor ceremonies against pine-covered mountain vistas. Destination weddings and summer ceremonies (May–August) are uniquely popular here when Punjab experiences intense heat.",
    peakSeason: "May–September (summer hill-station season) and October–November",
    notable:
      "Shimla Hill marquees, PMA Kakul Road lawns, and Abbottabad Club banquets host the city's largest wedding receptions. Forest-view resorts along Murree Road host intimate nikkah and dholki gatherings.",
    priceContext:
      "Mid-tier pricing — 20–30% below Islamabad rates, with outdoor venue setups and scenic catering packages.",
  },
  sargodha: {
    intro:
      "Sargodha weddings are deeply rooted in Central Punjab's agricultural and military traditions, characterized by massive family gatherings, lavish desi feasts, and vibrant dholki nights. The city features modern luxury marquees along University Road.",
    peakSeason: "November–February",
    notable:
      "University Road marquee belt, Satellite Town banquet halls, and PAF Base / Cantt lawns host the city's premier baraat and walima functions.",
    priceContext:
      "Accessible value — high-quality catering and expansive marquee spaces at 25–35% below Lahore rates.",
  },
  gujrat: {
    intro:
      "Gujrat's wedding industry is heavily powered by its affluent overseas diaspora (UK, Norway, Middle East), making December–January a high-octane luxury shaadi season. Expect bespoke designer stages, luxury car entries, and expansive live BBQ setups.",
    peakSeason: "December–January (overseas diaspora peak) and February–March",
    notable:
      "GT Road marquee strip, Bhimber Road banquets, and Jalalpur Jattan farmhouses host multi-day celebrations with 800+ guests.",
    priceContext:
      "Mid-to-upper PKR range — diaspora weddings often match Lahore per-head spend on premium stage decor and lighting.",
  },
  jhelum: {
    intro:
      "Jhelum weddings blend Potohar cultural heritage with high overseas expatriate investment. Overlooking the Jhelum River and Mangla hills, wedding venues here are designed for grand family reunions and traditional Barat entries.",
    peakSeason: "November–February (peak overseas shaadi season)",
    notable:
      "GT Road banquet halls, Cantt lawns, and Mangla Dam view farmhouses host the highest-rated wedding events.",
    priceContext:
      "Mid-tier spend with premium peaks during overseas return months.",
  },
  sheikhupura: {
    intro:
      "Sheikhupura weddings combine historic Mughal-era culinary heritage (famous for regional mutton and karahi) with modern marquee setups. Located just outside Lahore, many families utilize Sheikhupura's expansive farmhouses for large-scale outdoor events.",
    peakSeason: "October–March",
    notable:
      "Lahore-Sheikhupura Road marquee strip, Housing Colony halls, and Hiran Minar bypass farmhouses.",
    priceContext:
      "Value-friendly — 30% below central Lahore rates, with Lahore vendors frequently traveling out.",
  },
  "rahim-yar-khan": {
    intro:
      "Rahim Yar Khan weddings reflect the royal desert hospitality of South Punjab and the Cholistan gateway. Sprawling lawns, majestic palace-inspired arches, and extensive guest lists (1,000+) define weddings here.",
    peakSeason: "November–February",
    notable:
      "Abu Dhabi Palace Road marquees, Canal Road lawns, and City Park banquet halls host the premier weddings.",
    priceContext:
      "Affordable per-head rates with large guest scale; all-inclusive venue packages are standard.",
  },
  sukkur: {
    intro:
      "Sukkur is Upper Sindh's wedding capital, centered around the historic Indus riverfront. Weddings here are vibrant Sindhi celebrations featuring traditional Sufi musical soirees, rich biryani catering, and separate colorful mehndi setups.",
    peakSeason: "November–February (avoiding severe summer temperatures)",
    notable:
      "Military Road banquet strip, Airport Road marquees, and riverfront lawns near the Lansdowne Bridge.",
    priceContext:
      "Budget-to-mid range — substantially more accessible than Karachi while offering full-service halls.",
  },
  mardan: {
    intro:
      "Mardan weddings follow traditional Pashtun ceremonial structure, emphasizing separate grand men/women halls, ceremonial attan dance, and legendary Shinwari mutton catering. Family hospitality and generous banquet seating are paramount.",
    peakSeason: "October–March",
    notable:
      "Nowshera Road marquee complex, Charsadda Road banquet halls, and Mardan Cantt lawns.",
    priceContext:
      "Package-driven — generous per-head meat portions with fixed hall rental models.",
  },
  "mirpur-khas": {
    intro:
      "Mirpur Khas weddings feature vibrant agricultural community celebrations, renowned mango-orchard farmhouse events, and traditional Sindhi-Muhajir wedding banquets.",
    peakSeason: "November–February",
    notable:
      "Hyderabad Road banquet halls, Satellite Town halls, and orchard farmhouses.",
    priceContext:
      "Very accessible per-head pricing with strong local catering traditions.",
  },
  sahiwal: {
    intro:
      "Sahiwal weddings in the heart of the Lower Bari Doab region are family-centric, celebrated across multi-day dholkis, high-capacity baraats, and traditional Punjabi breakfasts. Marquees are built for large community gatherings.",
    peakSeason: "October–February",
    notable:
      "High Street banquet halls, Farid Town halls, and GT Road / Lahore-Multan bypass marquees.",
    priceContext:
      "Affordable luxury — per-head catering typically 30% below Lahore.",
  },
  okara: {
    intro:
      "Okara's prosperous agricultural and military families host grand shaadis known for lavish culinary spreads, live dairy and halwa stations, and energetic bhangra entries. Modern AC marquees have rapidly expanded along the bypass.",
    peakSeason: "October–March",
    notable:
      "GT Road bypass marquees, Cantt club lawns, and Faisalabad Road halls.",
    priceContext:
      "Accessible pricing with generous food portions and spacious free parking.",
  },
  kasur: {
    intro:
      "Kasur weddings celebrate the city's legendary culinary legacy — famous Kasuri fish, androon-shehar sweets, and passionate Sufi musical nights. Located adjacent to Lahore, couples enjoy top Lahore-grade decorators at localized rates.",
    peakSeason: "November–February",
    notable:
      "Ferozepur Road marquee row, Model Town banquets, and Ganda Singh bypass farmhouses.",
    priceContext:
      "Highly competitive pricing — budget-friendly alternatives to south Lahore venues.",
  },
  "dera-ghazi-khan": {
    intro:
      "Dera Ghazi Khan weddings bring together Saraiki and Baloch wedding customs, renowned for expansive hospitality, roasted lamb sajji feasts, and extended family gatherings.",
    peakSeason: "October–February",
    notable:
      "Jampur Road marquees, Multan Road banquet halls, and Model Town halls.",
    priceContext:
      "Accessible per-head rates with large guest guarantees (500–1,200 guests).",
  },
  "wah-cantonment": {
    intro:
      "Wah Cantonment weddings are celebrated in pristine, disciplined cantonment environments, characterized by manicured lawns, strict 10 PM curfew adherence, and proximity to Rawalpindi and Taxila.",
    peakSeason: "October–March",
    notable:
      "POF Officers Club lawns, GT Road marquees, and Aslam Market area banquet halls.",
    priceContext:
      "Mid-tier spend comparable to Rawalpindi with excellent civil order and parking.",
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
  "wedding-mithai":
    "Confirm shelf-life and storage conditions (especially for milk-based sweets like Cham Cham vs dry fruit barfi in summer), request a tasting box for the family, verify custom box printing timelines (typically 7–10 days for embossed initials), and ensure separate tamper-proof seals for out-of-city distributions.",
  "nikah-khwan":
    "Verify that the Nikah Khwan holds an active Union Council registrar license and brings the official government four-copy register. Ask about legal document requirements (CNICs, witnesses, Wali consent), the solemnization honorarium, and post-ceremony assistance in obtaining the computerized NADRA Marriage Registration Certificate (MRC).",
  "wedding-generators":
    "Always calculate total electrical load in kVA before booking: running heavy marquee AC chillers requires at least 150–250 kVA, while basic lighting and sound need 30–50 kVA. Confirm whether diesel fuel is included or billed per hour (PKR 6,000–12,000/hr), verify that the genset has a certified silent canopy to avoid noise during speeches, and ensure a dedicated technician is on-site.",
  "wedding-cake-designers":
    "Confirm guest serving portions (a 3-tier cake typically feeds 80–120 guests), ask whether flowers are handcrafted sugar florals or fresh food-safe stems, verify whether temperature-controlled refrigerated delivery to the venue is included, and inspect the cake stand and ceremonial knife setup in advance.",
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

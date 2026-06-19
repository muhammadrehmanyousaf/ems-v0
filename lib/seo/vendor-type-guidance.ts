// Generic, TRUE best-practice guidance + FAQs per vendor type, used to
// enrich each vendor's detail page with unique, helpful, rankable text.
//
// IMPORTANT — content contract:
//   • Everything here is GENERIC advice the reader can trust. It is NOT
//     data about any specific business. Never add prices, rupee amounts,
//     "X years experience", awards, statistics, or brand names here.
//   • The literal token {city} is string-replaced at render time with the
//     vendor's city. Use it only where a city reference reads naturally.
//   • Tone is for the Pakistani wedding context (mehndi / barat / walima,
//     load-shedding, Oct–Mar peak season, advance + cancellation norms,
//     and modest cultural expectations).
//
// Keyed by the EXACT backend vendorType enum strings (see
// ../vendor-types.ts → VENDOR_TYPES). Keep in lock-step with that file.

export interface VendorTypeGuidance {
  intro: string; // 2 sentences. May contain the literal token {city}.
  ask: string[]; // exactly 4 "what to ask / how to choose" best-practice points. May contain {city}.
  faqs: { q: string; a: string }[]; // exactly 3 Q&A. May contain {city}.
}

export const VENDOR_TYPE_GUIDANCE: Record<string, VendorTypeGuidance> = {
  "Wedding venue": {
    intro:
      "Choosing the right wedding venue in {city} sets the tone for your entire barat or walima, from guest capacity to parking and catering rules. Booking early matters most during the October–March peak season, when the best halls, lawns and marquees in {city} fill up months in advance.",
    ask: [
      "Confirm the seated guest capacity and whether the price is per-event or has a per-head minimum, so a 400-guest walima isn't squeezed into a 250-seat hall.",
      "Ask whether outside catering and decorators are allowed or if the venue is exclusive, since many {city} venues charge extra or forbid bringing your own vendors.",
      "Check the load-shedding plan: is there an on-site generator with enough backup to run AC and lights through the full function without interruption?",
      "Get the advance, the cancellation and date-change policy, the booking timings (single function vs. full-day), and any rules on dhol, music volume or closing time in writing.",
    ],
    faqs: [
      {
        q: "How far in advance should I book a wedding venue in {city}?",
        a: "For weddings during the October–March peak season, popular venues in {city} are often reserved several months ahead, so it is wise to start looking as early as you can. Off-season and weekday dates usually have more availability and flexibility.",
      },
      {
        q: "What is usually included in a venue booking?",
        a: "This varies a lot — some venues include in-house catering, basic stage and seating, AC and a bridal room, while others rent only the bare space. Always get an itemised list so you know what you must arrange separately, such as decor, sound or generator backup.",
      },
      {
        q: "Is the advance refundable if we cancel or change the date?",
        a: "Most venues take a non-refundable advance to hold the date, with cancellation and date-change terms that tighten as the event nears. Ask for the exact policy in writing before paying so there are no surprises.",
      },
    ],
  },

  "Makeup artist": {
    intro:
      "Your bridal makeup artist in {city} is one of the most photographed parts of your day, so choosing one whose style suits your features and outfit matters enormously. The best makeup artists in {city} get booked early for the October–March wedding season, and weekend dates go fastest.",
    ask: [
      "Look at unfiltered, natural-light photos of real brides (not just heavily edited shots) to judge whether the artist's style matches the soft, dewy or full-glam look you want.",
      "Book a paid trial before your barat or walima to test the look, check how it photographs, and confirm it suits your skin tone and outfit colours.",
      "Ask whether they travel to your home or the venue in {city}, how many hours they need, and whether hairstyling, draping and a touch-up are included or charged separately.",
      "Confirm whether the senior artist personally does your makeup or assigns a team member, and clarify the advance, date-lock and cancellation terms.",
    ],
    faqs: [
      {
        q: "Should I book a bridal makeup trial first?",
        a: "Yes — a trial lets you see the look in person and in photos, raise any concerns, and avoid surprises on the actual day. It is especially worth it if you have specific preferences about how light, heavy or long-wearing the makeup should be.",
      },
      {
        q: "Does the makeup artist come to my home or do I go to a studio?",
        a: "Many bridal artists in {city} offer both home or venue service and studio appointments, though travel may add to the cost. Confirm this when booking, particularly if you need to be ready early before the function.",
      },
      {
        q: "How long does bridal makeup take on the wedding day?",
        a: "Full bridal makeup with hair and dupatta setting commonly takes a few hours, so plan a comfortable start time before your barat or walima. Booking the artist early in the day reduces the rush and lets photography stay on schedule.",
      },
    ],
  },

  "Mithai and sweets": {
    intro:
      "Mithai is central to Pakistani wedding traditions — from mooh meetha at the engagement to boxes distributed at the barat and walima in {city}. Ordering early ensures freshness, the flavours you want, and enough quantity for every guest, especially during the busy October–March season.",
    ask: [
      "Taste before ordering and confirm freshness, since traditional mithai like barfi, gulab jaman and ladoo is best made close to the event date rather than far ahead.",
      "Ask about per-kg pricing versus packaged guest boxes, and clarify whether distribution or delivery to your venue in {city} is included.",
      "Discuss custom packaging if you want branded or themed sweet boxes for guests to take home, and confirm the lead time needed.",
      "Confirm hygiene and storage, especially for milk-based sweets in warm weather, and lock the order quantity, advance and delivery slot in writing.",
    ],
    faqs: [
      {
        q: "How early should I order wedding mithai in {city}?",
        a: "Place your order a few weeks ahead so the shop can plan quantity and packaging, but agree that milk-based sweets are prepared close to the event for freshness. During peak wedding season in {city}, ordering early also secures your delivery slot.",
      },
      {
        q: "Can I get sweets in branded or themed guest boxes?",
        a: "Many sweet sellers offer custom or themed packaging for guest take-home boxes, which adds a personal touch to your barat or walima. Ask about the minimum quantity and the extra lead time custom boxes require.",
      },
      {
        q: "Are sugar-free or special options available?",
        a: "Some vendors prepare sugar-free or lighter options for guests with dietary needs — ask in advance, as these are usually made to order. Confirm quantity and any price difference when you place the main order.",
      },
    ],
  },

  "Catering": {
    intro:
      "Catering is one of the most memorable parts of any Pakistani wedding, and the right caterer in {city} balances taste, hygiene and smooth service for a large guest count. Quality caterers book out fast during the October–March peak season, so confirm your date and menu early.",
    ask: [
      "Request a food tasting before booking so you can judge the actual quality of the biryani, salan, BBQ and desserts you'll serve at your barat or walima.",
      "Confirm whether pricing is per-head and what the minimum guest count is, and get clarity on what waiters, crockery, chafing dishes and live counters are included.",
      "Ask how the caterer guarantees freshness and hygiene for a large gathering, and whether ingredients are halal-sourced.",
      "Lock the final headcount deadline, the advance, the per-head rate and the cancellation policy in writing, and discuss the buffer plan if guests exceed the estimate.",
    ],
    faqs: [
      {
        q: "Can I taste the food before booking a caterer?",
        a: "Reputable caterers in {city} usually offer a tasting session so you can confirm flavour, portion and presentation before committing. This is the single best way to avoid disappointment on the wedding day.",
      },
      {
        q: "How is wedding catering priced?",
        a: "Catering is most often priced per head, with a minimum guest count, and the rate depends on the menu and number of dishes. Always confirm what is included — waiters, crockery, setup and live stations may be add-ons.",
      },
      {
        q: "What happens if more guests turn up than expected?",
        a: "Pakistani weddings often see extra guests, so good caterers prepare a buffer and agree in advance how additional plates are charged. Ask about this upfront and confirm a cut-off date for your final headcount.",
      },
    ],
  },

  "Photographer": {
    intro:
      "Your wedding photographer in {city} captures memories you'll revisit for a lifetime, so matching their style to your taste is more important than any single feature. Skilled photographers are booked months ahead for the October–March season, and prime dates go first.",
    ask: [
      "Review full real wedding galleries (not just highlight reels) so you can judge consistency across the mehndi, barat and walima rather than a few hero shots.",
      "Confirm exactly who shoots your event — the lead photographer or an assistant — and how many shooters and videographers are included.",
      "Clarify deliverables and timelines: number of edited photos, the cinematic film, raw files, album, online gallery, and how long delivery takes after the wedding.",
      "Ask about coverage for multiple functions, travel within {city}, drone or extra-day charges, the advance and the cancellation or reschedule policy.",
    ],
    faqs: [
      {
        q: "How early should I book a wedding photographer in {city}?",
        a: "Good photographers in {city} are reserved months in advance, especially for weekend dates in peak season, so book as soon as your dates are fixed. Early booking also gives you time for an engagement or pre-wedding shoot if you want one.",
      },
      {
        q: "Will the photographer I meet actually shoot my wedding?",
        a: "Larger studios sometimes send a team rather than the lead photographer, so confirm in writing who will personally cover your functions. This avoids a mismatch between the portfolio you loved and the person who shows up.",
      },
      {
        q: "How long until I receive my photos and video?",
        a: "Editing wedding photos and a cinematic film takes time, and delivery commonly ranges from a few weeks to a couple of months. Agree on the timeline, the number of edited images, and the album format before booking.",
      },
    ],
  },

  "Car rental": {
    intro:
      "A wedding car rental in {city} covers the grand entrance, the doli departure and guest transport, so reliability and presentation matter as much as the vehicle itself. Decorated cars and luxury vehicles are in high demand during the October–March wedding season, so reserve early.",
    ask: [
      "Confirm the exact make, model, colour and condition of the car, and ask to see recent photos so the vehicle that arrives matches what you booked.",
      "Clarify whether a chauffeur, fuel and decoration (flowers or ribbons) are included, or charged separately, for your barat and doli in {city}.",
      "Ask about the hours included, overtime charges, and the coverage area in case the venue or the doli route is outside the city.",
      "Get a backup-vehicle commitment in case of breakdown, and lock the timing, advance and cancellation terms in writing.",
    ],
    faqs: [
      {
        q: "Is the driver and fuel included in a wedding car rental?",
        a: "This varies — some rentals include a chauffeur and fuel within a set distance, while others charge them separately. Always confirm what the quoted price covers and what happens if you exceed the included hours or mileage.",
      },
      {
        q: "Does the car come decorated for the wedding?",
        a: "Floral or ribbon decoration is often offered as an add-on rather than included by default, so ask specifically. Confirm the style and who arranges the flowers if you want the car ready for the doli.",
      },
      {
        q: "What if the car breaks down on the wedding day?",
        a: "Ask the provider about their backup plan and whether a replacement vehicle can be sent quickly. A reliable rental in {city} will commit to a contingency so your barat or doli isn't delayed.",
      },
    ],
  },

  "Nikahkhwan": {
    intro:
      "A Nikahkhwan is the qualified person who performs and registers your nikah, recites the khutba and guides both families through the Islamic marriage ceremony. Choosing the right Nikahkhwan in {city} ensures the nikah is conducted correctly, the nikahnama is filled properly, and the ceremony suits your family's wishes.",
    ask: [
      "Confirm the Nikahkhwan is authorised to conduct and register the nikah, and that the nikahnama will be completed and submitted correctly.",
      "Discuss the languages they recite and explain in (Arabic, Urdu, English or regional), so both families and any overseas relatives can follow along.",
      "Ask whether they help draft the nikahnama, advise on the mehr clauses, and arrange witnesses if your family needs them.",
      "Confirm whether they travel to your home or venue in {city}, the sermon length you prefer (brief or extended), and any rules on female attendees so the seating is arranged respectfully.",
    ],
    faqs: [
      {
        q: "What does a Nikahkhwan actually do at the ceremony?",
        a: "The Nikahkhwan recites the khutba, seeks consent (ijab-o-qabool) from the bride and groom, oversees the signing and witnessing of the nikahnama, and offers dua. Many also explain each step so both families understand the proceedings.",
      },
      {
        q: "Does the Nikahkhwan handle the nikahnama paperwork?",
        a: "Many Nikahkhwan help fill the nikahnama correctly and ensure it is registered, but confirm this when booking. Filling the mehr and conditions clauses properly is important, so ask whether they guide you through it.",
      },
      {
        q: "Can the Nikahkhwan come to our home or venue in {city}?",
        a: "Many are willing to travel to a home or wedding venue in {city} rather than only conducting the nikah at a masjid. Confirm travel, timing and the preferred sermon length when you book.",
      },
    ],
  },

  "Marquee rental": {
    intro:
      "A marquee or tent rental in {city} turns a home lawn, farmhouse or open ground into a complete wedding venue for your mehndi, barat or walima. Setup quality, weather readiness and on-time installation matter most, and the best marquee teams are booked early for the October–March season.",
    ask: [
      "Confirm the guest capacity the marquee comfortably seats, and whether chairs, tables, carpet, lighting and side walls are included or charged separately.",
      "Ask how many hours setup and teardown take, and whether the team installs the day before so everything is ready well ahead of your function in {city}.",
      "Discuss weather and cooling: wall-sided tents for wind or winter, fans or AC for the crowd, and a plan if rain is forecast.",
      "Clarify the site requirements (ground space, access for trucks), the advance, and the cancellation or date-change policy in writing.",
    ],
    faqs: [
      {
        q: "Does a marquee rental include chairs, tables and lighting?",
        a: "Some packages include seating, carpet and lighting while others price these separately, so always get an itemised list. Confirm exactly what arrives so you can arrange anything missing in time.",
      },
      {
        q: "How much space do I need for a marquee at home?",
        a: "The required ground depends on your guest count and the seating layout, plus room for catering and a stage. Share your expected numbers and the site with the rental team in {city} so they can recommend the right size.",
      },
      {
        q: "Can the marquee handle rain or cold weather?",
        a: "Wall-sided tents, waterproof covers and heaters or coolers help manage weather, which matters for outdoor functions. Ask the provider about their contingency plan, especially for winter weddings or if rain is possible.",
      },
    ],
  },

  "Decorator": {
    intro:
      "A wedding decorator in {city} shapes the entire visual mood of your mehndi, barat and walima — from the stage and backdrop to flowers, lighting and entrance. Distinctive themes and prime dates book out early in the October–March season, so share your vision well ahead of time.",
    ask: [
      "Look at photos of past setups that match your theme and budget, and confirm the decorator can recreate the stage, backdrop and lighting style you want.",
      "Clarify exactly what's included — flowers (fresh or artificial), lighting, drapes, props and table decor — versus what costs extra.",
      "Ask how much setup time they need at the venue in {city} and whether they coordinate with the venue's own rules on timing and fixtures.",
      "Confirm whether they handle separate decor for multiple functions, the advance, and the cancellation or change policy in writing.",
    ],
    faqs: [
      {
        q: "Can the decorator match a specific theme or colour palette?",
        a: "Most decorators in {city} will work to a theme or palette you share, so bring reference photos to align expectations. Discuss what is achievable within your budget so the final setup matches your vision.",
      },
      {
        q: "Are fresh flowers or artificial decor used?",
        a: "Decorators offer both, and the choice affects look, longevity and cost — fresh flowers feel premium but artificial holds up longer in heat. Ask what they recommend for your stage and season.",
      },
      {
        q: "How much time does decoration setup need at the venue?",
        a: "Elaborate stages and floral work take several hours, so the decorator needs venue access well before guests arrive. Confirm the setup window with both the decorator and your venue in {city} to avoid clashes.",
      },
    ],
  },

  "Florist": {
    intro:
      "A florist for your wedding in {city} provides the fresh blooms that bring stages, cars, bouquets and garlands to life across the mehndi, barat and walima. Flower quality and freshness on the day matter most, and demand peaks sharply during the October–March wedding season.",
    ask: [
      "Confirm whether the florist uses fresh or imported flowers, and how they keep them fresh from arrangement until your function in {city}.",
      "Discuss exactly what you need — stage florals, bridal bouquet, car decor, table centerpieces, sehra or garlands (haar) for the nikah and doli.",
      "Ask about seasonal availability, since some flowers are harder to source in certain months, and what alternatives they suggest.",
      "Clarify delivery and on-site setup timing, the advance, and the policy if a particular flower is unavailable on the day.",
    ],
    faqs: [
      {
        q: "Will the flowers stay fresh through the whole function?",
        a: "Good florists time their preparation and use proper handling so arrangements look fresh when guests arrive, which is important in warm weather. Ask how they manage freshness from delivery through the event in {city}.",
      },
      {
        q: "Can I get specific or imported flowers for my wedding?",
        a: "Many florists can source imported or specific blooms, but availability depends on the season and lead time. Share your preferences early so they can confirm what's possible and suggest alternatives if needed.",
      },
      {
        q: "Does the florist provide garlands and sehra too?",
        a: "Many offer garlands (haar) for the stage, nikah and doli, plus the groom's sehra, alongside bouquets and centerpieces. Confirm the full list you need so nothing is missed for your barat or walima.",
      },
    ],
  },

  "Generator rental": {
    intro:
      "A generator rental in {city} is essential insurance against load-shedding and power cuts that could otherwise interrupt your wedding lights, AC and sound. The right backup keeps the function running smoothly, and demand is high through the October–March season, so reserve a unit early.",
    ask: [
      "Confirm the generator's capacity (KVA) is sufficient to run the venue lights, AC, sound and catering equipment together without overload.",
      "Ask whether fuel is included or billed separately, and whether an operator stays on-site throughout your function in {city} to manage it.",
      "Clarify whether it's sound-proofed (so noise doesn't disturb the function) and whether the unit is outdoor-rated for lawn or marquee setups.",
      "Discuss delivery, pickup and setup timing, a backup unit in case of failure, and lock the advance and cancellation terms in writing.",
    ],
    faqs: [
      {
        q: "What size generator do I need for my wedding?",
        a: "The right KVA depends on the combined load of lights, AC, sound and kitchen equipment, so share your venue and equipment list. A reliable rental in {city} will calculate the capacity and suggest a margin so nothing trips during peak load.",
      },
      {
        q: "Is fuel included in the generator rental?",
        a: "Fuel is sometimes included and sometimes billed by usage, so confirm this upfront to avoid surprises. Also ask whether an operator stays on-site to refuel and handle any issues during the function.",
      },
      {
        q: "Will the generator be noisy during the function?",
        a: "Sound-proofed (canopied) units run much quieter and are better suited to weddings where guests are nearby. Ask whether the unit is sound-proofed and where it will be placed so noise doesn't disturb your event.",
      },
    ],
  },

  "Bridal wearing": {
    intro:
      "Your bridal outfit is the centrepiece of your barat or walima, so choosing the right designer or boutique in {city} for your lehenga, gharara or maxi is a key decision. Custom and made-to-order bridal wear needs a long lead time, especially during the busy October–March season.",
    ask: [
      "Confirm the lead time needed for a custom outfit and build in buffer for fittings, since detailed bridal embroidery and beadwork take weeks or months.",
      "Clarify whether the price covers the full ensemble — shirt, dupatta, lehenga and inner — or whether items are charged separately.",
      "Ask about trial and fitting sessions, alteration policy, and how close to the wedding the final fitting happens so the fit is perfect.",
      "Discuss whether they offer rental options, groom or family outfits, and the advance, delivery and cancellation terms for your wedding in {city}.",
    ],
    faqs: [
      {
        q: "How early should I order my bridal outfit in {city}?",
        a: "Custom bridal wear with heavy embroidery needs a generous lead time, so order well ahead and allow extra weeks for fittings and finishing. During peak wedding season in {city}, designers' calendars fill quickly, so the earlier the better.",
      },
      {
        q: "Are alterations and fittings included?",
        a: "Many boutiques include trial fittings and minor alterations, but confirm the policy and how many fittings are offered. A final fitting close to the wedding helps ensure the outfit sits perfectly on the day.",
      },
      {
        q: "Can I rent a bridal outfit instead of buying?",
        a: "Some boutiques in {city} offer rental for bridal and family outfits, which can be a practical option for a one-time wear. Ask about availability, sizing, the security deposit and the return condition required.",
      },
    ],
  },

  "Wedding cakes": {
    intro:
      "A wedding cake adds a memorable centrepiece to the reception and cake-cutting moment at your function in {city}. Custom tiered and themed cakes need to be ordered ahead, and demand rises during the October–March wedding season, so book your design early.",
    ask: [
      "Discuss the design, number of tiers and finish (fondant for a sculpted look or fresh cream for a softer taste) so the cake matches your theme.",
      "Ask about a tasting and the flavour options, and confirm whether eggless or other dietary versions are available for your guests.",
      "Confirm the minimum order size for your guest count and whether delivery and on-site setup at your venue in {city} are included.",
      "Clarify how the cake is kept stable and fresh in warm weather, the advance, and the policy if the design needs a last-minute change.",
    ],
    faqs: [
      {
        q: "How far ahead should I order a wedding cake?",
        a: "Custom and tiered cakes need to be ordered well in advance so the design and tasting can be finalised. During peak season in {city}, bakers' slots fill fast, so confirming early secures both your date and your design.",
      },
      {
        q: "Is a cake tasting available before I order?",
        a: "Many bakers offer a tasting so you can choose your flavour and confirm quality before committing. Ask whether the tasting is free, paid or credited toward your order.",
      },
      {
        q: "Can the cake be delivered and set up at the venue?",
        a: "Tiered cakes are often delivered and assembled on-site to avoid damage in transit, but confirm whether this is included. Discuss how the baker keeps the cake stable and fresh in warm weather at your venue in {city}.",
      },
    ],
  },

  "Henna artist": {
    intro:
      "A henna (mehndi) artist in {city} creates the intricate bridal designs that are a treasured part of the mehndi function and the days leading up to the wedding. Booking the right artist early matters most during the October–March season, when bridal slots fill quickly.",
    ask: [
      "Review photos of the artist's bridal work to confirm their style — traditional, Arabic, Indo-Arabic or modern — matches the design you have in mind.",
      "Confirm whether they use natural henna for a rich, safe stain, and how long before the function the application should happen for the colour to deepen.",
      "Ask how many hours detailed bridal hands and feet take, and whether they bring a team for the bridesmaids and family at your mehndi in {city}.",
      "Clarify whether they travel to your home or venue, the advance, and the date-lock and cancellation terms.",
    ],
    faqs: [
      {
        q: "When should the bridal mehndi be applied before the wedding?",
        a: "Bridal henna is usually applied a day or two before so the stain has time to darken to its richest colour. Your artist in {city} can advise the best timing based on the design and how deep a stain you want.",
      },
      {
        q: "Is natural henna safer and better than chemical cones?",
        a: "Natural, well-prepared henna gives a safe, deep stain and avoids skin reactions linked to some chemical 'black henna' cones. Ask your artist what they use, especially if you have sensitive skin.",
      },
      {
        q: "Can the artist also do mehndi for family and guests?",
        a: "Many bridal artists bring a team to apply simpler designs for bridesmaids and family during the mehndi function. Confirm the number of guests and the time needed so everyone is covered without a rush.",
      },
    ],
  },

  "Qawwali and Naat": {
    intro:
      "A Qawwali or Naat performance brings a devotional, soulful atmosphere to a wedding evening, mehfil or pre-wedding gathering in {city}. Choosing performers whose repertoire and style suit your family sets the right spiritual tone, and skilled troupes are booked early for the October–March season.",
    ask: [
      "Discuss the repertoire and style you want — classic Sufi qawwali, Naat-khwani or a mix — and confirm the troupe is comfortable with your family's preferences.",
      "Ask about the troupe size, the instruments used (harmonium, tabla, dholak) and the languages they perform in, such as Urdu, Punjabi, Persian or Arabic.",
      "Confirm whether they bring their own sound system or need one arranged at your venue in {city}, and how the seating should be set for the mehfil.",
      "Clarify the session length, whether the seating can accommodate a respectful female arrangement, the advance and the cancellation terms.",
    ],
    faqs: [
      {
        q: "What's the difference between Qawwali and Naat at a wedding?",
        a: "Qawwali is a devotional Sufi performance with rhythm and chorus, while Naat is the recitation of poetry in praise of the Prophet (peace be upon him), often softer in tone. Many gatherings include both, so discuss the balance you'd like for your evening.",
      },
      {
        q: "Do the performers bring their own sound system?",
        a: "Some troupes carry their own equipment while others expect the venue to provide it, so confirm this in advance. Coordinating sound early avoids last-minute issues at your mehfil in {city}.",
      },
      {
        q: "Can the seating respect a separate female arrangement?",
        a: "Many families prefer a respectful seating layout, and experienced troupes are comfortable performing for such arrangements. Discuss your family's preferences when booking so the setup is planned accordingly.",
      },
    ],
  },

  "Sound system rental": {
    intro:
      "A sound system rental in {city} ensures the nikah, speeches, music and announcements are heard clearly across your mehndi, barat or walima. Matching the equipment to your venue size and crowd is what makes the difference, and good setups are booked early in the October–March season.",
    ask: [
      "Confirm the number and power of speakers suits your guest count and venue, so the sound carries across a large hall or open lawn without distortion.",
      "Ask how many wireless mics are included for the nikah, MC and speeches, and whether a mixer and operator come with the setup.",
      "Clarify whether stage lighting, a DJ booth or extra add-ons are part of the package or charged separately for your function in {city}.",
      "Confirm that an operator stays on-site to manage levels, that the gear is outdoor-rated if needed, and lock the timing, advance and cancellation terms.",
    ],
    faqs: [
      {
        q: "How do I know the sound system is the right size for my venue?",
        a: "The speaker count and wattage should match your guest numbers and whether the venue is indoor or open-air. Share these details with the provider in {city} so they recommend a setup that covers the space clearly.",
      },
      {
        q: "Is an operator included to run the sound?",
        a: "A trained operator who manages mic levels and music transitions makes a big difference, but isn't always included by default. Confirm whether an on-site operator comes with the rental so the audio runs smoothly all evening.",
      },
      {
        q: "Can the same setup handle the nikah, speeches and music?",
        a: "Yes — a proper setup with enough wireless mics and a mixer can cover the nikah, announcements, speeches and music. Tell the provider what functions you need so they include the right number of mics and equipment.",
      },
    ],
  },

  "Dhol player": {
    intro:
      "A dhol player brings the unmistakable energy of a Pakistani wedding, setting the rhythm for the dholki, mehndi, baraat entrance and doli in {city}. Booking a skilled dhol performer early matters during the October–March season, when weekend dates are in high demand.",
    ask: [
      "Confirm how many dholis you need for the size and energy of your function, since a large baraat often calls for more than one performer.",
      "Clarify which events they cover — dholki, mehndi, the baraat entrance and the doli — and how many hours of performance are included.",
      "Ask whether they wear traditional attire for a fitting look and whether they bring complementary instruments like the naal or dholki.",
      "Confirm whether they accept female-only functions if needed, and lock the timing, arrival window, advance and cancellation terms for your event in {city}.",
    ],
    faqs: [
      {
        q: "How many dhol players do I need for my wedding?",
        a: "One dhol player suits a smaller gathering, while a large baraat or mehndi often feels better with two or more for fuller energy. Share your guest count and the moments you want covered so the provider in {city} can advise.",
      },
      {
        q: "Which functions does the dhol player cover?",
        a: "Dhol performers commonly cover the dholki, mehndi, the baraat entrance and the doli send-off, with a set number of hours included. Confirm exactly which events and timings you need so the booking matches your schedule.",
      },
      {
        q: "Can a dhol player perform at a female-only function?",
        a: "Some dhol performers accommodate female-only events depending on your family's preferences, so ask when booking. Confirm this in advance so the arrangement respects your family's wishes for the mehndi or dholki.",
      },
    ],
  },

  "Wedding Invitations and Stationery": {
    intro:
      "Wedding invitations and stationery set the first impression of your celebration, from the nikah and barat cards to mehndi invites, bid boxes and favour packaging in {city}. Designing and printing well-finished cards takes time, so order early — especially before the October–March wedding rush.",
    ask: [
      "Confirm the production turnaround and finalise your guest list early, since custom designs, printing and any laser-cut or foil finishes take time.",
      "Clarify whether you want separate cards for each event (nikah, barat, walima, mehndi) or a combined multi-event design, and whether matching envelopes are included.",
      "Ask about printing in Urdu, English or bilingual text, and whether they handle calligraphy, foil stamping, acrylic or scroll-style premium formats.",
      "Discuss the minimum order quantity, proofing before the full print run, delivery within {city} or by courier, and the advance and rush-order policy.",
    ],
    faqs: [
      {
        q: "How early should I order wedding invitations in {city}?",
        a: "Order well ahead so there's time to finalise the design, approve a proof, complete the print run and still distribute cards with notice. Custom finishes like laser-cutting, foil or scroll boxes need extra lead time, and peak season slows turnaround.",
      },
      {
        q: "Can I get separate cards for the nikah, barat and walima?",
        a: "Yes — many stationers design event-specific cards or a combined multi-event invite, along with matching mehndi cards and favour boxes. Decide which functions need their own card so the quantities and design are planned correctly.",
      },
      {
        q: "Will I see a proof before the full print run?",
        a: "Reputable stationers share a proof so you can check names, dates, wording and the Urdu or English text before printing everything. Always review the proof carefully, as corrections after the full run cost time and money.",
      },
    ],
  },
};

export function getVendorGuidance(type?: string | null): VendorTypeGuidance | null {
  if (!type) return null;
  return VENDOR_TYPE_GUIDANCE[type] ?? null;
}

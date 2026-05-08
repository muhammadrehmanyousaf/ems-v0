/**
 * Pakistani wedding glossary — short definitional entries targeting
 * "What is <term>?" search queries. Each term gets:
 *   - A one-sentence definition (extracted by AI Overview / featured snippet)
 *   - Longer explanatory paragraphs
 *   - Related terms for cross-linking
 *   - "When it happens" placement in the wedding sequence (for terms
 *     that are functions / ceremonies)
 *
 * Reference: docs/seo/00-master-seo-playbook.md §16 wedding-vertical
 *            + §22 AEO (definitional sentences as snippet-bait).
 */

export interface GlossaryRelated {
  term: string
  slug: string
}

export interface GlossaryTerm {
  /** URL slug — kebab-case, lowercase. */
  slug: string
  /** Display term as written in English. */
  term: string
  /** Urdu / native-script rendering of the term, when applicable. */
  termUrdu?: string
  /** ≤ 1 sentence, ≤ 30 words. The featured-snippet target. */
  definition: string
  /** Longer body — paragraphs of context. */
  body: GlossaryBlock[]
  /** Optional placement in the wedding sequence. */
  placement?: string
  /** Cross-link suggestions — kept as `{ term, slug }` for type safety. */
  related?: GlossaryRelated[]
  /** SEO synonyms / spelling variants the term answers to. */
  aliases?: string[]
}

export type GlossaryBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "mehndi",
    term: "Mehndi",
    termUrdu: "مہندی",
    definition:
      "A pre-wedding celebration in Pakistani weddings where henna is applied to the bride's hands and feet, accompanied by music, dance, and family gatherings.",
    placement:
      "1–3 days before the baraat (wedding day). Sometimes split into separate functions for the bride's and groom's sides.",
    body: [
      {
        type: "p",
        text: "The mehndi is the warmest and most family-centred of the Pakistani wedding functions. While the literal mehndi refers to the henna paste applied in intricate patterns on the bride's hands and feet, the modern Pakistani mehndi function is a full evening of music, choreographed dance performances by family members, and shared food.",
      },
      {
        type: "h2",
        text: "Typical structure",
      },
      {
        type: "p",
        text: "The bride sits at a low stage in traditional yellow or green attire while a professional mehndi artist applies the design. Family members take turns applying small dots of henna and feeding the bride sweets. The groom's side often visits with a separate procession (the rasm-e-mehndi) bringing trays of decorated flowers and sweets. Music and dance follow — choreographed performances by the bride's friends and family are a signature element.",
      },
      {
        type: "h2",
        text: "Decor + dress",
      },
      {
        type: "p",
        text: "Mehndi decor traditionally leans yellow / green / orange, though 2026 trends have shifted toward warm-mustard, rose-and-gold, and butter-cream palettes. Dress is more relaxed than the baraat — separates (gharara, kurti, odhni) are common, optimised for movement during the dance performances.",
      },
    ],
    related: [
      { term: "Baraat", slug: "baraat" },
      { term: "Dholki", slug: "dholki" },
      { term: "Mehndi artist", slug: "mehndi-artist" },
    ],
    aliases: ["henna ceremony", "rasm-e-mehndi"],
  },
  {
    slug: "baraat",
    term: "Baraat",
    termUrdu: "برات",
    definition:
      "The wedding-day procession of the groom's family arriving at the venue, traditionally with music and dancing, where the nikkah (marriage contract) is signed.",
    placement: "The wedding day itself. Typically the second function in a 3-function Pakistani wedding sequence.",
    body: [
      {
        type: "p",
        text: "The baraat is the wedding day proper. The word literally means \"procession\" — the groom and his family arrive at the venue together, often accompanied by dhol drummers and dancing relatives. In modern urban Pakistani weddings, the baraat is the most formally-decorated function, with the bride and groom in their wedding-day attire (typically red and gold for the bride, sherwani for the groom).",
      },
      {
        type: "h2",
        text: "What happens at the baraat",
      },
      {
        type: "p",
        text: "The signing of the nikkah (marriage contract) is the religious and legal centrepiece. After the nikkah, the couple sits on the stage and receives blessings from family. The reception meal follows. The function typically ends with the rukhsati — the formal farewell of the bride from her family's side.",
      },
    ],
    related: [
      { term: "Nikkah", slug: "nikkah" },
      { term: "Rukhsati", slug: "rukhsati" },
      { term: "Walima", slug: "walima" },
      { term: "Sehra", slug: "sehra" },
    ],
    aliases: ["wedding ceremony", "barat"],
  },
  {
    slug: "walima",
    term: "Walima",
    termUrdu: "ولیمہ",
    definition:
      "A reception hosted by the groom's family the day after the baraat, formally welcoming the bride into the family.",
    placement: "1–2 days after the baraat. The third function in the standard Pakistani wedding sequence.",
    body: [
      {
        type: "p",
        text: "The walima is hosted by the groom's family and is religiously recommended in Islam as a public celebration of the marriage. In Pakistani practice it functions as the formal welcome of the bride into her new family and is typically the most upscale of the three functions — venues are larger, decor is more polished, and the guest list extends to the groom's side's full network.",
      },
      {
        type: "h2",
        text: "Walima vs baraat — what's different",
      },
      {
        type: "p",
        text: "The bride wears a different outfit (often pastel, cream, or pink — distinct from the baraat red). The hosting responsibility shifts entirely to the groom's family. Decor tends to be more refined and less explicitly traditional than the baraat. The function is shorter, more reception-focused, less ceremony-focused.",
      },
    ],
    related: [
      { term: "Baraat", slug: "baraat" },
      { term: "Valima", slug: "valima" },
    ],
    aliases: ["valima"],
  },
  {
    slug: "valima",
    term: "Valima",
    termUrdu: "ولیمہ",
    definition:
      "An alternative spelling of walima — the post-wedding reception hosted by the groom's family.",
    body: [
      {
        type: "p",
        text: 'See "Walima" — valima is simply an alternative transliteration of the same Urdu word (ولیمہ). Both spellings are used interchangeably in Pakistani English; "walima" is more common in formal writing and "valima" in casual contexts.',
      },
    ],
    related: [{ term: "Walima", slug: "walima" }],
  },
  {
    slug: "rukhsati",
    term: "Rukhsati",
    termUrdu: "رخصتی",
    definition:
      "The emotional farewell of the bride from her family's home at the end of the baraat, when she formally departs with the groom's family.",
    placement: "The final part of the baraat function.",
    body: [
      {
        type: "p",
        text: "The rukhsati is the emotional crescendo of the wedding day. The bride has signed her nikkah, eaten with both families, and is now formally leaving her parents' home as a married woman. Family members exchange tearful goodbyes and the bride is escorted to the wedding car (often a decorated luxury vehicle) for the journey to her new home.",
      },
      {
        type: "h2",
        text: "What happens during the rukhsati",
      },
      {
        type: "p",
        text: "Quranic verses are read over the bride. Her brother typically helps her into the car — symbolic of the transition between families. The decorated car (rented for the occasion in many modern Pakistani weddings) drives off with the wedding party in tow. Photographers and videographers focus heavily on this moment — it's traditionally the most emotionally raw footage of the day.",
      },
    ],
    related: [
      { term: "Baraat", slug: "baraat" },
      { term: "Nikkah", slug: "nikkah" },
    ],
  },
  {
    slug: "nikkah",
    term: "Nikkah",
    termUrdu: "نکاح",
    definition:
      "The Islamic marriage contract — the religious and legal core of the wedding, signed by the bride, groom, and two witnesses with mahr (dower) agreed upon.",
    placement: "Signed during the baraat function, typically before the meal.",
    body: [
      {
        type: "p",
        text: "The nikkah is the religious heart of the Pakistani wedding. A maulana (religious officiant) presides; the bride and groom each agree (with witnesses present) to the marriage contract, and the agreed mahr (dower paid by the groom to the bride) is formalised. Once the nikkah is signed, the couple is religiously and legally married — even if the social celebrations continue for days afterward.",
      },
    ],
    related: [
      { term: "Baraat", slug: "baraat" },
      { term: "Rukhsati", slug: "rukhsati" },
    ],
    aliases: ["nikah", "marriage contract"],
  },
  {
    slug: "dholki",
    term: "Dholki",
    termUrdu: "ڈھولکی",
    definition:
      "An informal pre-wedding gathering of women — usually the bride's family and friends — for traditional drum-led songs and dance, held in the weeks before the wedding.",
    placement: "1–4 weeks before the mehndi. Held at home, not at a venue.",
    body: [
      {
        type: "p",
        text: 'A dholki is an at-home gathering, named after the small two-headed drum (dholki) that\'s traditionally played throughout the night. Female relatives and close friends of the bride gather for songs (traditional wedding folk songs known as "ladiyaan"), light dance, and food. There\'s no formal program — it\'s more of a sustained party that builds anticipation through the wedding lead-up.',
      },
      {
        type: "h2",
        text: "Modern dholkis",
      },
      {
        type: "p",
        text: "Urban Pakistani dholkis are sometimes catered, sometimes potluck. Some families host multiple dholkis across the weeks before the wedding. They're casual — guests arrive in dressy-casual attire, not formal wedding wear.",
      },
    ],
    related: [
      { term: "Mehndi", slug: "mehndi" },
      { term: "Dhol", slug: "dhol" },
    ],
  },
  {
    slug: "dhol",
    term: "Dhol",
    termUrdu: "ڈھول",
    definition:
      "A traditional double-headed drum used at Pakistani weddings — particularly to accompany the baraat procession and dholki gatherings.",
    body: [
      {
        type: "p",
        text: "The dhol is the iconic Pakistani wedding instrument. A professional dholi (drummer) is hired for the baraat to drum the groom's procession into the venue, and another may play during the mehndi or dholki. The sound is unmistakeable — Pakistani brides often cite the moment they hear the dhol as the moment a wedding feels real.",
      },
    ],
    related: [
      { term: "Baraat", slug: "baraat" },
      { term: "Dholki", slug: "dholki" },
    ],
  },
  {
    slug: "sehra",
    term: "Sehra",
    termUrdu: "سہرا",
    definition:
      "A traditional decorative veil of flowers or beads worn by the groom on the wedding day, hung over the face during the entry to the baraat.",
    placement: "Worn by the groom during the baraat entry.",
    body: [
      {
        type: "p",
        text: "The sehra is one of the few visibly Pakistani groom-side traditions that has survived modernisation. The flower-or-bead veil is tied around the groom's turban and hangs over his face as he enters the baraat — symbolically warding off evil eyes during the auspicious moment. Modern grooms often lift or remove the sehra after the entry; traditional weddings leave it on through the nikkah.",
      },
    ],
    related: [{ term: "Baraat", slug: "baraat" }],
  },
  {
    slug: "joota-chupai",
    term: "Joota chupai",
    termUrdu: "جوتا چھپائی",
    definition:
      "A playful Pakistani wedding tradition where the bride's sisters and friends hide the groom's shoes after he removes them at the venue, then negotiate a cash ransom for their return.",
    placement: "During the baraat — typically right before or during the meal.",
    body: [
      {
        type: "p",
        text: "Joota chupai (literally \"shoe-hiding\") is the lighthearted counterpart to the otherwise-formal baraat. When the groom removes his shoes (as is customary in many Pakistani venues with carpeted stages), the bride's sisters and her female friends snatch them and hide them. The groom can't leave the function without them; negotiation ensues. A cash ransom is paid (the amount varies wildly — anywhere from PKR 5,000 to PKR 100,000+ in modern urban weddings) and the shoes are returned. The exchange is theatrical and well-photographed.",
      },
    ],
    related: [{ term: "Baraat", slug: "baraat" }],
  },
  {
    slug: "maiyon",
    term: "Maiyon",
    termUrdu: "مایوں",
    definition:
      "A pre-wedding seclusion ritual where the bride is bathed in turmeric paste and stays at home (without leaving) until the wedding, traditionally to brighten her skin.",
    placement: "Begins 7–14 days before the wedding. Less practiced in urban modern weddings.",
    body: [
      {
        type: "p",
        text: 'Maiyon is one of the older Pakistani wedding traditions and is increasingly rare in urban modern weddings. The bride wears yellow, doesn\'t leave the house, and is rubbed with a turmeric-and-besan paste (often mixed with rosewater and sandalwood) said to brighten her skin and protect her in the days before the wedding. Some families still observe a token version — a single "maiyon ceremony" rather than the full multi-day seclusion.',
      },
    ],
    related: [{ term: "Mehndi", slug: "mehndi" }],
    aliases: ["mayoon"],
  },
  {
    slug: "mehndi-artist",
    term: "Mehndi artist",
    definition:
      "A professional henna designer who applies intricate mehndi designs on the bride's hands and feet on the night of the mehndi function.",
    body: [
      {
        type: "p",
        text: "Mehndi artists are a category of Pakistani wedding vendor in their own right. The bride's mehndi takes 3–6 hours to complete — full design across both hands, both arms (often up to the elbow), and both feet — and is photographed extensively. Mehndi style varies: Arabic (sparser, bolder), Indian (denser, more floral), Pakistani (a blend leaning detailed), and Moroccan (geometric). Mehndi Atelier in Lahore and similar studios in Karachi have driven the urban-bridal mehndi style toward fine-line work and personalised motifs.",
      },
    ],
    related: [
      { term: "Mehndi", slug: "mehndi" },
    ],
  },
]

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug)
}

/**
 * Field help: every "?" explanation shown beside a form label, in one place.
 *
 * Each entry says, in plain English and as briefly as it can:
 *   - text     what the field is and what to enter
 *   - example  a concrete value (optional)
 *   - why      for sensitive fields only: why we ask and who sees it (optional)
 *
 * Keys are the field names. A key is used by <FieldHelp field="..."> /
 * <FieldLabel help="..."> in components/ui/field-help.tsx; the specialty forms
 * also use their typeSpecificDetails key as the help key (see hasFieldHelp), so
 * adding a line here is enough to give that field a "?".
 *
 * Wording rules: short (about 30 words), concrete, no jargon without a gloss,
 * no promise the product does not keep (check who really sees a field before
 * writing a "why"). Validation messages live next to the fields, not here:
 * help explains a field before the mistake, an error explains the mistake.
 *
 * scripts/field-help-check.mts fails the build guard if an entry is empty or no
 * longer used by any form.
 */

export interface FieldHelpEntry {
  /** Short field name. The button is announced as "About <name>". */
  name: string
  /** What the field is and what to enter. */
  text: string
  /** A concrete example value or answer. */
  example?: string
  /** Sensitive fields only: why we ask and who sees it. */
  why?: string
}

const FIELD_HELP_DATA = {
  // ---------------------------------------------------------------------
  // Registration step 0: what you do
  // ---------------------------------------------------------------------
  businessType: {
    name: "business type",
    text: "Pick the category that best describes your main work. It decides which questions come next and which category couples find you under.",
  },

  // ---------------------------------------------------------------------
  // Registration step 1: your account
  // ---------------------------------------------------------------------
  fullName: {
    name: "full name",
    text: "Your own name, as the person who owns this account. Your business name comes on the next step.",
    example: "Ali Hassan",
  },
  email: {
    name: "email",
    text: "The address you will sign in with. Use one you check every day. One email can only belong to one account.",
    example: "ali@example.com",
    why: "To sign you in and to send booking, payment and account notices.",
  },
  phoneNumber: {
    name: "phone number",
    text: "Your mobile number: 10 digits, without the leading 0. The +92 is already filled in.",
    example: "3001234567 for 0300 1234567",
    why: "To reach you about bookings and to confirm your account.",
  },
  password: {
    name: "password",
    text: "At least 8 characters. Use letters and numbers, and nothing you use on another site.",
    why: "Protects your bookings and payments. We do not save it on this device while you fill in the form, so you re-enter it if you come back later.",
  },
  confirmPassword: {
    name: "retype password",
    text: "Type the same password again so a typing slip does not lock you out.",
  },
  profilePhoto: {
    name: "profile photo",
    text: "Optional. A clear photo of you, the account owner. Your business logo is added on the next step, not here.",
  },

  // ---------------------------------------------------------------------
  // Registration step 2: contact details
  // ---------------------------------------------------------------------
  brandName: {
    name: "brand name",
    text: "The name couples will see on your listing and in search: your studio, shop or venue name, not your personal name. Tap the circle to add your logo.",
    example: "Noor Studio Photography",
  },
  secondaryContactNumber: {
    name: "secondary contact number",
    text: "Optional second number, such as a partner or manager. It must be different from your main number. 10 digits, no leading 0.",
    example: "3211234567",
  },
  instagram: {
    name: "Instagram link",
    text: "Optional. The full web address of your business page, so couples can see more of your work.",
    example: "https://instagram.com/noorstudio",
  },
  facebook: {
    name: "Facebook link",
    text: "Optional. The full web address of your business page.",
    example: "https://facebook.com/noorstudio",
  },
  city: {
    name: "city",
    text: "The city your business is based in. Letters only. Couples browse by city, so spell it the usual way.",
    example: "Lahore",
  },
  subArea: {
    name: "sub area",
    text: "Your neighbourhood or locality inside the city, so couples know roughly where you are.",
    example: "DHA Phase 5, Gulberg III or G-10 Markaz",
  },
  officeAddress: {
    name: "office address",
    text: "The street address of your office, studio or venue: building, street and area. A postal address, not a web link or email.",
    example: "Shop 4, Main Boulevard, Gulberg III, Lahore",
  },
  officeGoogleLink: {
    name: "Google Maps link",
    text: "Optional. Open your place in Google Maps, press Share, then Copy link and paste it here. It lets couples get directions.",
    example: "https://maps.app.goo.gl/...",
  },

  // ---------------------------------------------------------------------
  // Registration step 3: business details (all categories)
  // ---------------------------------------------------------------------
  businessName: {
    name: "business name",
    text: "The name couples will see on your listing and in search, exactly as you want it shown.",
    example: "Noor Studio Photography",
  },
  businessDescription: {
    name: "description",
    text: "Two to four sentences for couples: what you offer, your style and what makes you different. It appears on your public listing.",
    example: "Candid wedding photography across Punjab since 2016, with a team of four.",
  },
  serviceTypes: {
    name: "type of service",
    text: "Pick every kind of work you really do inside your category. Couples filter listings by this.",
  },
  expertise: {
    name: "expertise",
    text: "The events you serve, such as Mehndi, Barat or Walima. Couples choose from this same list when they book, so tick only what you do.",
  },
  servicesAmenities: {
    name: "services and amenities",
    text: "Extras that come with your service, such as an album, a second shooter or travel. Tick only what you can deliver.",
  },
  staffGender: {
    name: "staff gender",
    text: "Tick every group your team includes, so couples know who will be working at their event.",
  },
  downPaymentType: {
    name: "down payment type",
    text: "How your advance is worked out. Fixed Amount is the same rupee amount for every booking. Percentage is a share of the booking total.",
  },
  downPayment: {
    name: "down payment",
    text: "The advance a couple pays to confirm a booking. Choose Fixed or Percentage, then enter the amount: rupees for Fixed, a number from 1 to 100 for Percentage.",
    example: "Fixed 50000, or Percentage 25",
  },
  cancellationPolicy: {
    name: "cancellation policy",
    text: "What happens to the advance if a couple cancels. Refundable: it is returned. Partially refundable: it is returned minus a deduction. Non-refundable: you keep it.",
  },
  additionalInfo: {
    name: "additional information",
    text: "Optional. Anything else couples should know that does not fit elsewhere, such as timings, house rules or extra charges.",
  },
  startingPrice: {
    name: "starting price",
    text: "Shown to couples as \"From Rs X\" on your listing. Enter the lowest price you really charge, in rupees.",
    example: "25000",
  },
  coveredCities: {
    name: "cities covered",
    text: "Every city you are willing to serve or deliver to. Add all of them, not just your home city.",
    example: "Lahore, Islamabad, Faisalabad",
  },

  // Venue only
  venueType: {
    name: "type of venue",
    text: "Pick the best fit. Marquee: a large covered wedding lawn. Hall: an indoor banquet hall. Outdoor: an open-air space such as a lawn. Others: anything else.",
  },
  venueAmenities: {
    name: "amenities",
    text: "Facilities your venue actually has on the day, such as AC, generator or a bridal room. Couples can filter by these.",
  },
  maxCapacity: {
    name: "maximum capacity",
    text: "The most guests you can seat comfortably at one event. Couples use it to check you fit their guest list.",
    example: "800",
  },
  minCapacity: {
    name: "minimum capacity",
    text: "The fewest guests you will take for a booking. Leave it empty if you have no minimum.",
    example: "150",
  },
  cateringOption: {
    name: "catering",
    text: "Tick In-house if you serve the food yourself, External if couples may bring their own caterer. Tick both if you allow either.",
  },
  carParkingCapacity: {
    name: "car parking capacity",
    text: "How many cars fit in your own parking area.",
    example: "150",
  },
  noiseCurfewTime: {
    name: "noise curfew time",
    text: "The time music and loud sound must stop at your venue. Pick it from the clock; couples plan their programme around it.",
    example: "11:30 PM",
  },
  generatorKw: {
    name: "generator capacity",
    text: "The size of your backup generator in kilowatts (kW). It is on the generator's rating plate. Leave it empty if you have none.",
    example: "200",
  },

  // ---------------------------------------------------------------------
  // Registration: packages / menus and images
  // ---------------------------------------------------------------------
  packageName: {
    name: "package name",
    text: "A short name for one thing you sell, so couples can compare. Add one package per price level.",
    example: "Wedding Day Silver",
  },
  menuName: {
    name: "menu name",
    text: "A short name for one menu you offer. Add one menu per price level.",
    example: "Classic Barat Menu",
  },
  packagePrice: {
    name: "price",
    text: "The price of this package in whole rupees. Use what you would really charge a couple.",
    example: "150000",
  },
  packageIncludes: {
    name: "what is included",
    text: "Tick each part this package covers and list the items. Couples compare packages by what is included, so be specific.",
    example: "Hall: 2 cameras, 8 hours",
  },
  portfolioImages: {
    name: "portfolio images",
    text: "Photos of your real work. JPG or PNG, up to 20 photos, 10 MB each. Clear, bright photos get more enquiries.",
  },

  // ---------------------------------------------------------------------
  // Registration: specialty and trust (all categories)
  // ---------------------------------------------------------------------
  ownerName: {
    name: "owner name",
    text: "Optional. The name of the person who runs the business, if different from the account holder.",
    example: "Ali Hassan",
  },
  yearsInBusiness: {
    name: "years in business",
    text: "How many years you have been doing this work, as a whole number. A new business can enter 0 or 1.",
    example: "6",
  },
  weddingsCompleted: {
    name: "weddings completed",
    text: "Roughly how many weddings your team has completed. An honest estimate is fine.",
    example: "120",
  },
  whatsappNumber: {
    name: "WhatsApp number",
    text: "Optional. The number you use for business on WhatsApp: 10 digits, without the leading 0. The +92 is filled in.",
    example: "3001234567",
    why: "Couples message you on this number from your public listing, so use one you answer.",
  },
  ownerBio: {
    name: "owner bio",
    text: "Optional. A short story of your craft, training and what makes your work different. It shows on your public profile.",
  },
  languagesSpoken: {
    name: "languages spoken",
    text: "Tick the languages you can talk to couples in. It helps families choose someone they can talk to easily.",
  },
  ntnNumber: {
    name: "NTN",
    text: "Optional. Your National Tax Number, 7 to 13 digits (dashes are fine). It earns the \"NTN verified\" badge once our team confirms it, and verified vendors rank higher.",
    example: "1234567-8",
    why: "To confirm you are a registered business and, later, to issue tax invoices. Only our team sees it; it is never shown to couples.",
  },

  // Photographer
  photographyStyle: {
    name: "primary style",
    text: "The look your work is best known for, so couples can tell if it matches their taste.",
  },
  deliveryTurnaroundWeeks: {
    name: "delivery turnaround",
    text: "How many weeks after the event couples receive their finished photos or album.",
    example: "6",
  },
  editRevisionsIncluded: {
    name: "edit revisions",
    text: "How many rounds of changes you include after sending the first edit, at no extra charge.",
    example: "2",
  },
  weddingsCompletedAsLead: {
    name: "weddings as lead",
    text: "Weddings you shot as the main photographer, not as an assistant or second shooter.",
    example: "80",
  },
  rawPhotoHandoverPolicy: {
    name: "RAW photo handover policy",
    text: "RAW files are the unedited originals from your camera. Say whether, and on what terms, you hand them to the couple.",
  },

  // Makeup artist
  brideOnlyOrFamilyIncluded: {
    name: "bride only or family included",
    text: "Does your booking cover only the bride, or also her family? Say whether family is charged extra or included.",
  },
  trialPolicy: {
    name: "trial policy",
    text: "A trial is a practice session before the wedding day. Say whether you offer one and whether it is free or paid.",
  },
  trialToWeddingWeeks: {
    name: "trial-to-wedding gap",
    text: "How many weeks before the wedding you usually do the trial.",
    example: "3",
  },
  backToBackCapacityPerDay: {
    name: "back-to-back bookings per day",
    text: "How many separate brides you can serve on the same day, one after another.",
    example: "2",
  },
  previousBridalEventsCount: {
    name: "previous bridal events",
    text: "Roughly how many brides you have done before. An honest estimate is fine.",
    example: "60",
  },

  // Henna artist
  naturalOrChemicalPaste: {
    name: "paste type",
    text: "100% natural means pure henna paste. Chemical-based means paste with added chemicals or dyes. Choose Both if you can offer either.",
  },
  bridalSessionDurationHours: {
    name: "bridal session length",
    text: "How many hours a full bridal henna session usually takes.",
    example: "5",
  },
  perPairHandsFeetPricing: {
    name: "price per pair of hands and feet",
    text: "What you charge, in rupees, for one person's hands and feet together.",
    example: "8000",
  },
  guestsPerHourCapacity: {
    name: "guests per hour",
    text: "How many guests your team can do in one hour at a Mehndi event.",
    example: "6",
  },
  teamSize: {
    name: "team size",
    text: "How many artists you bring to an event.",
    example: "3",
  },

  // Decorator
  stageOnlyOrFullVenue: {
    name: "stage only or full venue",
    text: "Do you decorate just the stage, the whole venue, or both? Couples use this to know what to expect.",
  },
  flowersVsThemeDecorPriceRange: {
    name: "price range",
    text: "The usual range, in rupees, from your lowest to your highest job. Write the two numbers with a dash.",
    example: "150000-500000",
  },
  setupHoursRequired: {
    name: "setup hours",
    text: "How many hours you need at the venue before the event to set everything up.",
    example: "6",
  },
  teardownHoursRequired: {
    name: "teardown hours",
    text: "How many hours you need after the event to take everything down.",
    example: "3",
  },

  // Caterer
  perPlatePriceRange: {
    name: "per-plate price range",
    text: "Your usual price per guest, in rupees, from your cheapest to your most expensive menu. Write the two numbers with a dash.",
    example: "1500-3000",
  },
  minimumGuestCount: {
    name: "minimum guest count",
    text: "The fewest guests you will cater for at one event.",
    example: "100",
  },
  maximumDailyCapacity: {
    name: "maximum daily capacity",
    text: "The most guests you can feed in total on one day, across all the events you take.",
    example: "1500",
  },
  waitersPerHundredGuests: {
    name: "waiters per 100 guests",
    text: "How many waiters you normally send for every 100 guests.",
    example: "4",
  },
  halalCertIssuer: {
    name: "halal certificate issuer",
    text: "Optional. The body that issued your halal certificate, if you have one.",
    example: "Halal Foundation Pakistan",
  },
  halalCertNumber: {
    name: "halal certificate number",
    text: "Optional. The number printed on your halal certificate. It lets our team check it.",
    example: "HFP-12345",
  },
  tastingPolicy: {
    name: "tasting policy",
    text: "A tasting lets a couple try the menu before booking. Say whether you offer one and whether it costs anything.",
  },
  leftoverPolicy: {
    name: "leftover policy",
    text: "What happens to food that is not eaten at the event.",
  },

  // Bridal wear
  storeType: {
    name: "store type",
    text: "Pick the option that best describes how your shop works.",
  },
  rentOrSale: {
    name: "rent or sale",
    text: "Do couples buy your outfits, rent them for the event, or can they do either?",
  },
  alterationPolicy: {
    name: "alteration policy",
    text: "Alterations are changes made so the outfit fits. Say whether you do them and whether they are free or charged.",
  },
  deliveryTime: {
    name: "delivery time",
    text: "How long a customer waits from placing an order until it is ready, counting stitching or production.",
    example: "3 to 4 weeks",
  },

  // Stationery
  stationeryType: {
    name: "stationery business type",
    text: "Pick the option that best describes what you make and sell.",
  },
  minimumOrderQuantity: {
    name: "minimum order quantity",
    text: "The smallest number of cards or pieces you will print for one order.",
    example: "100",
  },
  productionTime: {
    name: "production time",
    text: "How long a typical order takes from approval of the design to ready for pick-up or dispatch.",
    example: "10 days",
  },

  // Car rental
  pricePerEvent: {
    name: "price per event",
    text: "What you charge, in rupees, to hire this car for one event, including the driver if you provide one.",
    example: "25000",
  },
  unitsAvailable: {
    name: "units available",
    text: "How many cars of this exact model you have available to hire.",
    example: "3",
  },
  carPackageCars: {
    name: "cars included",
    text: "Choose the cars from your list that this package covers, and how many of each.",
  },
  carPackageTotalPrice: {
    name: "total price",
    text: "The price for the whole package, in rupees, not per car.",
    example: "80000",
  },

  // ---------------------------------------------------------------------
  // Business settings (portal): fields that do not exist at registration
  // ---------------------------------------------------------------------
  brandLogoUrl: {
    name: "brand logo link",
    text: "Optional. The https:// address of a logo image you already host. To upload a file instead, use the Images tab.",
    example: "https://yourstudio.pk/logo.png",
  },
  pricingMode: {
    name: "how you charge",
    text: "How your price is worked out. Flat: one price for any guest count. Per head: price times guests. Packages: the couple picks a tier. Quote: the couple asks you for a price. Auto lets us decide from your packages and menus.",
  },
  cancellationPolicyText: {
    name: "cancellation policy",
    text: "Say in plain words what happens to the advance if a couple cancels, and how many days before the event each rule applies.",
    example: "Advance non-refundable within 30 days of the event.",
  },
  bookingMode: {
    name: "when a customer books",
    text: "Confirm as soon as they pay: fastest, but you do not see the booking first. Accept the request first: you Accept or Decline, and the advance is asked only after you accept. Enquiries only: nothing is held or charged, you contact them.",
  },
  backupArrangement: {
    name: "backup arrangement",
    text: "What you do if something goes wrong on the day, such as a replacement artist or a spare generator.",
  },
  bookingUnitLabel: {
    name: "booking unit label",
    text: "The unit your price is quoted in, written the way a customer would say it.",
    example: "per event, per 100 guests, per day",
  },
  guestCapacityKinds: {
    name: "guest capacity",
    text: "Comfort: guests you can host without it feeling crowded. Seated: every guest at a table. Standing: a reception with no tables. Indoor and Outdoor: your numbers for each area. Leave a box empty if it does not apply.",
  },
  legalGuestCap: {
    name: "legal guest cap",
    text: "The most guests your licence, permit or fire rules allow at once. Leave it empty if you are not sure.",
    example: "1200",
  },
  eventClosingTime: {
    name: "event closing time",
    text: "The time events must end at your venue, as 24-hour hours and minutes.",
    example: "23:00",
  },
  permitChecklistLink: {
    name: "permit checklist link",
    text: "Optional. A web link to the permissions a couple needs for an event at your venue, such as the district permission checklist.",
    example: "https://...",
  },
  outsideVendorFee: {
    name: "outside-vendor fee",
    text: "What you charge, in rupees, when a couple brings a vendor you did not supply, such as their own caterer or decorator.",
    example: "50000",
  },

  // Bank details (portal)
  bankPayMethod: {
    name: "how customers pay you",
    text: "Choose where the money should go. Bank account: IBFT, Raast or a branch deposit. JazzCash and Easypaisa: mobile wallets. You can add more than one.",
  },
  accountTitle: {
    name: "account holder",
    text: "The account title exactly as printed on your cheque book or shown in your banking app. A name that does not match can make a transfer fail.",
    example: "Noor Studio Photography",
    why: "To pay out what you earn. Couples see it only if you tick \"Show this account to customers\" and we have verified the account.",
  },
  walletRegisteredName: {
    name: "registered name",
    text: "The name your JazzCash or Easypaisa account is registered in, as the app shows it.",
    example: "Ali Hassan",
    why: "To pay out what you earn. Couples see it only if you tick \"Show this account to customers\" and we have verified the account.",
  },
  accountNumber: {
    name: "account number",
    text: "Your bank account number, digits only, as printed on your cheque book. Once saved it is hidden; when you edit, leave it blank to keep the saved number.",
    example: "0123456789012",
    why: "To pay out what you earn. Couples see it only if you tick \"Show this account to customers\" and we have verified the account.",
  },
  walletMobileNumber: {
    name: "wallet mobile number",
    text: "The mobile number your wallet is registered to: 11 digits starting with 03. When you edit, leave it blank to keep the saved number.",
    example: "03001234567",
    why: "To pay out what you earn. Couples see it only if you tick \"Show this account to customers\" and we have verified the account.",
  },
  iban: {
    name: "IBAN",
    text: "Your Pakistani IBAN: PK, two check digits, a four-letter bank code, then your account number. It is on your cheque book and in your banking app. We check it for typing mistakes.",
    example: "PK36SCBL0000001123456702",
    why: "To send payouts to the right account. Couples see it only if you tick \"Show this account to customers\" and we have verified the account.",
  },
  branchCode: {
    name: "branch code",
    text: "Optional. The code of the branch that holds the account, if your bank gave you one.",
  },

  // Venue spaces (halls, floors, sections)
  venueSpaces: {
    name: "your spaces",
    text: "A hall is a main room you rent out. Inside a hall you can add floors, and inside a floor, sections. Add spaces only if guests can book part of your venue on its own; skip this if you rent it as one unit.",
    example: "Grand Hall, then Ground Floor, then Stage Section",
  },
  spaceWholeDayOnly: {
    name: "whole-day only",
    text: "Tick this if the space is booked for the whole day. Leave it unticked if it can be booked by session, for example lunch or dinner.",
  },

  // Verification documents (portal)
  docCnicFront: {
    name: "CNIC front",
    text: "A clear photo or scan of the front of the owner's CNIC (national ID card). All four corners and the number must be readable.",
    why: "To confirm who owns the business before payouts are switched on. Only you and our review team can see it; it is never shown on your listing.",
  },
  docCnicBack: {
    name: "CNIC back",
    text: "The back of the same CNIC, so the full card is on file. Same rules: clear, uncropped and readable.",
    why: "To confirm who owns the business before payouts are switched on. Only you and our review team can see it; it is never shown on your listing.",
  },
  docNtn: {
    name: "NTN or SECP certificate",
    text: "Your NTN certificate, or your SECP company registration if you are a registered company. The number must be clearly visible.",
    why: "To confirm you are a registered business. Only you and our review team can see it; it is never shown on your listing.",
  },
  docUtilityBill: {
    name: "utility bill",
    text: "A recent electricity, gas or water bill that shows your business address, so we can confirm where you operate.",
    why: "To confirm your address. Only you and our review team can see it; it is never shown on your listing.",
  },
  docBankAttestation: {
    name: "bank attestation",
    text: "A letter or stamped statement from your bank that shows the account title and account number, so we can match it to your business.",
    why: "To make sure payouts go to an account that belongs to you. Only you and our review team can see it.",
  },
  docShopLease: {
    name: "shop lease",
    text: "Optional. Your rent agreement or ownership paper for the shop, studio or venue, if you have a physical location.",
  },
  docInsurance: {
    name: "insurance",
    text: "Optional. Your insurance certificate for the business, equipment or events, if you carry insurance.",
  },
  docVehicleRegistration: {
    name: "vehicle registration",
    text: "Optional. For car rental: the registration book or smart card of a vehicle you list.",
  },
  docHalalCert: {
    name: "halal certificate",
    text: "Optional. Your halal certificate, if you cater food.",
  },

  // Generic categories
  genericSubType: {
    name: "sub-type",
    text: "Optional. A few words on your specialty, separated by commas. It helps couples find you in search.",
    example: "Traditional dhol players, Mughlai mithai specialist",
  },
  serviceHighlights: {
    name: "service highlights",
    text: "Optional. The two or three things that set your service apart, one per line.",
  },
} as const satisfies Record<string, FieldHelpEntry>

export type FieldHelpKey = keyof typeof FIELD_HELP_DATA

/** Same data, typed so every entry has the optional fields (no union-of-literals surprises). */
export const FIELD_HELP: Record<FieldHelpKey, FieldHelpEntry> = FIELD_HELP_DATA

/** True when `key` has a help entry (used by forms that derive the key from a field name). */
export function hasFieldHelp(key: string): key is FieldHelpKey {
  return Object.prototype.hasOwnProperty.call(FIELD_HELP, key)
}

/** The whole entry as one plain string: used for the screen-reader description and in tests. */
export function fieldHelpPlainText(entry: FieldHelpEntry): string {
  const parts = [entry.text]
  if (entry.example) parts.push(`Example: ${entry.example}.`)
  if (entry.why) parts.push(`Why we ask: ${entry.why}`)
  return parts.join(" ")
}

// Centralized vendor types for the application.
// Keep this file in lock-step with:
//   - event-planner-api/src/models/userModel.js (User.vendorType ENUM)
//   - event-planner-api/src/utils/vendorRegistrationValidators.js
//     (TYPE_SPECIFIC_WHITELIST entries)
// New categories below were added under BK-100.55 — see migration
// 20260518130000-bk100-55-new-vendor-categories.js.
export const VENDOR_TYPES = {
  // Original 9 — never reorder or remove (FE/BE referenced everywhere).
  PHOTOGRAPHER: 'Photographer',
  DECORATOR: 'Decorator',
  HENNA_ARTIST: 'Henna artist',
  MAKEUP_ARTIST: 'Makeup artist',
  WEDDING_VENUE: 'Wedding venue',
  CAR_RENTAL: 'Car rental',
  CATERING: 'Catering',
  BRIDAL_WEAR: 'Bridal wearing',
  WEDDING_STATIONERY: 'Wedding Invitations and Stationery',
  // BK-100.55 — 14 new Pakistani-specific categories. Vendor
  // self-registration for these ships in BK-100.55 Layer 2; admin
  // assigns via SQL update for now. Customers can already browse
  // (empty until inventory exists).
  NIKAHKHWAN: 'Nikahkhwan',
  CHOREOGRAPHER: 'Choreographer',
  DHOL_PLAYER: 'Dhol player',
  EVENT_HOST: 'Event host',
  LIVE_STREAMING: 'Live streaming',
  GENERATOR_RENTAL: 'Generator rental',
  MARQUEE_RENTAL: 'Marquee rental',
  FURNITURE_RENTAL: 'Furniture rental',
  FLORIST: 'Florist',
  WEDDING_CAKES: 'Wedding cakes',
  MITHAI_SWEETS: 'Mithai and sweets',
  LIVE_COOKING_STALL: 'Live cooking stall',
  SOUND_SYSTEM_RENTAL: 'Sound system rental',
  QAWWALI_NAAT: 'Qawwali and Naat',
} as const

// URL slugs for the SEO-canonical browse routes. Adding a slug here
// does NOT auto-create the Next.js page route — those are scaffolded
// in BK-100.55 Layer 2 (one per category, each with metadata). Until
// the route exists, the legacy `/vendors?vendorType=X` route still
// works since it reads from VENDOR_TYPES directly.
export const VENDOR_TYPE_PATHS = {
  // Original 9 — never rename (canonical SEO URLs).
  photographers: VENDOR_TYPES.PHOTOGRAPHER,
  decor: VENDOR_TYPES.DECORATOR,
  'henna-artists': VENDOR_TYPES.HENNA_ARTIST,
  'makeup-artists': VENDOR_TYPES.MAKEUP_ARTIST,
  venues: VENDOR_TYPES.WEDDING_VENUE,
  'car-rental': VENDOR_TYPES.CAR_RENTAL,
  catering: VENDOR_TYPES.CATERING,
  'bridal-wear': VENDOR_TYPES.BRIDAL_WEAR,
  'wedding-stationery': VENDOR_TYPES.WEDDING_STATIONERY,
  // BK-100.55 — proposed slugs. Routes scaffolded in Layer 2.
  'wedding-officiants': VENDOR_TYPES.NIKAHKHWAN,
  'wedding-choreographers': VENDOR_TYPES.CHOREOGRAPHER,
  'dhol-players': VENDOR_TYPES.DHOL_PLAYER,
  'event-hosts': VENDOR_TYPES.EVENT_HOST,
  'live-streaming': VENDOR_TYPES.LIVE_STREAMING,
  'generator-rental': VENDOR_TYPES.GENERATOR_RENTAL,
  'marquee-rental': VENDOR_TYPES.MARQUEE_RENTAL,
  'furniture-rental': VENDOR_TYPES.FURNITURE_RENTAL,
  florists: VENDOR_TYPES.FLORIST,
  'wedding-cakes': VENDOR_TYPES.WEDDING_CAKES,
  mithai: VENDOR_TYPES.MITHAI_SWEETS,
  'live-cooking-stalls': VENDOR_TYPES.LIVE_COOKING_STALL,
  'sound-system-rental': VENDOR_TYPES.SOUND_SYSTEM_RENTAL,
  qawwali: VENDOR_TYPES.QAWWALI_NAAT,
} as const

export const VENDOR_TYPE_DISPLAY_NAMES = {
  'all': 'All Wedding Vendors',
  [VENDOR_TYPES.PHOTOGRAPHER]: 'Photographers',
  [VENDOR_TYPES.DECORATOR]: 'Decorators',
  [VENDOR_TYPES.HENNA_ARTIST]: 'Henna Artists',
  [VENDOR_TYPES.MAKEUP_ARTIST]: 'Makeup Artists',
  [VENDOR_TYPES.WEDDING_VENUE]: 'Wedding Venues',
  [VENDOR_TYPES.CAR_RENTAL]: 'Car Rental',
  [VENDOR_TYPES.CATERING]: 'Catering',
  [VENDOR_TYPES.BRIDAL_WEAR]: 'Bridal Wear',
  [VENDOR_TYPES.WEDDING_STATIONERY]: 'Wedding Stationery',
  // BK-100.55
  [VENDOR_TYPES.NIKAHKHWAN]: 'Wedding Officiants (Nikahkhwan)',
  [VENDOR_TYPES.CHOREOGRAPHER]: 'Wedding Choreographers',
  [VENDOR_TYPES.DHOL_PLAYER]: 'Dhol Players',
  [VENDOR_TYPES.EVENT_HOST]: 'Event Hosts & MCs',
  [VENDOR_TYPES.LIVE_STREAMING]: 'Live Streaming Teams',
  [VENDOR_TYPES.GENERATOR_RENTAL]: 'Generator Rental',
  [VENDOR_TYPES.MARQUEE_RENTAL]: 'Marquee & Tent Rental',
  [VENDOR_TYPES.FURNITURE_RENTAL]: 'Furniture Rental',
  [VENDOR_TYPES.FLORIST]: 'Florists',
  [VENDOR_TYPES.WEDDING_CAKES]: 'Wedding Cakes',
  [VENDOR_TYPES.MITHAI_SWEETS]: 'Mithai & Sweets',
  [VENDOR_TYPES.LIVE_COOKING_STALL]: 'Live Cooking Stalls',
  [VENDOR_TYPES.SOUND_SYSTEM_RENTAL]: 'Sound System Rental',
  [VENDOR_TYPES.QAWWALI_NAAT]: 'Qawwali & Naat',
} as const

export const VENDOR_TYPE_DESCRIPTIONS = {
  'all': 'Discover the best wedding vendors for your special day. From photographers to venues, find everything you need.',
  [VENDOR_TYPES.PHOTOGRAPHER]: 'Capture your special moments with professional wedding photographers',
  [VENDOR_TYPES.DECORATOR]: 'Transform your venue with stunning wedding decorations',
  [VENDOR_TYPES.HENNA_ARTIST]: 'Beautiful henna designs for your wedding celebrations',
  [VENDOR_TYPES.MAKEUP_ARTIST]: 'Professional makeup artists for your perfect wedding look',
  [VENDOR_TYPES.WEDDING_VENUE]: 'Find the perfect venue for your dream wedding',
  [VENDOR_TYPES.CAR_RENTAL]: 'Luxury cars and transportation for your wedding day',
  [VENDOR_TYPES.CATERING]: 'Delicious catering services for your wedding reception',
  [VENDOR_TYPES.BRIDAL_WEAR]: 'Stunning bridal dresses and wedding attire',
  [VENDOR_TYPES.WEDDING_STATIONERY]: 'Beautiful wedding invitations and stationery',
  // BK-100.55
  [VENDOR_TYPES.NIKAHKHWAN]: 'Certified Nikahkhwan & officiants for your Islamic marriage ceremony',
  [VENDOR_TYPES.CHOREOGRAPHER]: 'Professional choreographers for Mehndi and Sangeet dance performances',
  [VENDOR_TYPES.DHOL_PLAYER]: 'Traditional dhol players to set the rhythm for Dholki, Mehndi and Baraat',
  [VENDOR_TYPES.EVENT_HOST]: 'Polished MCs and anchors to guide your event timeline',
  [VENDOR_TYPES.LIVE_STREAMING]: 'Stream your wedding live to overseas family with HD multi-camera teams',
  [VENDOR_TYPES.GENERATOR_RENTAL]: 'Reliable generator backup for outdoor weddings and load-shedding contingency',
  [VENDOR_TYPES.MARQUEE_RENTAL]: 'Custom marquees and tents for home weddings and outdoor receptions',
  [VENDOR_TYPES.FURNITURE_RENTAL]: 'Chairs, tables, sofas and mandap furniture for any-scale event',
  [VENDOR_TYPES.FLORIST]: 'Fresh and imported flowers for stages, mandaps and bridal bouquets',
  [VENDOR_TYPES.WEDDING_CAKES]: 'Custom-designed wedding cakes — tiered, themed, fondant or fresh-cream',
  [VENDOR_TYPES.MITHAI_SWEETS]: 'Traditional mithai and modern dessert boxes for guest distribution',
  [VENDOR_TYPES.LIVE_COOKING_STALL]: 'Tandoor, chaat, paan and live cooking stations to elevate your menu',
  [VENDOR_TYPES.SOUND_SYSTEM_RENTAL]: 'Professional sound systems, speakers, mics and stage lighting',
  [VENDOR_TYPES.QAWWALI_NAAT]: 'Qawwali troupes and Naat-khwan for spiritual wedding evenings',
} as const

// Helper functions
export const getVendorTypeFromPath = (path: string): string => {
  if (path === 'all') return 'all'
  return VENDOR_TYPE_PATHS[path as keyof typeof VENDOR_TYPE_PATHS] || ''
}

export const getVendorTypeDisplayName = (vendorType: string): string => {
  return VENDOR_TYPE_DISPLAY_NAMES[vendorType as keyof typeof VENDOR_TYPE_DISPLAY_NAMES] || vendorType
}

export const getVendorTypeDescription = (vendorType: string): string => {
  return VENDOR_TYPE_DESCRIPTIONS[vendorType as keyof typeof VENDOR_TYPE_DESCRIPTIONS] || ''
}

export const getAllVendorTypes = () => Object.values(VENDOR_TYPES)
export const getAllVendorPaths = () => Object.keys(VENDOR_TYPE_PATHS) 
// Centralized vendor types for the application
export const VENDOR_TYPES = {
  PHOTOGRAPHER: 'Photographer',
  DECORATOR: 'Decorator',
  HENNA_ARTIST: 'Henna artist',
  MAKEUP_ARTIST: 'Makeup artist',
  WEDDING_VENUE: 'Wedding venue',
  CAR_RENTAL: 'Car rental',
  CATERING: 'Catering',
  BRIDAL_WEAR: 'Bridal wearing',
  WEDDING_STATIONERY: 'Wedding Invitations and Stationery',
} as const

export const VENDOR_TYPE_PATHS = {
  photographers: VENDOR_TYPES.PHOTOGRAPHER,
  decor: VENDOR_TYPES.DECORATOR,
  'henna-artists': VENDOR_TYPES.HENNA_ARTIST,
  'makeup-artists': VENDOR_TYPES.MAKEUP_ARTIST,
  venues: VENDOR_TYPES.WEDDING_VENUE,
  'car-rental': VENDOR_TYPES.CAR_RENTAL,
  catering: VENDOR_TYPES.CATERING,
  'bridal-wear': VENDOR_TYPES.BRIDAL_WEAR,
  'wedding-stationery': VENDOR_TYPES.WEDDING_STATIONERY,
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
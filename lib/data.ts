import type { VendorType } from "./types"
import type { BookingPackage, BookingMenu, BookingMenuAddon, BookingVendor, BookingEventType, BookingVendorPackage } from "@/lib/types"

// Vendor packages data
export const vendorPackages: BookingVendorPackage[] = [
  // Photographer packages
  {
    id: "photo_basic",
    vendorId: "photo1",
    name: "Basic Photography",
    price: 500,
    description: "Essential photography coverage for your event",
    features: [
      "4 hours of coverage",
      "1 photographer",
      "100 edited digital photos",
      "Online gallery",
      "Standard editing",
    ],
  },
  {
    id: "photo_premium",
    vendorId: "photo1",
    name: "Premium Photography",
    price: 1200,
    description: "Comprehensive photography coverage with premium features",
    features: [
      "8 hours of coverage",
      "2 photographers",
      "300 edited digital photos",
      "Online gallery with downloads",
      "Premium editing",
      "Engagement photoshoot",
      "Printed photo album",
    ],
  },
  {
    id: "photo_basic2",
    vendorId: "photo2",
    name: "Essential Coverage",
    price: 600,
    description: "Quality photography for your special day",
    features: ["5 hours of coverage", "1 photographer", "150 edited digital photos", "Online gallery", "Basic editing"],
  },
  {
    id: "photo_deluxe",
    vendorId: "photo2",
    name: "Deluxe Coverage",
    price: 1500,
    description: "Our most comprehensive photography package",
    features: [
      "Full day coverage (10 hours)",
      "2 photographers",
      "500 edited digital photos",
      "Premium online gallery",
      "Advanced editing",
      "Engagement session",
      "Luxury photo album",
      "Canvas print",
    ],
  },

  // Makeup artist packages
  {
    id: "makeup_basic",
    vendorId: "makeup1",
    name: "Basic Makeup",
    price: 200,
    description: "Essential makeup services for the main person",
    features: ["Bride/Groom makeup", "Standard products", "1 hour session", "Basic touch-ups"],
  },
  {
    id: "makeup_party",
    vendorId: "makeup1",
    name: "Party Package",
    price: 600,
    description: "Makeup for the whole party",
    features: [
      "Bride/Groom makeup",
      "Up to 4 additional people",
      "Premium products",
      "3 hour session",
      "Touch-ups throughout event",
    ],
  },
  {
    id: "makeup_trial",
    vendorId: "makeup2",
    name: "Trial & Event",
    price: 350,
    description: "Includes trial session and event day makeup",
    features: [
      "Pre-event trial session",
      "Event day makeup",
      "Premium products",
      "Lashes included",
      "Touch-up kit to keep",
    ],
  },
  {
    id: "makeup_luxury",
    vendorId: "makeup2",
    name: "Luxury Experience",
    price: 800,
    description: "Complete luxury makeup experience for the whole party",
    features: [
      "Trial session",
      "Main person + 5 people",
      "Luxury brand products",
      "Lashes for everyone",
      "Hair styling included",
      "All-day touch-ups",
      "Makeup gift bag",
    ],
  },

  // Car rental packages
  {
    id: "car_basic",
    vendorId: "car1",
    name: "Standard Transport",
    price: 300,
    description: "Basic luxury car service",
    features: ["4 hours rental", "Professional driver", "Luxury sedan", "Decorated vehicle", "Bottle of champagne"],
  },
  {
    id: "car_premium",
    vendorId: "car1",
    name: "Premium Fleet",
    price: 800,
    description: "Multiple luxury vehicles for your event",
    features: [
      "8 hours rental",
      "2 luxury vehicles",
      "Professional drivers",
      "Red carpet service",
      "Champagne and refreshments",
      "Custom route planning",
    ],
  },
  {
    id: "car_vintage",
    vendorId: "car2",
    name: "Vintage Classic",
    price: 500,
    description: "Classic vintage car for a unique entrance",
    features: [
      "4 hours rental",
      "Vintage car (1950-1970)",
      "Experienced driver",
      "Photo opportunities",
      "Decorated vehicle",
    ],
  },
  {
    id: "car_collection",
    vendorId: "car2",
    name: "Collector's Dream",
    price: 1200,
    description: "Rare collector cars for an unforgettable experience",
    features: [
      "6 hours rental",
      "Choice of rare collector car",
      "White glove service",
      "Professional driver",
      "Red carpet arrival",
      "Professional photoshoot with the car",
      "Champagne service",
    ],
  },

  // Catering packages
  {
    id: "catering_dessert",
    vendorId: "catering1",
    name: "Dessert Bar",
    price: 400,
    description: "Gourmet dessert selection for your event",
    features: [
      "Assorted desserts for 50 people",
      "Custom dessert table setup",
      "3 signature desserts",
      "Coffee and tea service",
      "Dessert attendant",
    ],
  },
  {
    id: "catering_special",
    vendorId: "catering1",
    name: "Special Dietary Menu",
    price: 600,
    description: "Specialized menu for dietary restrictions",
    features: [
      "Custom menu planning",
      "Gluten-free options",
      "Vegan/vegetarian options",
      "Allergen-free preparation",
      "Consultation with nutritionist",
      "Menu cards with ingredients listed",
    ],
  },
  {
    id: "catering_cake",
    vendorId: "catering2",
    name: "Custom Cake",
    price: 350,
    description: "Bespoke cake design for your special day",
    features: [
      "Custom designed cake",
      "Serves up to 100 guests",
      "Consultation and tasting",
      "Multiple flavor options",
      "Delivery and setup",
      "Cake cutting service",
    ],
  },
  {
    id: "catering_sweet",
    vendorId: "catering2",
    name: "Sweet Extravaganza",
    price: 800,
    description: "Complete sweet table with custom desserts",
    features: [
      "Custom cake",
      "6 varieties of desserts",
      "Chocolate fountain",
      "Custom cookies with event design",
      "Candy bar",
      "Take-home dessert boxes",
      "2 dessert attendants",
    ],
  },

  // Henna packages
  {
    id: "henna_basic",
    vendorId: "henna1",
    name: "Basic Henna",
    price: 200,
    description: "Simple henna designs for the main person",
    features: ["Hands only design", "Traditional patterns", "1 hour session", "Natural henna paste", "Aftercare kit"],
  },
  {
    id: "henna_deluxe",
    vendorId: "henna1",
    name: "Deluxe Henna",
    price: 500,
    description: "Elaborate henna designs for a stunning look",
    features: [
      "Full hands and feet design",
      "Custom pattern consultation",
      "3 hour session",
      "Premium henna paste",
      "Touch-up session",
      "Aftercare kit",
      "Design catalog to choose from",
    ],
  },
  {
    id: "henna_party",
    vendorId: "henna2",
    name: "Henna Party",
    price: 700,
    description: "Henna application for the whole party",
    features: [
      "Main person full design",
      "Simple designs for up to 10 guests",
      "4 hour session",
      "2 henna artists",
      "Natural and colored henna options",
      "Design catalog",
      "Aftercare products",
    ],
  },
  {
    id: "henna_bridal",
    vendorId: "henna2",
    name: "Bridal Henna",
    price: 900,
    description: "Complete bridal henna experience",
    features: [
      "Pre-event consultation",
      "Intricate full arms and legs design",
      "Custom pattern creation",
      "5 hour application",
      "Touch-up session",
      "Premium natural henna",
      "Swarovski crystal embellishments",
      "Professional photoshoot of henna",
      "Comprehensive aftercare kit",
    ],
  },
]

export const eventTypes: BookingEventType[] = [
  {
    id: "mehndi",
    name: "Mehndi",
    icon: "palette",
    description: "Traditional pre-wedding celebration with henna application and music",
  },
  {
    id: "baraat",
    name: "Baraat",
    icon: "music",
    description: "The groom's wedding procession with music and dancing",
  },
  {
    id: "walima",
    name: "Walima",
    icon: "heart",
    description: "The wedding reception hosted by the groom's family",
  },
  {
    id: "mehfil",
    name: "Mehfil",
    icon: "mic",
    description: "A gathering with music, poetry, and entertainment",
  },
  {
    id: "birthday",
    name: "Birthday",
    icon: "cake",
    description: "Celebrate a birthday with friends and family",
  },
  {
    id: "anniversary",
    name: "Anniversary",
    icon: "gift",
    description: "Commemorate a special anniversary milestone",
  },
  {
    id: "corporate",
    name: "Corporate Event",
    icon: "briefcase",
    description: "Professional gathering for business purposes",
  },
  {
    id: "graduation",
    name: "Graduation",
    icon: "graduation-cap",
    description: "Celebrate academic achievements and milestones",
  },
]

export const bookingPackages: BookingPackage[] = [
  {
    id: "basic",
    name: "Basic Package",
    price: 1000,
    description: "Essential amenities for a simple and elegant event",
    facilities: [
      "Venue space for up to 50 guests",
      "Basic sound system",
      "Standard lighting",
      "Tables and chairs setup",
      "Cleaning service",
      "Parking for up to 20 cars",
      "4-hour venue rental",
    ],
  },
  {
    id: "standard",
    name: "Standard Package",
    price: 2000,
    description: "Enhanced amenities for a memorable celebration",
    facilities: [
      "Venue space for up to 100 guests",
      "Professional sound system",
      "Enhanced lighting with color options",
      "Tables and chairs with basic linens",
      "Dedicated event coordinator",
      "Cleaning service",
      "Parking for up to 40 cars",
      "6-hour venue rental",
      "Basic decoration setup",
      "Welcome drinks",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe Package",
    price: 3000,
    description: "Premium amenities for an extraordinary experience",
    facilities: [
      "Venue space for up to 150 guests",
      "Premium sound system with DJ setup",
      "Custom lighting design",
      "Tables and chairs with premium linens",
      "Dedicated event planning team",
      "VIP parking area",
      "8-hour venue rental",
      "Custom decoration setup",
      "Welcome drinks and appetizers",
      "Champagne toast",
      "Private bridal suite",
      "Photo booth",
      "Late-night snack service",
      "Extended bar service",
    ],
  },
]

export const bookingMenus: BookingMenu[] = [
  {
    id: "continental",
    name: "Continental Feast",
    price: 500,
    description: "A selection of European-inspired dishes",
    items: [
      "French Onion Soup",
      "Beef Wellington",
      "Ratatouille",
      "Potato Gratin",
      "Tiramisu",
      "Assorted Bread Basket",
    ],
  },
  {
    id: "italian",
    name: "Italian Delight",
    price: 700,
    description: "Authentic Italian cuisine with fresh ingredients",
    items: ["Caprese Salad", "Risotto ai Funghi", "Osso Buco", "Pasta Primavera", "Panna Cotta", "Focaccia Bread"],
  },
  {
    id: "asian",
    name: "Asian Fusion",
    price: 600,
    description: "A blend of flavors from across Asia",
    items: ["Miso Soup", "Pad Thai", "Teriyaki Salmon", "Vegetable Stir Fry", "Mango Sticky Rice", "Spring Rolls"],
  },
]

export const menuAddons: BookingMenuAddon[] = [
  {
    id: "dessert",
    name: "Dessert Station",
    price: 100,
    description: "Assorted cakes, pastries, and sweet treats",
  },
  {
    id: "seafood",
    name: "Seafood Bar",
    price: 100,
    description: "Fresh oysters, shrimp, and other seafood delicacies",
  },
  {
    id: "carving",
    name: "Carving Station",
    price: 100,
    description: "Chef-attended station with prime rib and other roasted meats",
  },
  {
    id: "vegan",
    name: "Vegan Options",
    price: 100,
    description: "Plant-based alternatives for your vegan guests",
  },
]

export const vendors: BookingVendor[] = [
  {
    id: "photo1",
    type: "photographer",
    name: "Capture Moments Photography",
    price: 300,
    description: "Professional photography service with 2 photographers",
  },
  {
    id: "photo2",
    type: "photographer",
    name: "Timeless Images",
    price: 300,
    description: "Specializing in candid and portrait photography",
  },
  {
    id: "makeup1",
    type: "makeup artist",
    name: "Glam Squad",
    price: 300,
    description: "Full makeup service for the entire party",
  },
  {
    id: "makeup2",
    type: "makeup artist",
    name: "Beauty Essentials",
    price: 300,
    description: "Specializing in natural and elegant looks",
  },
  {
    id: "car1",
    type: "car rental",
    name: "Luxury Fleet",
    price: 300,
    description: "Premium vehicles with chauffeur service",
  },
  {
    id: "car2",
    type: "car rental",
    name: "Classic Rides",
    price: 300,
    description: "Vintage and classic cars for a unique entrance",
  },
  {
    id: "catering1",
    type: "catering",
    name: "Gourmet Delights",
    price: 300,
    description: "Specialized catering for dietary restrictions",
  },
  {
    id: "catering2",
    type: "catering",
    name: "Sweet Sensations",
    price: 300,
    description: "Custom dessert tables and wedding cakes",
  },
  {
    id: "henna1",
    type: "henna artist",
    name: "Henna Creations",
    price: 300,
    description: "Traditional and modern henna designs",
  },
  {
    id: "henna2",
    type: "henna artist",
    name: "Artistic Mehndi",
    price: 300,
    description: "Specializing in intricate bridal henna",
  },
]

// Add packages to vendors
vendors.forEach((vendor) => {
  vendor.packages = vendorPackages.filter((pkg) => pkg.vendorId === vendor.id)
})


export const cities = ["All Cities", "Lahore", "Islamabad", "Karachi", "Faisalabad", "Peshawar"]

export const vendorTypes: Record<VendorType, string[]> = {
  venues: ["All Types", "Banquet Hall", "Marquee", "Outdoor", "Hall"],
  photographers: ["All Types", "Traditional", "Candid", "Cinematic", "Drone"],
  makeupArtists: ["All Types", "Bridal", "Party", "HD", "Airbrush"],
  decor: ["All Types", "Traditional", "Modern", "Rustic", "Minimalist"],
  catering: ["All Types", "Buffet", "Plated", "Food Stations", "Cocktail Style"],
  hennaArtists: ["All Types", "Traditional", "Arabic", "Indo-Arabic", "Modern"],
  weddingStationery: ["All Types", "Traditional", "Modern", "Handmade", "Digital"],
  bridalWear: ["All Types", "Traditional", "Contemporary", "Fusion", "Designer"],
  carRental: ["All Types", "Luxury", "Vintage", "Sports", "Limousine"],
}

export const cancellationPolicies = ["All Policies", "Refundable", "Non-refundable", "Partially Refundable"]

export const amenities: Record<VendorType, string[]> = {
  venues: ["Parking Space", "Wheelchair Accessible", "Air Conditioning", "Catering Services", "DJ Services"],
  photographers: ["High-resolution Images", "Album Design", "Drone Photography", "Same-day Editing", "Photo Booth"],
  makeupArtists: ["Hair Styling", "Airbrush Makeup", "False Lashes", "Bridal Trial", "Group Discounts"],
  decor: ["Floral Arrangements", "Lighting", "Furniture Rental", "Backdrop Design", "Table Settings"],
  catering: ["Customized Menu", "Vegetarian Options", "Halal Options", "Live Stations", "Dessert Bar"],
  hennaArtists: ["Natural Henna", "Black Henna", "Glitter Designs", "Bridal Package", "Group Discounts"],
  weddingStationery: ["Custom Design", "Calligraphy", "Eco-friendly Options", "Rush Orders", "Addressing Service"],
  bridalWear: ["Custom Sizing", "Alterations", "Accessories", "Bridal Consultation", "Bridesmaid Dresses"],
  carRental: ["Chauffeur Service", "Decorated Cars", "Multiple Car Options", "Flexible Hours", "Insurance Included"],
}

export const staffOptions = ["male", "female", "transgender", "all"]

// import type { Package, Menu, MenuAddon, Vendors } from "@/lib/types"

// export const eventPackages: Package[] = [
//   {
//     id: 1,
//     name: "Basic Package",
//     price: 1000,
//     description: "Essential amenities for a simple and elegant event",
//     facilities: [
//       "Venue space for up to 50 guests",
//       "Basic sound system",
//       "Standard lighting",
//       "Tables and chairs setup",
//       "Cleaning service",
//       "Parking for up to 20 cars",
//       "4-hour venue rental",
//     ],
//     items: [],
//   },
//   {
//     id: 2,
//     name: "Standard Package",
//     price: 2000,
//     description: "Enhanced amenities for a memorable celebration",
//     facilities: [
//       "Venue space for up to 100 guests",
//       "Professional sound system",
//       "Enhanced lighting with color options",
//       "Tables and chairs with basic linens",
//       "Dedicated event coordinator",
//       "Cleaning service",
//       "Parking for up to 40 cars",
//       "6-hour venue rental",
//       "Basic decoration setup",
//       "Welcome drinks",
//     ],
//     items: [],
//   },
//   {
//     id: 3,
//     name: "Deluxe Package",
//     price: 3000,
//     description: "Premium amenities for an extraordinary experience",
//     facilities: [
//       "Venue space for up to 150 guests",
//       "Premium sound system with DJ setup",
//       "Custom lighting design",
//       "Tables and chairs with premium linens",
//       "Dedicated event planning team",
//       "VIP parking area",
//       "8-hour venue rental",
//       "Custom decoration setup",
//       "Welcome drinks and appetizers",
//       "Champagne toast",
//       "Private bridal suite",
//       "Photo booth",
//       "Late-night snack service",
//       "Extended bar service",
//     ],
//     items: [],
//   },
// ]

// export const eventMenus: Menu[] = [
//   {
//     id: 1,
//     name: "Continental Feast",
//     price: 500,
//     description: "A selection of European-inspired dishes",
//     items: [
//       "French Onion Soup",
//       "Beef Wellington",
//       "Ratatouille",
//       "Potato Gratin",
//       "Tiramisu",
//       "Assorted Bread Basket",
//     ],
//   },
//   {
//     id: 2,
//     name: "Italian Delight",
//     price: 700,
//     description: "Authentic Italian cuisine with fresh ingredients",
//     items: ["Caprese Salad", "Risotto ai Funghi", "Osso Buco", "Pasta Primavera", "Panna Cotta", "Focaccia Bread"],
//   },
//   {
//     id: 3,
//     name: "Asian Fusion",
//     price: 600,
//     description: "A blend of flavors from across Asia",
//     items: ["Miso Soup", "Pad Thai", "Teriyaki Salmon", "Vegetable Stir Fry", "Mango Sticky Rice", "Spring Rolls"],
//   },
// ]

// export const menuAddonsList: MenuAddon[] = [
//   {
//     id: 1,
//     name: "Dessert Station",
//     price: 100,
//     description: "Assorted cakes, pastries, and sweet treats",
//   },
//   {
//     id: 2,
//     name: "Seafood Bar",
//     price: 100,
//     description: "Fresh oysters, shrimp, and other seafood delicacies",
//   },
//   {
//     id: 3,
//     name: "Carving Station",
//     price: 100,
//     description: "Chef-attended station with prime rib and other roasted meats",
//   },
//   {
//     id: 4,
//     name: "Vegan Options",
//     price: 100,
//     description: "Plant-based alternatives for your vegan guests",
//   },
// ]

// export const vendorList: Vendors[] = [
//   {
//     id: 1,
//     type: "photographer",
//     name: "Capture Moments Photography",
//     price: 300,
//     description: "Professional photography service with 2 photographers",
//   },
//   {
//     id: 2,
//     type: "photographer",
//     name: "Timeless Images",
//     price: 300,
//     description: "Specializing in candid and portrait photography",
//   },
//   {
//     id: 3,
//     type: "makeup artist",
//     name: "Glam Squad",
//     price: 300,
//     description: "Full makeup service for the entire party",
//   },
//   {
//     id: 4,
//     type: "makeup artist",
//     name: "Beauty Essentials",
//     price: 300,
//     description: "Specializing in natural and elegant looks",
//   },
//   {
//     id: 5,
//     type: "car rental",
//     name: "Luxury Fleet",
//     price: 300,
//     description: "Premium vehicles with chauffeur service",
//   },
//   {
//     id: 6,
//     type: "car rental",
//     name: "Classic Rides",
//     price: 300,
//     description: "Vintage and classic cars for a unique entrance",
//   },
//   {
//     id: 7,
//     type: "catering",
//     name: "Gourmet Delights",
//     price: 300,
//     description: "Specialized catering for dietary restrictions",
//   },
//   {
//     id: 8,
//     type: "catering",
//     name: "Sweet Sensations",
//     price: 300,
//     description: "Custom dessert tables and wedding cakes",
//   },
//   {
//     id: 9,
//     type: "henna artist",
//     name: "Henna Creations",
//     price: 300,
//     description: "Traditional and modern henna designs",
//   },
//   {
//     id: 10,
//     type: "henna artist",
//     name: "Artistic Mehndi",
//     price: 300,
//     description: "Specializing in intricate bridal henna",
//   },
// ]



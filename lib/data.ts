import type { VendorType } from "./types"

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

import type { Package, Menu, MenuAddon, Vendors } from "@/lib/types"

export const packages: Package[] = [
  {
    id: 1,
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
    items: [],
  },
  {
    id: 2,
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
    items: [],
  },
  {
    id: 3,
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
    items: [],
  },
]

export const menus: Menu[] = [
  {
    id: 1,
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
    id: 2,
    name: "Italian Delight",
    price: 700,
    description: "Authentic Italian cuisine with fresh ingredients",
    items: ["Caprese Salad", "Risotto ai Funghi", "Osso Buco", "Pasta Primavera", "Panna Cotta", "Focaccia Bread"],
  },
  {
    id: 3,
    name: "Asian Fusion",
    price: 600,
    description: "A blend of flavors from across Asia",
    items: ["Miso Soup", "Pad Thai", "Teriyaki Salmon", "Vegetable Stir Fry", "Mango Sticky Rice", "Spring Rolls"],
  },
]

export const menuAddons: MenuAddon[] = [
  {
    id: 1,
    name: "Dessert Station",
    price: 100,
    description: "Assorted cakes, pastries, and sweet treats",
  },
  {
    id: 2,
    name: "Seafood Bar",
    price: 100,
    description: "Fresh oysters, shrimp, and other seafood delicacies",
  },
  {
    id: 3,
    name: "Carving Station",
    price: 100,
    description: "Chef-attended station with prime rib and other roasted meats",
  },
  {
    id: 4,
    name: "Vegan Options",
    price: 100,
    description: "Plant-based alternatives for your vegan guests",
  },
]

export const vendors: Vendors[] = [
  {
    id: 1,
    type: "photographer",
    name: "Capture Moments Photography",
    price: 300,
    description: "Professional photography service with 2 photographers",
  },
  {
    id: 2,
    type: "photographer",
    name: "Timeless Images",
    price: 300,
    description: "Specializing in candid and portrait photography",
  },
  {
    id: 3,
    type: "makeup artist",
    name: "Glam Squad",
    price: 300,
    description: "Full makeup service for the entire party",
  },
  {
    id: 4,
    type: "makeup artist",
    name: "Beauty Essentials",
    price: 300,
    description: "Specializing in natural and elegant looks",
  },
  {
    id: 5,
    type: "car rental",
    name: "Luxury Fleet",
    price: 300,
    description: "Premium vehicles with chauffeur service",
  },
  {
    id: 6,
    type: "car rental",
    name: "Classic Rides",
    price: 300,
    description: "Vintage and classic cars for a unique entrance",
  },
  {
    id: 7,
    type: "catering",
    name: "Gourmet Delights",
    price: 300,
    description: "Specialized catering for dietary restrictions",
  },
  {
    id: 8,
    type: "catering",
    name: "Sweet Sensations",
    price: 300,
    description: "Custom dessert tables and wedding cakes",
  },
  {
    id: 9,
    type: "henna artist",
    name: "Henna Creations",
    price: 300,
    description: "Traditional and modern henna designs",
  },
  {
    id: 10,
    type: "henna artist",
    name: "Artistic Mehndi",
    price: 300,
    description: "Specializing in intricate bridal henna",
  },
]



import type { VendorType, Vendor } from "./types"

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



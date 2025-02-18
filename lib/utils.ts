import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Vendor, SortOption } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sortVendors(vendors: Vendor[], sortOption: SortOption): Vendor[] {
  switch (sortOption) {
    case "price-low":
      return [...vendors].sort((a, b) => a.price - b.price)
    case "price-high":
      return [...vendors].sort((a, b) => b.price - a.price)
    case "rating":
      return [...vendors].sort((a, b) => b.rating - a.rating)
    case "alphabetical":
      return [...vendors].sort((a, b) => a.name.localeCompare(b.name))
    default:
      return vendors
  }
}


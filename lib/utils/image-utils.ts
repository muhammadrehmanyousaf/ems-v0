import { BACKEND_URL } from '@/lib/backend-url'

/**
 * Utility functions for handling images
 */

// Get the correct image URL
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '/placeholder.svg'
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // If it's a relative path, construct the full URL
  if (imagePath.startsWith('/')) {
    return `${BACKEND_URL.replace(/\/$/, '')}${imagePath}`
  }

  // If it's just a filename, construct the full URL
  return `${BACKEND_URL.replace(/\/$/, '')}/images/${imagePath}`
}

// Get the first image from an array of images
export function getFirstImage(images: string[] | null | undefined): string {
  if (!images || images.length === 0) {
    return '/placeholder.svg'
  }

  return getImageUrl(images[0])
}

// Get multiple images with proper URLs
export function getImageUrls(images: string[] | null | undefined): string[] {
  if (!images || images.length === 0) {
    return ['/placeholder.svg']
  }

  return images.map(img => getImageUrl(img))
}

// Check if an image URL is valid
export function isValidImageUrl(url: string): boolean {
  return url && url !== '/placeholder.svg' && (
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('/')
  )
}

// Get a fallback image if the main image fails
export function getFallbackImage(originalImage: string | null | undefined): string {
  if (!originalImage || originalImage === '/placeholder.svg') {
    return '/placeholder.svg'
  }

  // You can add more sophisticated fallback logic here
  return originalImage
}

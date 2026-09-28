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

  // The placeholder is OUR asset, in /public. Every other branch here returns it
  // literally; this one used to prefix BACKEND_URL and point at a file the
  // backend has never had. It answers 404 for it, and sets
  // `cross-origin-resource-policy: same-origin`, so the browser blocks even that
  // 404 -- which is why /venues logged `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`
  // and lost 7 points of best-practices.
  //
  // It was broken before that too, just invisibly: the request went through
  // /_next/image, which 400s because the backend host is not in remotePatterns.
  // Routing SVGs straight to their source is what made a long-standing broken
  // image finally say so.
  if (imagePath.startsWith('/placeholder.')) {
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
  return !!url && url !== '/placeholder.svg' && (
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

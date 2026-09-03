import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * SafeImage — a next/image that never crashes the route on a bad host.
 *
 * `next/image` THROWS synchronously during render when handed a remote host
 * that is not in `next.config.mjs` → `images.remotePatterns`. A single
 * legacy/test row with an off-list image URL therefore takes down the entire
 * screen through the error boundary (observed: a package seeded with an
 * `images.unsplash.com` URL crashed all of /dashboard/packages). See the
 * "Images" trap in CLAUDE.md.
 *
 * This wrapper optimises through next/image for the allow-listed hosts and
 * degrades to a plain <img> (which never throws) for everything else, so one
 * off-list URL can no longer bring down a page.
 *
 * Keep OPTIMIZED_HOSTS in sync with next.config.mjs remotePatterns.
 */
const OPTIMIZED_HOSTS = new Set(["res.cloudinary.com", "images.pexels.com", "localhost"])

function canOptimize(src: string): boolean {
  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) return true
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname)
  } catch {
    return false
  }
}

export interface SafeImageProps {
  src: string | null | undefined
  alt: string
  /** Fill the (positioned) parent — the common card/thumbnail case. */
  fill?: boolean
  sizes?: string
  width?: number
  height?: number
  className?: string
}

export function SafeImage({ src, alt, fill, sizes, width, height, className }: SafeImageProps) {
  if (!src) return null

  if (canOptimize(src)) {
    if (fill) {
      return <Image src={src} alt={alt} fill sizes={sizes} className={className} />
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width ?? 400}
        height={height ?? 300}
        sizes={sizes}
        className={className}
      />
    )
  }

  // Off-list host (legacy/test data): plain <img> degrades gracefully and never
  // throws. eslint-disable is intentional — this is the safe fallback path.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  )
}

export default SafeImage

/**
 * The Stage photograph: which image, at what size, and whether to show it.
 *
 * Cloudinary is the optimiser here, not next/image — the Vercel optimisation
 * quota is exhausted (see lib/image-loader.ts) and a booking page must never
 * depend on it. Any non-Cloudinary URL is returned untouched.
 */

const UPLOAD = "/image/upload/"

export type StageImageMode = "fill" | "thumb"

export function stageImageUrl(
  src: string | null | undefined,
  { w, h, mode = "fill" }: { w: number; h: number; mode?: StageImageMode },
): string | null {
  if (!src || typeof src !== "string") return null
  if (src.startsWith("data:") || src.startsWith("blob:")) return src
  if (!src.includes("res.cloudinary.com") || !src.includes(UPLOAD)) return src
  const cut = src.indexOf(UPLOAD) + UPLOAD.length
  // `c_limit`, never `c_fill`: a fill crop hands back exactly w×h whatever the
  // original was, which would make the size gate below pass a 480px flyer
  // after Cloudinary had blown it up. A limit keeps the original's own size
  // when it is smaller, so `naturalWidth` tells the truth and `object-cover`
  // does the cropping in the browser.
  const crop = mode === "thumb" ? "c_thumb,g_auto" : "c_limit"
  const t = `${crop},w_${w},h_${h},q_auto:good,f_auto`
  return src.slice(0, cut) + t + "/" + src.slice(cut)
}

/**
 * The venue's cover image — `images[0]`, the same one the venue page uses as
 * its hero, so the booking page continues the page the customer came from.
 * (A "prefer the first JPEG" heuristic was tried and picked a marketing tile
 * over the cover on the test venue; the vendor's own ordering is the better
 * signal, and the portal is where cover quality gets fixed.)
 */
export function pickStageImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const urls = images.filter((u): u is string => typeof u === "string" && u.length > 0)
  return urls[0] || null
}

/**
 * Gate: an image too small or too oddly shaped to be a room photograph is not
 * mounted; the Stage keeps its charcoal-and-lattice resting state instead.
 */
export function stageImageUsable(naturalWidth: number, naturalHeight: number): boolean {
  if (!naturalWidth || !naturalHeight) return false
  // The Stage band is 560px wide. Anything under 600px would be upscaled and
  // soft — and in practice the sub-600 uploads are logos and flyers, not rooms.
  if (naturalWidth < 600) return false
  const ratio = naturalWidth / naturalHeight
  return ratio >= 0.5 && ratio <= 3
}

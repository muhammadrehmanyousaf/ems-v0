/**
 * next/image loader. Cloudinary transforms its own images; everything else
 * still goes through the Vercel optimizer.
 *
 * WW-PERF / WW-OUTAGE. Every vendor photo on this site lives on Cloudinary, and
 * next/image was routing all of them through `/_next/image` — so each one made
 * the browser wait on Vercel, which fetched from Cloudinary, re-encoded, and
 * sent it back. Two consequences, both measured on production 2026-09-28:
 *
 *  1. The Vercel image-optimization quota ran out. `/_next/image?url=…cloudinary…`
 *     returns `402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`, which is why vendor
 *     cards on /search rendered with broken images for real visitors.
 *  2. It was never needed. Cloudinary does the same work in its own URL:
 *     the same photo is 320,932 bytes raw and 56,320 bytes at
 *     `f_auto,q_auto:good,w_480` — 5.7x smaller, from Cloudinary's CDN, with no
 *     Vercel hop in front of it and no per-image cost.
 *
 * `f_auto` picks AVIF/WebP from the browser's own Accept header, so this keeps
 * the modern formats the `images.formats` setting was there for.
 *
 * Non-Cloudinary sources (the Pexels stock placeholders, local dev uploads,
 * anything imported from /public) are few and keep the default behaviour, which
 * is why this returns the standard `/_next/image` URL rather than the raw src:
 * a `loaderFile` replaces the built-in loader entirely, it does not wrap it.
 */

type LoaderArgs = { src: string; width: number; quality?: number };

/** Cloudinary delivery URLs always carry this segment; transformations go straight after it. */
const CLOUDINARY_UPLOAD = "/image/upload/";

export default function wwImageLoader({ src, width, quality }: LoaderArgs): string {
  // Data and blob URLs are already the image; there is nothing to fetch or resize.
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  // SVG is vector — there is no width to resize it to and nothing to re-encode,
  // and the optimizer refuses it anyway unless `dangerouslyAllowSVG` is set.
  // Sending it there only produced errors, both measured on /venues:
  //   402 on `/placeholder.svg` (the exhausted quota, for a 1 kB local file)
  //   400 on the backend's `/placeholder.svg` (that host is not in remotePatterns)
  // Served as-is, it is smaller than any raster the optimizer could return.
  if (src.split("?")[0].toLowerCase().endsWith(".svg")) return src;

  if (src.includes("res.cloudinary.com") && src.includes(CLOUDINARY_UPLOAD)) {
    const cut = src.indexOf(CLOUDINARY_UPLOAD) + CLOUDINARY_UPLOAD.length;
    // `q_auto:good` rather than a fixed quality: Cloudinary picks per image, and
    // an explicit `quality` prop still wins when a caller has set one.
    const q = quality ? `q_${quality}` : "q_auto:good";
    // c_limit, not c_fill — never upscale and never crop. The card components do
    // their own cropping with object-fit, and a server-side crop would change
    // which part of a vendor's photo they see.
    const transform = `f_auto,${q},w_${width},c_limit`;
    return src.slice(0, cut) + transform + "/" + src.slice(cut);
  }

  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}

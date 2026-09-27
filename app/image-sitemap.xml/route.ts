import { SITE_URL } from "@/lib/seo"
import { POSTS as BLOG_POSTS } from "@/lib/blog/posts"
import { REAL_WEDDINGS } from "@/lib/real-weddings/recaps"
import {
  fetchAllBusinesses,
  projectToCanonical,
  pickFirstImage,
} from "@/lib/seo/vendor-inventory"

/**
 * Image sitemap at /image-sitemap.xml.
 *
 * Why this exists as a hand-written route instead of a field on the main
 * sitemap: app/sitemap.ts used to attach `images: string[]` to its rows,
 * believing Next serialised them as <image:image>. Next 14.2 does not — its
 * sitemap serialiser (next/dist/build/webpack/loaders/metadata/resolve-route-data.js)
 * handles only loc / lastmod / changefreq / priority / alternates, and
 * MetadataRoute.Sitemap has no `images` key at all, which is what tsc was
 * reporting. Measured against the real /sitemap.xml before this change:
 *
 *     loc entries: 7087   distinct: 3812   duplicates: 3275
 *     <image: tags: 0     xmlns:image: 0
 *
 * So the "image shard" shipped zero images and 3,275 duplicate URLs — every
 * vendor, blog and real-wedding URL a second time, with a different priority
 * and changefreq than its real entry. This route emits the real thing, and
 * app/sitemap.ts no longer repeats those URLs.
 *
 * Reference:
 *   - https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 *   - docs/seo/00-master-seo-playbook.md §11 item 447
 */

// Same hour as the vendor fetch cache, so a rebuild costs one set of requests.
export const revalidate = 3600

// Google's per-URL cap is ~1,000 images; we self-limit to keep the file small.
const MAX_IMAGES_PER_URL = 50

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

/** Editorial images are site-relative ("/images/…"); vendor images are absolute. */
function absolute(u: string): string | null {
  const s = String(u || "").trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith("//")) return `https:${s}`
  if (s.startsWith("/")) return `${SITE_URL}${s}`
  return null // relative-without-slash or a data: URI — not indexable
}

function entry(url: string, images: string[]): string | null {
  const seen = new Set<string>()
  const locs: string[] = []
  for (const raw of images) {
    const abs = absolute(raw)
    if (!abs || seen.has(abs)) continue
    seen.add(abs)
    locs.push(abs)
    if (locs.length >= MAX_IMAGES_PER_URL) break
  }
  if (locs.length === 0) return null
  const imgs = locs
    .map((l) => `    <image:image>\n      <image:loc>${esc(l)}</image:loc>\n    </image:image>`)
    .join("\n")
  return `  <url>\n    <loc>${esc(url)}</loc>\n${imgs}\n  </url>`
}

export async function GET() {
  const blocks: string[] = []
  // One entry per URL: a URL repeated with different images would be two
  // records for the same page, which is what the old shard was doing.
  const urls = new Set<string>()
  const push = (url: string, images: string[]) => {
    if (urls.has(url)) return
    const block = entry(url, images)
    if (!block) return
    urls.add(url)
    blocks.push(block)
  }

  // Real-wedding recaps — cover + gallery. The highest-value Pinterest content.
  for (const r of REAL_WEDDINGS) {
    push(`${SITE_URL}/real-weddings/${r.slug}`, [r.coverImage, ...r.gallery].filter(Boolean))
  }

  // Blog hero images.
  for (const p of BLOG_POSTS) {
    if (!p.imageUrl) continue
    push(`${SITE_URL}/blog/${p.cluster}/${p.slug}`, [p.imageUrl])
  }

  // Vendor leaves — the canonical URL from the same projection /sitemap.xml
  // uses, so the two files can never disagree about a vendor's URL.
  try {
    for (const raw of await fetchAllBusinesses()) {
      const projected = projectToCanonical(raw)
      if (!projected) continue
      const img = pickFirstImage(raw)
      if (!img) continue
      push(projected.url, [img])
    }
  } catch {
    // Backend unreachable — serve the editorial images rather than a 500, and
    // pick the vendors up on the next revalidate.
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    blocks.join("\n") +
    `\n</urlset>\n`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

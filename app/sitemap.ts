import { MetadataRoute } from "next"
import {
  SITE_URL,
  CITIES,
  VENDOR_TYPES,
  backendToSeoSlug,
  type VendorTypeSlug,
} from "@/lib/seo"
import { slugifyName } from "@/lib/seo/fetch-vendor"
import {
  fetchAllBusinesses,
  projectToCanonical,
  type DynamicVendor,
} from "@/lib/seo/vendor-inventory"
import { CLUSTERS as BLOG_CLUSTERS, POSTS as BLOG_POSTS } from "@/lib/blog/posts"
import { REAL_WEDDINGS } from "@/lib/real-weddings/recaps"
import { GLOSSARY } from "@/lib/glossary/terms"
import { CONTENT_PILLARS } from "@/lib/content/pillars"
import {
  LISTICLE_PAGES_ENABLED,
  MIN_VENDORS_FOR_LISTICLE,
  buildListicleSlug,
} from "@/lib/seo/listicle"

/**
 * Single combined sitemap served at /sitemap.xml.
 *
 * We previously sharded via Next.js `generateSitemaps()`, but in Next 14.2
 * that serves shards at `/sitemap.xml/<id>` and leaves `/sitemap.xml` itself a
 * 404 (no auto-generated index) — and it collides with any manual
 * `app/sitemap.xml` route. For the current URL count (well under the 50k /
 * 50MB limits) a single sitemap is simpler and serves the canonical
 * `/sitemap.xml` directly. The `build*Shard()` helpers below stay as logical
 * groupings; re-introduce `generateSitemaps()` only if the vendor set ever
 * approaches the 50k-URL ceiling.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §1 item 28 (split when >50k or >50MB)
 */

// ─── Shard 0: core (static + hubs + legal + tools) ──────────────────────

function buildCoreShard(): MetadataRoute.Sitemap {
  const now = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/help`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // /blog is emitted by the blog block below, which owns the index and its
    // clusters. Listing it here too put it in the sitemap twice.
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/vendor-guide`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/vendor-success`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/deals`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/wedding-website`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/press`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/list-your-business`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/payments`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Urdu scaffold — single landing for now; expands to a full /ur/ tree
    // once translations land. Reference: docs/seo/03-url-conventions-LOCKED.md §L7.
    { url: `${SITE_URL}/ur`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    // Compare + glossary indexes
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Content-guides hub — links to every content pillar.
    { url: `${SITE_URL}/wedding-guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ]

  const tools: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/planning-tools`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/planning-tools/budget`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/planning-tools/checklist`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/planning-tools/guest-list`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/planning-tools/timeline`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ]

  const vendorTypeHubs: MetadataRoute.Sitemap = VENDOR_TYPES.map((v) => ({
    url: `${SITE_URL}/${v.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }))

  const cityHubs: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/cities`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...CITIES.map((city) => ({
      url: `${SITE_URL}/cities/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
  ]

  // Real-wedding recaps — high-engagement editorial silo. Reference:
  // docs/seo/00-master-seo-playbook.md §16 wedding-vertical SEO.
  const realWeddings: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/real-weddings`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...REAL_WEDDINGS.map((r) => ({
      url: `${SITE_URL}/real-weddings/${r.slug}`,
      lastModified: new Date(r.updatedAt ?? r.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ]

  // Blog — index, topic clusters, and individual posts. Drawn from the
  // typed in-memory data in lib/blog/posts.ts so adding a post here is a
  // single-file edit. Reference: docs/seo/00-master-seo-playbook.md §7.
  const blog: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...BLOG_CLUSTERS.map((c) => ({
      url: `${SITE_URL}/blog/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...BLOG_POSTS.map((p) => ({
      url: `${SITE_URL}/blog/${p.cluster}/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]

  const legal: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/cancellation-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/service-delivery-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/cookie-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/acceptable-use`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/aml-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/complaints`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ]

  // Comparison pages — one per vendor type (11 total, all SSG).
  const compareTypes: MetadataRoute.Sitemap = VENDOR_TYPES.map((v) => ({
    url: `${SITE_URL}/compare/${v.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }))

  // Glossary terms — definitional pages targeting "what is X" queries.
  const glossary: MetadataRoute.Sitemap = GLOSSARY.map((t) => ({
    url: `${SITE_URL}/glossary/${t.slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.55,
  }))

  // Data-driven content pillars (informational guides). Reference:
  // seo-strategy/SEO-MASTER-PLAN.md §6. Each is a typed PillarData object.
  const contentPillars: MetadataRoute.Sitemap = CONTENT_PILLARS.map((p) => ({
    url: `${SITE_URL}/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  // Flagship content pages built before the data-driven engine.
  const flagshipPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/wedding-cost-in-pakistan`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/pakistani-bridal-dress-trends`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ]

  return [...core, ...tools, ...vendorTypeHubs, ...cityHubs, ...legal, ...blog, ...realWeddings, ...compareTypes, ...glossary, ...contentPillars, ...flagshipPages]
}

// ─── Shard 1: programmatic (city × vendor-type grid) ────────────────────

/**
 * Programmatic SEO shard. Previously emitted all 12 cities × 11 vendor types
 * (132 URLs) unconditionally, which surfaced empty pages like
 * /wedding-djs/quetta in GSC's "Crawled - currently not indexed" report
 * because Google saw the URL but found zero listings on it.
 *
 * Now we fetch the live vendor inventory once at build time and only emit
 * URLs for (city, vendorType) combos with at least one real vendor. Combos
 * with zero vendors stay accessible on the site (they still render with
 * editorial copy + cross-links) but are hidden from the sitemap and the
 * pages themselves emit `noindex,follow` until vendors arrive — see
 * components/seo/vendor-type-city-page.tsx.
 */
async function buildProgrammaticShard(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Inventory of (citySlug, vendorTypeSlug) combos that have >=1 real vendor.
  // Built from the same /businesses feed we use for the vendor-shard, so the
  // build never hits the backend twice for the same data per cold render.
  const populated = new Set<string>()
  // Per-combo vendor counts — drive which combos qualify for a "best of"
  // listicle (need >= MIN_VENDORS_FOR_LISTICLE for a credible ranked list).
  const counts = new Map<string, number>()
  try {
    const raws = await fetchAllBusinesses()
    for (const raw of raws) {
      const vendor = raw?.vendor ?? {}
      const backendType: string | undefined =
        raw?.type || vendor?.vendorType || raw?.subBusinessType
      const seoTypeSlug = backendToSeoSlug(backendType)
      if (!seoTypeSlug) continue
      const cityRaw: string = raw?.city ?? raw?.location ?? vendor?.city ?? ""
      if (!cityRaw) continue
      const citySlug = slugifyName(cityRaw)
      if (!CITIES.some((c) => c.slug === citySlug)) continue
      const comboKey = `${seoTypeSlug}|${citySlug}`
      populated.add(comboKey)
      counts.set(comboKey, (counts.get(comboKey) ?? 0) + 1)
    }
  } catch {
    /* backend unreachable — fall through, keep nothing in `populated`,
       fall back to emitting all combos so we never ship an empty sitemap
       in a build-time outage */
  }

  // Fallback: if the backend fetch failed AND we ended up with zero
  // populated combos, emit everything. Better an over-broad sitemap than
  // an empty one.
  const useInventory = populated.size > 0

  const grid: MetadataRoute.Sitemap = VENDOR_TYPES.flatMap((v) =>
    CITIES.filter((city) =>
      useInventory ? populated.has(`${v.slug}|${city.slug}`) : true,
    ).map((city) => ({
      url: `${SITE_URL}/${v.slug}/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  )

  // "Best of" listicle URLs — only when the feature flag is enabled AND the
  // combo has enough real vendors for a credible ranked list (matches the
  // page's own MIN_VENDORS guard, so we never sitemap a 404). No-op while the
  // flag is off; emits nothing on a failed backend fetch (counts then empty).
  const listicles: MetadataRoute.Sitemap = LISTICLE_PAGES_ENABLED
    ? VENDOR_TYPES.flatMap((v) =>
        CITIES.filter(
          (city) =>
            (counts.get(`${v.slug}|${city.slug}`) ?? 0) >=
            MIN_VENDORS_FOR_LISTICLE,
        ).map((city) => ({
          url: `${SITE_URL}/best/${buildListicleSlug(v.slug, city.slug)}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.75,
        })),
      )
    : []

  return [...grid, ...listicles]
}

// ─── Shard 2: vendors (dynamic, fetched from backend) ───────────────────

async function buildVendorsShard(): Promise<MetadataRoute.Sitemap> {
  const raws = await fetchAllBusinesses()

  const vendors = raws
    .map(projectToCanonical)
    .filter((v): v is DynamicVendor => v != null)

  return vendors.map((v) => ({
    url: v.url,
    lastModified: v.lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
}

// ─── Images: see app/image-sitemap.xml/route.ts ──────────────────────────
//
// There used to be an image shard here that attached `images: string[]` to each
// row, on the belief that Next serialised them as <image:image>. Next 14.2 does
// not: its sitemap serialiser handles only loc / lastmod / changefreq / priority
// / alternates, and MetadataRoute.Sitemap has no `images` key — so the shard
// emitted zero images and, because every URL it listed was already in the core,
// programmatic or vendor shard, 3,275 DUPLICATE <url> entries out of 7,087
// (measured against the served /sitemap.xml). Real image entries are now served
// from /image-sitemap.xml, advertised in robots.txt.

// ─── Default export — single combined sitemap at /sitemap.xml ────────────

/**
 * One <url> per URL, keeping the highest priority claimed for it.
 *
 * Two pages reached the sitemap twice with different priority and changefreq:
 * /blog (listed in the static block and again in the blog block) and
 * /wedding-cost-in-pakistan (a CONTENT_PILLARS slug that is also in the
 * hand-written flagship list). Telling a crawler two different things about one
 * URL is worse than telling it nothing, and the shards are built independently
 * enough that this will happen again — so it is caught here rather than by
 * remembering not to do it.
 */
function dedupeByUrl(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const e of entries) {
    const prev = byUrl.get(e.url)
    if (!prev || (e.priority ?? 0) > (prev.priority ?? 0)) byUrl.set(e.url, e)
  }
  return [...byUrl.values()]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programmatic, vendors] = await Promise.all([
    buildProgrammaticShard(),
    buildVendorsShard(),
  ])
  return dedupeByUrl([...buildCoreShard(), ...programmatic, ...vendors])
}

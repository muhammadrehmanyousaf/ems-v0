let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // SEO: enforce L2 (no trailing slash) — see docs/seo/03-url-conventions-LOCKED.md.
  // Combined with L3 lowercase enforcement in middleware.ts, every public URL
  // has exactly one canonical form.
  trailingSlash: false,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // The repo reached zero type errors (see typecheck-baseline.json), so the
    // compiler can finally gate the build. `scripts/typecheck-ratchet.mjs`
    // still runs on prebuild — it reports WHICH file regressed, and it cannot
    // be satisfied by an `as any`; this flag is the backstop that cannot be
    // re-baselined away. Flip back to true only as a deliberate, temporary
    // unblock, with the failing errors written down.
    ignoreBuildErrors: false,
  },
  images: {
    // Cloudinary images are transformed by Cloudinary and served from its CDN;
    // everything else still goes through the Next optimizer. See the file for
    // why — in short, `/_next/image` was returning 402 for every vendor photo
    // on production because the Vercel optimization quota had run out.
    loaderFile: "./lib/image-loader.ts",
    // SEO: serve modern formats and responsive sizes via the Next.js
    // optimizer. Reference: docs/seo/05-T5-image-migration-runbook.md +
    // docs/seo/00-master-seo-playbook.md §11.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      // Stock placeholders used in homepage hero / monetization sections.
      // Replace with first-party PK photography per
      // docs/seo/06-photography-sourcing-plan.md, then remove this entry.
      { protocol: "https", hostname: "images.pexels.com" },
      // Vendor-uploaded media served from the backend host. The actual
      // production host is set per environment via NEXT_PUBLIC_BACKEND_URL.
      // Localhost dev is included so local builds don't 500 on backend
      // image references.
      { protocol: "http", hostname: "localhost" },
      // Cloudinary — vendor media (imported listing images + all uploads:
      // profiles, business galleries, review photos, KYC, booking milestones)
      // is stored on Cloudinary so it survives Railway redeploys. next/image
      // refuses to optimize any host not listed here, so these URLs MUST be
      // allow-listed or every vendor image renders broken.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // Enable the instrumentation.ts hook so Sentry / Datadog can be wired
    // by uncommenting blocks in that file. Reference:
    // docs/seo/07-error-reporting-runbook.md.
    instrumentationHook: true,
  },

  // SEO: 301 redirects for legacy URL patterns that have been retired in
  // favour of the L6 canonical structure. Reference:
  // docs/seo/03-url-conventions-LOCKED.md.
  async redirects() {
    return [
      // Retired legacy detail pages (verified zero internal-link references at
      // the time of removal — see 2026-05-07 rebrand sweep). Anyone landing on
      // these old URLs from a bookmark or external link goes to the new
      // SEO Master Plan Phase T1: Duplicate URL pairs -> 301 redirect to canonicals
      // Planning Tools canonical redirects
      {
        source: "/planning-tools/pakistan-wedding-car-rental-convoy-calculator",
        destination: "/planning-tools/baraat-car-rental-fleet-calculator-pakistan",
        permanent: true,
      },
      {
        source: "/planning-tools/wedding-decor-stage-lighting-cost-calculator",
        destination: "/planning-tools/wedding-stage-decor-cost-calculator-pakistan",
        permanent: true,
      },
      {
        source: "/planning-tools/wedding-currency-converter-overseas-pakistanis",
        destination: "/planning-tools/overseas-pakistani-wedding-planner-calculator",
        permanent: true,
      },
      {
        source: "/planning-tools/dholki-qawwali-night-budget-calculator-pakistan",
        destination: "/planning-tools/pakistani-mehndi-songs-dholki-tappay-generator",
        permanent: true,
      },
      { source: "/venues", destination: "/wedding-venues", permanent: true },
      { source: "/venues/:city([a-zA-Z-]+)", destination: "/wedding-venues/:city", permanent: true },
      { source: "/venues/:city([a-zA-Z-]+)/:slug", destination: "/wedding-venues/:city/:slug", permanent: true },
      { source: "/photographers", destination: "/wedding-photographers", permanent: true },
      { source: "/photographers/:city([a-zA-Z-]+)", destination: "/wedding-photographers/:city", permanent: true },
      { source: "/photographers/:city([a-zA-Z-]+)/:slug", destination: "/wedding-photographers/:city/:slug", permanent: true },
      { source: "/decor", destination: "/wedding-decorators", permanent: true },
      { source: "/decor/:city([a-zA-Z-]+)", destination: "/wedding-decorators/:city", permanent: true },
      { source: "/decor/:city([a-zA-Z-]+)/:slug", destination: "/wedding-decorators/:city/:slug", permanent: true },
      { source: "/catering", destination: "/caterers", permanent: true },
      { source: "/catering/:city([a-zA-Z-]+)", destination: "/caterers/:city", permanent: true },
      { source: "/catering/:city([a-zA-Z-]+)/:slug", destination: "/caterers/:city/:slug", permanent: true },
      { source: "/makeup-artists", destination: "/bridal-makeup-artists", permanent: true },
      { source: "/makeup-artists/:city([a-zA-Z-]+)", destination: "/bridal-makeup-artists/:city", permanent: true },
      { source: "/makeup-artists/:city([a-zA-Z-]+)/:slug", destination: "/bridal-makeup-artists/:city/:slug", permanent: true },
      { source: "/henna-artists", destination: "/mehndi-artists", permanent: true },
      { source: "/henna-artists/:city([a-zA-Z-]+)", destination: "/mehndi-artists/:city", permanent: true },
      { source: "/henna-artists/:city([a-zA-Z-]+)/:slug", destination: "/mehndi-artists/:city/:slug", permanent: true },
      { source: "/car-rental", destination: "/wedding-cars", permanent: true },
      { source: "/car-rental/:city([a-zA-Z-]+)", destination: "/wedding-cars/:city", permanent: true },
      { source: "/car-rental/:city([a-zA-Z-]+)/:slug", destination: "/wedding-cars/:city/:slug", permanent: true },
      { source: "/bridal-wearing", destination: "/bridal-wear", permanent: true },
      { source: "/bridal-wearing/:city([a-zA-Z-]+)", destination: "/bridal-wear/:city", permanent: true },
      { source: "/bridal-wearing/:city([a-zA-Z-]+)/:slug", destination: "/bridal-wear/:city/:slug", permanent: true },
      { source: "/wedding-invitations", destination: "/wedding-stationery", permanent: true },
      { source: "/wedding-invitations/:city([a-zA-Z-]+)", destination: "/wedding-stationery/:city", permanent: true },
      { source: "/wedding-invitations/:city([a-zA-Z-]+)/:slug", destination: "/wedding-stationery/:city/:slug", permanent: true },
      // Semrush Notice N1 & Legacy UX aliases -> 301 redirects to canonical SEO hubs
      { source: "/wedding-cakes", destination: "/wedding-cake-designers", permanent: true },
      { source: "/wedding-cakes/:city([a-zA-Z-]+)", destination: "/wedding-cake-designers/:city", permanent: true },
      { source: "/mithai", destination: "/wedding-mithai", permanent: true },
      { source: "/mithai/:city([a-zA-Z-]+)", destination: "/wedding-mithai/:city", permanent: true },
      { source: "/generator-rental", destination: "/wedding-generators", permanent: true },
      { source: "/generator-rental/:city([a-zA-Z-]+)", destination: "/wedding-generators/:city", permanent: true },
      { source: "/wedding-officiants", destination: "/nikah-khwan", permanent: true },
      { source: "/wedding-officiants/:city([a-zA-Z-]+)", destination: "/nikah-khwan/:city", permanent: true },
      { source: "/marquee-rental", destination: "/wedding-venues", permanent: true },
      { source: "/marquee-rental/:city([a-zA-Z-]+)", destination: "/wedding-venues/:city", permanent: true },
      { source: "/florists", destination: "/wedding-decorators", permanent: true },
      { source: "/florists/:city([a-zA-Z-]+)", destination: "/wedding-decorators/:city", permanent: true },
      { source: "/furniture-rental", destination: "/wedding-decorators", permanent: true },
      { source: "/furniture-rental/:city([a-zA-Z-]+)", destination: "/wedding-decorators/:city", permanent: true },
      { source: "/sound-system-rental", destination: "/wedding-djs", permanent: true },
      { source: "/sound-system-rental/:city([a-zA-Z-]+)", destination: "/wedding-djs/:city", permanent: true },
      { source: "/dhol-players", destination: "/wedding-djs", permanent: true },
      { source: "/dhol-players/:city([a-zA-Z-]+)", destination: "/wedding-djs/:city", permanent: true },
      { source: "/qawwali", destination: "/wedding-djs", permanent: true },
      { source: "/qawwali/:city([a-zA-Z-]+)", destination: "/wedding-djs/:city", permanent: true },
      { source: "/live-cooking-stalls", destination: "/caterers", permanent: true },
      { source: "/live-cooking-stalls/:city([a-zA-Z-]+)", destination: "/caterers/:city", permanent: true },
      { source: "/live-streaming", destination: "/wedding-photographers", permanent: true },
      { source: "/live-streaming/:city([a-zA-Z-]+)", destination: "/wedding-photographers/:city", permanent: true },
      { source: "/wedding-choreographers", destination: "/wedding-planners", permanent: true },
      { source: "/wedding-choreographers/:city([a-zA-Z-]+)", destination: "/wedding-planners/:city", permanent: true },
      { source: "/event-hosts", destination: "/wedding-planners", permanent: true },
      { source: "/event-hosts/:city([a-zA-Z-]+)", destination: "/wedding-planners/:city", permanent: true },

      // The last four "-new" dashboard routes, renamed to real paths.
      //
      // 37 others were deleted outright because the canonical route already
      // rendered the same screen. These four were the ONLY door to a working
      // screen, so they could not be deleted — but shipping a permanent URL
      // called "-new" is how a temporary preview name becomes forever.
      //
      // Redirected rather than dropped: these are live URLs. Vendors bookmark
      // the composer, and the sign link gets sent to customers over WhatsApp —
      // a signature link that 404s costs a signed contract. Query strings are
      // preserved automatically by Next, which matters because every one of
      // these is opened as `?id=<sheet>`.
      {
        source: "/dashboard/function-sheet-composer-new",
        destination: "/dashboard/function-sheet-composer",
        permanent: true,
      },
      {
        source: "/dashboard/function-sheet-operations-new",
        destination: "/dashboard/function-sheet-operations",
        permanent: true,
      },
      {
        source: "/dashboard/function-sheet-sign-new",
        destination: "/dashboard/function-sheet-sign",
        permanent: true,
      },
      {
        source: "/dashboard/trade-ops-new",
        destination: "/dashboard/trade-ops",
        permanent: true,
      },
    ]
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: "/wedding-venues/:id(\\d+)", destination: "/venues/:id" },
        { source: "/wedding-photographers/:id(\\d+)", destination: "/photographers/:id" },
        { source: "/wedding-decorators/:id(\\d+)", destination: "/decor/:id" },
        { source: "/caterers/:id(\\d+)", destination: "/catering/:id" },
        { source: "/bridal-makeup-artists/:id(\\d+)", destination: "/makeup-artists/:id" },
        { source: "/mehndi-artists/:id(\\d+)", destination: "/henna-artists/:id" },
        { source: "/wedding-cars/:id(\\d+)", destination: "/car-rental/:id" },
        { source: "/wedding-cake-designers/:id(\\d+)", destination: "/wedding-cakes/:id" },
        { source: "/wedding-mithai/:id(\\d+)", destination: "/mithai/:id" },
        { source: "/wedding-generators/:id(\\d+)", destination: "/generator-rental/:id" },
        { source: "/nikah-khwan/:id(\\d+)", destination: "/wedding-officiants/:id" },
        { source: "/wedding-djs/:id(\\d+)", destination: "/sound-system-rental/:id" },
        { source: "/wedding-planners/:id(\\d+)", destination: "/wedding-choreographers/:id" },
        { source: "/bridal-wear/:id(\\d+)", destination: "/bridal-wearing/:id" },
        { source: "/wedding-stationery/:id(\\d+)", destination: "/wedding-invitations/:id" },
      ],
      afterFiles: [],
      fallback: [],
    }
  },

  // Security headers on every HTML response. helmet only wraps the Express API,
  // so the Next.js/Vercel pages shipped none of these. A strict CSP is
  // deliberately NOT set here — it needs careful testing against Stripe /
  // Cloudinary / analytics / socket.io and is a separate change.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
        ],
      },
    ]
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig

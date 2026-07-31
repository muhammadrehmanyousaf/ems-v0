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
    ignoreBuildErrors: true,
  },
  images: {
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
      // SEO-canonical hub.
      {
        source: "/bridal-wear/:id(\\d+)",
        destination: "/bridal-wear",
        permanent: true,
      },
      {
        source: "/wedding-stationery/:id(\\d+)",
        destination: "/wedding-stationery",
        permanent: true,
      },

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

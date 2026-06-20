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

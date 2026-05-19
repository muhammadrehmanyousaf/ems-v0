import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { UserProvider } from "@/context/UserContext"
import { BusinessProvider } from "@/context/BusinessContext"
import { NotificationProvider } from "@/context/NotificationContext"
import { ChatProvider } from "@/context/ChatContext"
import { QueryProvider } from "@/lib/providers/query-provider"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { CookieConsent } from "@/components/cookie-consent"
import { Inter, Playfair_Display, DM_Sans, Noto_Nastaliq_Urdu } from "next/font/google"
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  organizationLD,
  webSiteLD,
} from "@/lib/seo"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "wedding planning Pakistan",
    "wedding vendors Pakistan",
    "wedding venues Karachi",
    "wedding venues Lahore",
    "wedding venues Islamabad",
    "wedding photographers Pakistan",
    "mehndi photographer",
    "shaadi planner",
    "barat venue",
    "walima caterer",
    "bridal makeup artist",
    "wedding decor Pakistan",
    "event management Pakistan",
    SITE_NAME,
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Wedding & Event Planning",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-PK": "/",
      "ur-PK": "/ur",
      "x-default": "/",
    },
  },
  // OG + Twitter `images` are intentionally omitted here — the
  // app/opengraph-image.tsx file convention handles the default for
  // every route automatically. Per-route overrides live in each route's
  // own `opengraph-image.tsx` (vendor-detail, blog post, real-wedding,
  // city hubs, etc.). Reference:
  // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
  openGraph: {
    type: "website",
    locale: "en_PK",
    alternateLocale: ["ur_PK"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: "@weddingwalapk",
    creator: "@weddingwalapk",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "",
      // Pinterest domain verification — claims pins from this origin to
      // our Pinterest Business account. Reference:
      // docs/seo/08-pinterest-strategy.md.
      "p:domain_verify": process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION ?? "",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.webmanifest",
  referrer: "strict-origin-when-cross-origin",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F0" },
    { media: "(prefers-color-scheme: dark)", color: "#2C1810" },
  ],
  colorScheme: "light",
}

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
})

// Phase 3 #9.4 — Nastaliq for Urdu text. Loaded only when needed
// via the `font-nastaliq` utility (see globals.css); doesn't bloat
// the baseline English bundle because next/font's tree-shaking only
// pulls the weights we actually use.
const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-nastaliq",
  display: "swap",
  preload: false,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-PK" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLD()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteLD()) }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${nastaliq.variable} font-sans`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <UserProvider>
            <BusinessProvider>
              <NotificationProvider>
                <ChatProvider>
                  <main>{children}</main>
                  <Toaster />
                  <SonnerToaster richColors position="top-right" />
                  <PerformanceMonitor />
                  <CookieConsent />
                </ChatProvider>
              </NotificationProvider>
            </BusinessProvider>
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

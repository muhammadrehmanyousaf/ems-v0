import "../globals.css"
import { Inter } from "next/font/google"
import { PublicChrome } from "@/components/public-chrome"
import { VenueUnavailableHost } from "@/components/venue/venue-unavailable-host"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Intentionally NO `metadata` export here. The root `app/layout.tsx` already
// sets `title.default = SITE_TITLE` and `title.template = "%s | Wedding Wala"`,
// which means any page that doesn't define its own title falls back to the
// branded default ("Wedding Wala — Pakistan's Wedding & Event Planning
// Marketplace") instead of the legacy "Modern Wedding Platform | AJOINT"
// that was here before. Per-page `metadata` exports (e.g. /about, /careers)
// override this anyway.

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div lang="en" suppressHydrationWarning>
      <div className={inter.className} suppressHydrationWarning>
        <PublicChrome>{children}</PublicChrome>
        {/* Tells a customer kindly when a venue is not taking new enquiries (409 VENUE_UNAVAILABLE from any request). */}
        <VenueUnavailableHost />
      </div>
    </div>
  )
}
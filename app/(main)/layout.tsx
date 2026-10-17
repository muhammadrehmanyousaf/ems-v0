import "../globals.css"
import { interTextStyle } from "@/lib/fonts/local-fonts"
import { PublicChrome } from "@/components/public-chrome"
import { VenueUnavailableHost } from "@/components/venue/venue-unavailable-host"

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
      <div style={interTextStyle} suppressHydrationWarning>
        <PublicChrome>{children}</PublicChrome>
        {/* Tells a customer kindly when a venue is not taking new enquiries (409 VENUE_UNAVAILABLE from any request). */}
        <VenueUnavailableHost />
      </div>
    </div>
  )
}
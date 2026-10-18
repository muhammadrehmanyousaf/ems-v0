import "../globals.css"
import { PublicChrome } from "@/components/public-chrome"
import { VenueUnavailableHost } from "@/components/venue/venue-unavailable-host"

// Intentionally NO `metadata` export here. The root `app/layout.tsx` already
// sets `title.default = SITE_TITLE` and `title.template = "%s | Wedding Wala"`,
// which means any page that doesn't define its own title falls back to the
// branded default ("Wedding Wala — Pakistan's Wedding & Event Planning
// Marketplace") instead of the legacy "Modern Wedding Platform | AJOINT"
// that was here before. Per-page `metadata` exports (e.g. /about, /careers)
// override this anyway.

// What `Inter(...).className` set on this wrapper: the sans face, from the --font-inter variable the ROOT layout sets on
// <body> (lib/fonts/local-fonts.ts). WP40: this file must NOT import local-fonts. On Windows, Next 14.2 sorts layout CSS by
// splitting entry paths on "/", so with a font module imported by two layouts the child layout wins the font CSS and every
// route outside it (register, login, forgot-password ...) is left without its @font-face rules. One importer: the root layout
// (scripts/wp40-fonts-check.mts).
const interTextStyle = { fontFamily: "var(--font-inter)", fontStyle: "normal" } as const

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
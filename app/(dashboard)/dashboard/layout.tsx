// @ts-ignore
import "../../styles/dashboard-styles.css"
import React from "react"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { ModuleRail } from "@/components/dashboard/layout/module-rail"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import Header from "@/components/dashboard/layout/header"
import ProtectedRoutes from "@/lib/protected-routes"
import { ThemeProvider } from "@/components/dashboard/layout/ThemeToggle/theme-provider"
import { DashboardShell } from "@/components/dashboard/layout/DashboardShell"
import { VerificationBanner } from "@/components/auth/VerificationBanner"
// Issue #1 — vendors with reviewProfile=false get the "Under Review"
// screen instead of the half-broken dashboard. See the component file
// for the design rationale.
import { ReviewProfileGate } from "@/components/auth/ReviewProfileGate"
import { Metadata } from "next"
import NextTopLoader from "nextjs-toploader"
// Phase 3 #9.4 — Locale provider wraps the dashboard subtree so any
// component below can call useT() / useLocale(). Pure client-side;
// SSR locale always falls back to English.
import { LocaleProvider } from "@/lib/i18n/useT"
import { MobileBottomNav } from "@/components/dashboard/layout/mobile-bottom-nav"
import { ProductTourProvider } from "@/components/dashboard/tour/product-tour"

export const metadata: Metadata = {
  title: "Wedding Wala — Dashboard",
  description: "Wedding Wala operations dashboard",
}

// Stamp the active palette on <html> before first paint so switching themes
// never flashes the default. Reads the SAME localStorage key the Zustand store
// persists to (see lib/store/theme-prefs.ts → THEME_STORAGE_KEY). next-themes
// already prevents the separate light/dark flash.
const THEME_BOOTSTRAP = `
(function () {
  try {
    var raw = localStorage.getItem("ww-theme-prefs");
    var theme = "champagne";
    if (raw) {
      var t = JSON.parse(raw);
      if (t && t.state && t.state.theme) theme = t.state.theme;
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <DashboardShell>
      <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
      <ProtectedRoutes>
        <LocaleProvider>
          {/* ReviewProfileGate sits OUTSIDE SidebarProvider on purpose —
              when active, the vendor sees ONLY the under-review screen,
              no sidebar / no header / no dashboard chrome that would
              suggest they have access to features that aren't live yet. */}
          <ReviewProfileGate>
            {/* Tour provider wraps the shell so a step can spotlight the rail,
                the panel or any page, and so "Take a tour" works from anywhere
                inside the dashboard. Renders nothing until started. */}
            <ProductTourProvider>
            {/* ── The app shell ────────────────────────────────────────────
                The shell is exactly one viewport tall and does not scroll. The
                rail, the panel and the top bar are fixed furniture; the ONLY
                scrolling region is the content area below the header.

                This replaces "sticky header on a page that scrolls", which is
                the weaker version of the same idea and which was additionally
                broken here — see the note on the content div below.

                `h-dvh` (not `vh`) so mobile browser chrome does not cut the
                bottom off, and `min-h-0` to beat the primitive's own
                `min-h-svh`, which would otherwise let the shell grow past the
                viewport and re-introduce document scroll. */}
            <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
              {/* Icon rail — one entry per module, ~68px, never changes.
                  Desktop only; on mobile the bottom-tab nav plays this role.
                  The panel beside it (inside AppSidebar) swaps per module. */}
              <ModuleRail />
              <AppSidebar />
              {/* `min-w-0` is the fix for cards getting clipped at the right
                  edge — without it the flex child can grow past the available
                  width when content is wide. `min-h-0` lets the inner scroll
                  region actually shrink to the shell instead of being pushed
                  open by its own content. */}
              <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
                <Header />
                {/* Anchor for route-level tour steps ("this is Enquiries").
                    One stable target beats a bespoke selector per screen.

                    This div is the app's scroll container. It used to be the
                    document, and `overflow-x-hidden` sat on SidebarInset —
                    which makes that element a SCROLL CONTAINER, and a
                    `position: sticky` descendant is confined to its nearest
                    scroll-container ancestor. So the header stuck to the top of
                    SidebarInset, which scrolled away with the page: the top bar
                    was obeying its instructions exactly and still left the
                    screen.

                    `overflow-x-clip` clips identically WITHOUT creating a
                    scroll container, so it can be used freely alongside sticky.
                    Table headers inside a page can now be sticky too, which is
                    only possible because the page itself is no longer the
                    thing that scrolls. */}
                <div
                  data-tour="page-root"
                  data-dashboard-scroll=""
                  // The bottom padding clears the fixed mobile tab bar, which
                  // publishes its own height as `--ww-mobile-nav`. Without it
                  // the last rows of every list sit underneath the bar with no
                  // way to scroll them clear — the bar is fixed, so the page
                  // ending at the viewport bottom is exactly where it covers.
                  // Resolves to 0px on desktop, where the bar does not render.
                  style={{ paddingBottom: "var(--ww-mobile-nav, 0px)" }}
                  className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-clip"
                >
                  <div className="px-4 pt-4 md:px-6">
                    <VerificationBanner />
                  </div>
                  {children}
                </div>
                {/* Mobile bottom-tab nav — renders on mobile only, vendors only.
                    Thumb-reach tabs beat a hamburger for a phone-first owner. */}
                <MobileBottomNav />
              </SidebarInset>
            </SidebarProvider>
            </ProductTourProvider>
          </ReviewProfileGate>
        </LocaleProvider>
      </ProtectedRoutes>
        </DashboardShell>
      </ThemeProvider>
    </>
  )
}

export default layout

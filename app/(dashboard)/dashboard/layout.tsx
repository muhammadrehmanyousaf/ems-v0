// @ts-ignore
import "../../styles/dashboard-styles.css"
import React from "react"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
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
            <SidebarProvider>
              <AppSidebar />
              {/* `min-w-0` on SidebarInset is the fix for cards getting clipped at
                  the right edge — without it the flex child can grow past the
                  available width when content is wide. */}
              <SidebarInset className="min-w-0 overflow-x-hidden">
                <Header />
                <div className="flex flex-1 min-w-0 flex-col">
                  <div className="px-4 pt-4 md:px-6">
                    <VerificationBanner />
                  </div>
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ReviewProfileGate>
        </LocaleProvider>
      </ProtectedRoutes>
        </DashboardShell>
      </ThemeProvider>
    </>
  )
}

export default layout

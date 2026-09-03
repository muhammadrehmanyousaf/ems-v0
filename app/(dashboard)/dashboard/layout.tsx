// @ts-ignore
import "../../styles/dashboard-styles.css"
import React from "react"
import ProtectedRoutes from "@/lib/protected-routes"
import { ThemeProvider } from "@/components/dashboard/layout/ThemeToggle/theme-provider"
import { DashboardShell } from "@/components/dashboard/layout/DashboardShell"
import { DashboardChrome } from "@/components/dashboard/layout/dashboard-chrome"
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
            {/* Chrome is chosen by role — a PERSISTENT champagne shell for
                vendors (no per-route rebuild flash; artifact + React pages both
                render inside it) and the classic sidebar for admins. See
                dashboard-chrome.tsx. */}
            <DashboardChrome>{children}</DashboardChrome>
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

// @ts-ignore
import "../../styles/dashboard-styles.css"
import React from "react"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import Header from "@/components/dashboard/layout/header"
import ProtectedRoutes from "@/lib/protected-routes"
import { ThemeProvider } from "@/components/dashboard/layout/ThemeToggle/theme-provider"
import { VerificationBanner } from "@/components/auth/VerificationBanner"
import { Metadata } from "next"
import NextTopLoader from "nextjs-toploader"

export const metadata: Metadata = {
  title: "Wedding Wala — Dashboard",
  description: "Wedding Wala operations dashboard",
}

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
      <ProtectedRoutes>
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
      </ProtectedRoutes>
    </ThemeProvider>
  )
}

export default layout

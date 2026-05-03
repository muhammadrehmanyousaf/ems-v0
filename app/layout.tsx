import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { UserProvider } from "@/context/UserContext"
import { BusinessProvider } from "@/context/BusinessContext"
import { NotificationProvider } from "@/context/NotificationContext"
import { ChatProvider } from "@/context/ChatContext"
import { QueryProvider } from "@/lib/providers/query-provider"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { Inter, Playfair_Display, DM_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: {
    default: "AJOINT — Pakistan's Premier Event Planning Platform",
    template: "%s | AJOINT",
  },
  description: "Find, compare, and book the best wedding vendors and event services across Pakistan. Venues, photographers, caterers, decorators, and more — all in one place.",
  keywords: ["wedding planning", "event management", "Pakistan", "wedding vendors", "venues", "photographers", "caterers", "decorators", "book vendors"],
  authors: [{ name: "AJOINT" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AJOINT",
    title: "AJOINT — Pakistan's Premier Event Planning Platform",
    description: "Find, compare, and book the best wedding vendors and event services across Pakistan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AJOINT — Pakistan's Premier Event Planning Platform",
    description: "Find, compare, and book the best wedding vendors and event services across Pakistan.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

// Bridal-grade body font (DM Sans). Wired alongside Inter so existing
// screens keep their typography until each phase migrates them over.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-dm-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${dmSans.variable} font-sans`}
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
              </ChatProvider>
            </NotificationProvider>
            </BusinessProvider>
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

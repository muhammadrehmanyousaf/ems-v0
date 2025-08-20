import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/context/UserContext"
import { QueryProvider } from "@/lib/providers/query-provider"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { BackendStatus } from "@/components/backend-status"
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <UserProvider>
            <main className={inter.className}>{children}</main>
            <Toaster />
            <PerformanceMonitor />
            <BackendStatus className="fixed bottom-4 right-4 z-50 max-w-sm" />
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  )
}


import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/context/UserContext"
import { FavoritesProvider } from "@/context/FavoritesContext"
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
        <UserProvider>
          <FavoritesProvider>
            <main className={inter.className}>{children}</main>
            <Toaster />
          </FavoritesProvider>
        </UserProvider>
      </body>
    </html>
  )
}


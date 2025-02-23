import "../styles/globals.css"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/context/UserContext"
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
          <main className={inter.className}>{children}</main>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}


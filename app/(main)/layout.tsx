import "../globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FavoritesProvider } from "@/contexts/FavoritesContext"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Modern Wedding Platform",
  description: "Find and book the best wedding vendors in your city",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <div lang="en" suppressHydrationWarning>
      <div className={inter.className} suppressHydrationWarning>
        <FavoritesProvider>
          <Header />
          <div>{children}</div>
          <Footer />
        </FavoritesProvider>
      </div>
    </div>
  )
}
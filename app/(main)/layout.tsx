import "../globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { PublicChrome } from "@/components/public-chrome"

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
        <PublicChrome>{children}</PublicChrome>
      </div>
    </div>
  )
}
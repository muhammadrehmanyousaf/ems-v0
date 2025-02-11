import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/context/UserContext"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <UserProvider>
          <main>{children}</main>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}


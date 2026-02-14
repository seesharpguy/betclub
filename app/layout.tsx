import type { Metadata, Viewport } from "next"
import { Inter, Space_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
})

export const metadata: Metadata = {
  title: "BetClub - Peer-to-Peer Bets",
  description:
    "Place bets with friends, track who owes what, and settle up with a simple ledger.",
}

export const viewport: Viewport = {
  themeColor: "#0d0f1a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

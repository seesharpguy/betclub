"use client"

import { AuthProvider } from "@/lib/auth-context"
import { RouterProvider } from "@/lib/router-context"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <RouterProvider>{children}</RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

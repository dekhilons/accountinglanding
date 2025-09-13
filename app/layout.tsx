import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthWrapper } from "@/components/auth-wrapper"
import "./globals.css"
import "react-day-picker/dist/style.css" // Import react-day-picker styles

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>AccountingAI Platform</title>
        <meta name="description" content="AI-Driven Multi-Agent Accounting Platform" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthWrapper>
            {children}
          </AuthWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };

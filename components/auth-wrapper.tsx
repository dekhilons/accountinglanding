"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { Loader2 } from "lucide-react"

interface AuthWrapperProps {
  children: React.ReactNode
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password"
]

export function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
      const authenticated = isAuthenticated()
      const user = getCurrentUser()

      // If it's a public route, allow access
      if (isPublicRoute) {
        setIsAuthChecked(true)
        setIsLoading(false)
        return
      }

      // If not authenticated and trying to access protected route
      if (!authenticated || !user) {
        console.log("User not authenticated, redirecting to login")
        router.push("/auth/login")
        return
      }

      // User is authenticated, allow access
      setIsAuthChecked(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  // Show loading spinner while checking authentication
  if (isLoading || !isAuthChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
          <p className="text-gray-500">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Calculator, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate password reset email
    setTimeout(() => {
      setIsEmailSent(true)
      setIsLoading(false)
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      })
    }, 1500)
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Calculator className="h-10 w-10 text-teal-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">AccountingAI</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>We've sent a password reset link to {email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Didn't receive the email? Check your spam folder or{" "}
                <button onClick={() => setIsEmailSent(false)} className="font-medium text-teal-600 hover:text-teal-500">
                  try again
                </button>
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            <Calculator className="h-10 w-10 text-teal-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">AccountingAI</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Forgot your password?</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Enter your email to receive reset instructions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <div className="mt-6">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

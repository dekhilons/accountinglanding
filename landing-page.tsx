"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Calculator, Users, Bot } from "lucide-react"

export default function Component() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleGetStarted = () => {
    router.push("/auth/signup")
  }

  const handleLogin = () => {
    router.push("/auth/login")
  }

  const handleRequestDemo = () => {
    // In a real app, this would open a demo request form or contact modal
    window.open("mailto:demo@accountingai.com?subject=Demo Request", "_blank")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Calculator className="h-8 w-8 text-teal-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">AccountingAI</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900" onClick={handleLogin}>
                Login
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleGetStarted}>
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                <Button variant="ghost" className="justify-start text-gray-700" onClick={handleLogin}>
                  Login
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                AI-Driven Multi-Agent <span className="text-teal-600">Accounting Platform</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Streamline your financial operations with intelligent automation and real-time insights.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3"
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-3"
                  onClick={handleRequestDemo}
                >
                  Request Demo
                </Button>
              </div>
            </div>

            {/* Hero Illustration Area */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-lg h-80 lg:h-96 bg-gradient-to-br from-teal-50 to-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Calculator className="h-16 w-16 mx-auto mb-4 text-teal-300" />
                  <p className="text-sm">Illustration placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed to transform your accounting workflow with AI-driven automation and insights.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Accounts Payable */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calculator className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Accounts Payable</h3>
              <p className="text-gray-600 leading-relaxed">
                Automate invoice processing, approval workflows, and vendor payments with intelligent document
                recognition and fraud detection.
              </p>
            </div>

            {/* Accounts Receivable */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Accounts Receivable</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamline customer billing, payment tracking, and collections with predictive analytics and automated
                follow-ups.
              </p>
            </div>

            {/* AI Assistants */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center md:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Assistants</h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant answers, generate reports, and receive proactive insights from our intelligent multi-agent
                system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Calculator className="h-6 w-6 text-teal-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">AccountingAI</span>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-600">
              <p>&copy; 2024 AccountingAI. All rights reserved.</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-teal-600 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-teal-600 transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

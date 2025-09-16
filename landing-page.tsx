"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Calculator, Users, Bot, Upload, Zap, BarChart3 } from "lucide-react"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
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
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl" onClick={handleGetStarted}>
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
                <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left lg:col-span-2 max-w-3xl mx-auto lg:mx-0">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                AI-Driven Multi-Agent <span className="text-teal-600">Accounting Platform</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Streamline your financial operations with intelligent automation and real-time insights.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-8 py-3 transition-all duration-300"
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
            <div className="flex justify-center lg:justify-end lg:col-span-1">
              <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-white/60 to-teal-50/60 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-500">
                <div className="text-center text-gray-500">
                  <Calculator className="h-20 w-20 mx-auto mb-4 text-teal-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-stone-50 via-neutral-50 to-gray-50 border border-white/30 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed to transform your accounting workflow with AI-driven automation and insights.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Accounts Payable */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 text-center hover:scale-105 hover:shadow-2xl transition-all duration-500 hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calculator className="h-10 w-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Accounts Payable</h3>
              <p className="text-gray-600 leading-relaxed">
                Automate invoice processing and payments with AI-powered recognition.
              </p>
            </div>

            {/* Accounts Receivable */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 text-center hover:scale-105 hover:shadow-2xl transition-all duration-500 hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Accounts Receivable</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamline billing and collections with predictive insights.
              </p>
            </div>

            {/* AI Assistants */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 text-center md:col-span-2 lg:col-span-1 hover:scale-105 hover:shadow-2xl transition-all duration-500 hover:bg-white/90">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Assistants</h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant answers and proactive insights from AI assistants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 border border-white/30 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with AccountingAI in three simple steps and transform your financial operations.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/30 text-center group hover:scale-105 hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center shadow-md">
                  <Upload className="h-4 w-4 text-teal-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Documents</h3>
              <p className="text-gray-600 leading-relaxed">
                Easily upload your invoices, receipts, and financial documents through our secure platform.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/30 text-center group hover:scale-105 hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center shadow-md">
                  <Zap className="h-4 w-4 text-teal-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Processing</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI analyzes and processes your documents with intelligent automation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/30 text-center group hover:scale-105 hover:shadow-2xl transition-all duration-500 hover:bg-white/80">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center shadow-md">
                  <BarChart3 className="h-4 w-4 text-teal-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Get Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive real-time insights, reports, and recommendations to optimize your finances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 py-12 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Calculator className="h-6 w-6 text-teal-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">AccountingAI</span>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-600">
              <p>&copy; 2025 AccountingAI. All rights reserved.</p>
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
